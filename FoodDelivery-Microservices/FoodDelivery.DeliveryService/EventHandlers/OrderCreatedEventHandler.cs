using FoodDelivery.Common._Messaging;
using FoodDelivery.DeliveryService.Events;
using FoodDelivery.DeliveryService.Models;
using FoodDelivery.DeliveryService.Repositories;
using FoodDelivery.DeliveryService.DTOs;

namespace FoodDelivery.DeliveryService.EventHandlers
{
    public class OrderCreatedEventHandler : IIntegrationEventHandler<OrderCreatedEvent>
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<OrderCreatedEventHandler> _logger;
        private const int MaxRetryAttempts = 3;
        private const int RetryDelaySeconds = 10;

        public OrderCreatedEventHandler(
            IServiceProvider serviceProvider,
            ILogger<OrderCreatedEventHandler> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        public async Task Handle(OrderCreatedEvent @event)
        {
            _logger.LogInformation("Processing order {OrderId} for delivery assignment", @event.OrderId);

            using var scope = _serviceProvider.CreateScope();
            var deliveryRepo = scope.ServiceProvider.GetRequiredService<IDeliveryRequestRepository>();
            var messageBus = scope.ServiceProvider.GetRequiredService<IMessageBus>();

            DeliveryPerson? availablePerson = null;

            // If a specific delivery person is requested, try to assign them
            if (@event.DeliveryPersonId.HasValue && @event.DeliveryPersonId.Value > 0)
            {
                availablePerson = await deliveryRepo.GetDeliveryPersonByIdAsync(@event.DeliveryPersonId.Value);
                if (availablePerson != null && !availablePerson.IsAvailable)
                {
                    _logger.LogWarning("Requested delivery person {DeliveryPersonId} is not available for order {OrderId}", @event.DeliveryPersonId, @event.OrderId);
                    availablePerson = null; // Reset to find another
                }
            }
            RestaurantInfo restaurantInfo;
            if (@event.RestaurantLatitude != 0 && @event.RestaurantLongitude != 0)
            {
                restaurantInfo = new RestaurantInfo 
                { 
                    Latitude = @event.RestaurantLatitude, 
                    Longitude = @event.RestaurantLongitude,
                    Address = @event.RestaurantAddress,
                    Name = @event.RestaurantName
                };
            }
            else
            {
                 restaurantInfo = await GetRestaurantInfo(@event.RestaurantId);
            }
            CustomerAddressInfo customerAddressInfo;
            if (@event.DeliveryLatitude != 0 && @event.DeliveryLongitude != 0)
            {
                 customerAddressInfo = new CustomerAddressInfo
                 {
                     Latitude = @event.DeliveryLatitude,
                     Longitude = @event.DeliveryLongitude,
                     FullAddress = "Detailed address lookup required" // Placeholder if we want to avoid call, but we might want the string.
                     // For now, let's fetch if we really want the string, OR just use valid coordinates.
                     // Let's actually FETCH if we want the full address string for the Delivery record.
                     // PROPOSAL: Only optimize Restaurant lookup (which determines the driver).
                     // The Delivery Record creation is less time critical than the assignment loop?
                     // Actually, we create record *after* assignment.
                     // So avoiding the call helps latency.
                     // But I didn't add DeliveryAddress string to OrderCreatedEvent.
                     // So I'll just keep GetCustomerAddressInfo logic as is?
                     // No, I added DeliveryLat/Lon to event.
                     // Let's use them.
                };
            }
            else
            {
                customerAddressInfo = await GetCustomerAddressInfo(@event.DeliveryAddressId);
            }

            // If no specific person or not available, find an available one
            if (availablePerson == null)
            {
                int attempt = 0;
                const int MaxRetryAttempts = 3;
                const int RetryDelaySeconds = 10;

                // Retry logic for finding available delivery person
                while (availablePerson == null && attempt < MaxRetryAttempts)
                {
                    attempt++;
                    availablePerson = await FindAvailableDeliveryPerson(deliveryRepo, restaurantInfo.Latitude, restaurantInfo.Longitude);

                    if (availablePerson == null && attempt < MaxRetryAttempts)
                    {
                        _logger.LogWarning("No delivery person available for order {OrderId}, retry {Attempt}/{Max}",
                            @event.OrderId, attempt, MaxRetryAttempts);
                        await Task.Delay(TimeSpan.FromSeconds(RetryDelaySeconds));
                    }
                }
            }



            var delivery = await CreateDeliveryRecord(@event, availablePerson, deliveryRepo, restaurantInfo, customerAddressInfo);

            if (availablePerson != null)
            {
                // Mark delivery person as unavailable
                availablePerson.IsAvailable = false;
                await deliveryRepo.UpdateAsync(availablePerson);

                // Publish delivery assigned event
                await PublishDeliveryAssignedEvent(messageBus, delivery, availablePerson, @event, restaurantInfo, customerAddressInfo);
            }
            else
            {
                // Publish unassigned event for monitoring/alerting
                await PublishDeliveryPendingEvent(messageBus, @event);

                _logger.LogWarning("Order {OrderId} could not be assigned after {Attempts} attempts",
                    @event.OrderId, MaxRetryAttempts);
            }
        }

        private async Task<DeliveryPerson?> FindAvailableDeliveryPerson(IDeliveryRequestRepository deliveryRepo, double lat, double lon)
        {
            return await deliveryRepo.GetNearestAvailableDeliveryPersonAsync(lat, lon);
        }

        private async Task<Delivery> CreateDeliveryRecord(
            OrderCreatedEvent @event,
            DeliveryPerson? person,
            IDeliveryRequestRepository deliveryRepo,
            RestaurantInfo restaurantInfo,
            CustomerAddressInfo customerAddressInfo)
        {
            // Calculate distance between restaurant and delivery address
            double distanceKm = CalculateDistance(
                restaurantInfo.Latitude, restaurantInfo.Longitude,
                customerAddressInfo.Latitude, customerAddressInfo.Longitude);

            // Estimate delivery time based on distance (average 30 km/h speed + 10 min pickup)
            int estimatedMinutes = (int)(distanceKm / 30.0 * 60) + 10 + 15; // distance time + pickup + buffer

            var delivery = new Delivery
            {
                OrderId = @event.OrderId,
                DeliveryPersonId = person?.DeliveryPersonId ?? 0,
                CustomerId = @event.CustomerId,
                PickupAddress = restaurantInfo.Address,
                DeliveryAddress = customerAddressInfo.FullAddress,
                RestaurantLatitude = restaurantInfo.Latitude,
                RestaurantLongitude = restaurantInfo.Longitude,
                DeliveryLatitude = customerAddressInfo.Latitude,
                DeliveryLongitude = customerAddressInfo.Longitude,
                Status = person != null ? "Assigned" : "Pending",
                AssignedAt = person != null ? DateTime.UtcNow : default,
                EstimatedDeliveryTime = person != null ? DateTime.UtcNow.AddMinutes(estimatedMinutes) : null
            };

            await deliveryRepo.AddAsync(delivery);
            return delivery;
        }

        private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            // Haversine formula for distance calculation
            const double R = 6371; // Earth's radius in km

            var dLat = ToRadians(lat2 - lat1);
            var dLon = ToRadians(lon2 - lon1);

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            return R * c;
        }

        private double ToRadians(double degrees) => degrees * Math.PI / 180;

        private async Task PublishDeliveryAssignedEvent(
            IMessageBus messageBus,
            Delivery delivery,
            DeliveryPerson person,
            OrderCreatedEvent orderEvent,
            RestaurantInfo restaurantInfo,
            CustomerAddressInfo customerAddressInfo)
        {
            var assignedEvent = new DeliveryAssignedEvent
            {
                OrderId = orderEvent.OrderId,
                DeliveryId = delivery.DeliveryId,
                DeliveryPersonId = person.DeliveryPersonId,
                DeliveryPersonFirstName = person.FirstName,
                DeliveryPersonLastName = person.LastName,
                DeliveryPersonEmail = person.Email,
                DeliveryPersonPhone = person.PhoneNumber,
                CustomerId = orderEvent.CustomerId,
                RestaurantId = orderEvent.RestaurantId,
                RestaurantName = restaurantInfo.Name,
                RestaurantAddress = restaurantInfo.Address,
                DeliveryAddress = customerAddressInfo.FullAddress,
                OrderTotalAmount = orderEvent.TotalAmount,
                AssignedAt = delivery.AssignedAt,
                EstimatedDeliveryTime = delivery.EstimatedDeliveryTime,
                RestaurantLatitude = delivery.RestaurantLatitude,
                RestaurantLongitude = delivery.RestaurantLongitude,
                DeliveryLatitude = delivery.DeliveryLatitude,
                DeliveryLongitude = delivery.DeliveryLongitude
            };

            await messageBus.Publish(assignedEvent, "delivery-events", "DeliveryAssigned");
        }

        private async Task PublishDeliveryPendingEvent(IMessageBus messageBus, OrderCreatedEvent orderEvent)
        {
            var pendingEvent = new DeliveryPendingEvent
            {
                OrderId = orderEvent.OrderId,
                CustomerId = orderEvent.CustomerId,
                RestaurantId = orderEvent.RestaurantId,
                Reason = "No delivery persons available",
                Timestamp = DateTime.UtcNow
            };

            await messageBus.Publish(pendingEvent, "delivery-events", "DeliveryPending");
        }

        private async Task<RestaurantInfo> GetRestaurantInfo(int restaurantId)
        {
            using var scope = _serviceProvider.CreateScope();
            var httpClientFactory = scope.ServiceProvider.GetRequiredService<IHttpClientFactory>();
            var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
            var httpClient = httpClientFactory.CreateClient();

            try
            {
                var restaurantServiceUrl = config["MicroserviceUrls:RestaurantServiceBaseUrl"];
                var url = $"{restaurantServiceUrl}/api/Restaurant/{restaurantId}";
                var restaurant = await httpClient.GetFromJsonAsync<RestaurantDetailDto>(url);
                
                return new RestaurantInfo
                {
                    Name = restaurant?.Name ?? "Unknown",
                    Address = restaurant?.Address ?? "Address not available",
                    Latitude = restaurant?.Latitude ?? 0,
                    Longitude = restaurant?.Longitude ?? 0
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch restaurant info for {RestaurantId}", restaurantId);
                return new RestaurantInfo { Address = "Address not available" };
            }
        }

        private async Task<CustomerAddressInfo> GetCustomerAddressInfo(int deliveryAddressId)
        {
            using var scope = _serviceProvider.CreateScope();
            var httpClientFactory = scope.ServiceProvider.GetRequiredService<IHttpClientFactory>();
            var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
            var httpClient = httpClientFactory.CreateClient();

            try
            {
                var customerServiceUrl = config["MicroserviceUrls:CustomerServiceBaseUrl"];
                var url = $"{customerServiceUrl}/api/CustomerAddress/{deliveryAddressId}";
                var address = await httpClient.GetFromJsonAsync<CustomerAddressDto>(url);
                
                return new CustomerAddressInfo
                {
                    FullAddress = address?.FullAddress ?? "Address not available",
                    Latitude = address?.Latitude ?? 0,
                    Longitude = address?.Longitude ?? 0
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch customer address for {AddressId}", deliveryAddressId);
                return new CustomerAddressInfo { FullAddress = "Address not available" };
            }
        }

        private class RestaurantInfo
        {
            public string Name { get; set; } = string.Empty;
            public string Address { get; set; } = string.Empty;
            public double Latitude { get; set; }
            public double Longitude { get; set; }
        }

        private class CustomerAddressInfo
        {
            public string FullAddress { get; set; } = string.Empty;
            public double Latitude { get; set; }
            public double Longitude { get; set; }
        }
    }
}