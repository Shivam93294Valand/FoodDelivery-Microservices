using FoodDelivery.CustomerService.DTOs;

namespace FoodDelivery.CustomerService.Services
{
    public interface ICustomerRelatedDetailsService
    {
        Task<CustomerRelatedDetailsDto?> GetCustomerRelatedDetailsAsync(int customerId);
    }

    public class CustomerRelatedDetailsService : ICustomerRelatedDetailsService
    {
        private readonly ICustomerRequestRepository _customerRepository;
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public CustomerRelatedDetailsService(
            ICustomerRequestRepository customerRepository,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration)
        {
            _customerRepository = customerRepository;
            _httpClient = httpClientFactory.CreateClient();
            _configuration = configuration;
        }

        public async Task<CustomerRelatedDetailsDto?> GetCustomerRelatedDetailsAsync(int customerId)
        {
            var customer = await _customerRepository.GetRequestByIdAsync(customerId);
            if (customer == null)
                return null;

            var customerInfo = new CustomerInfoDto
            {
                CustomerId = customer.CustomerId,
                FirstName = customer.FirstName,
                LastName = customer.LastName,
                Email = customer.Email,
                PhoneNumber = customer.PhoneNumber,
                CreatedAt = customer.CreatedAt,
                IsActive = customer.IsActive,
                Addresses = customer.Addresses.Select(a => new CustomerAddressDto
                {
                    AddressId = a.AddressId,
                    CustomerId = a.CustomerId,
                    AddressLine1 = a.AddressLine1,
                    AddressLine2 = a.AddressLine2,
                    City = a.City,
                    State = a.State,
                    ZipCode = a.ZipCode,
                    Landmark = a.Landmark,
                    AddressType = a.AddressType,
                    IsDefault = a.IsDefault,
                    Latitude = a.Latitude,
                    Longitude = a.Longitude
                })
            };

            var orders = await GetCustomerOrdersAsync(customerId);

            var stats = CalculateStats(orders);

            return new CustomerRelatedDetailsDto
            {
                Customer = customerInfo,
                Orders = orders,
                Stats = stats
            };
        }

        private async Task<List<CustomerOrderDto>> GetCustomerOrdersAsync(int customerId)
        {
            var orders = new List<CustomerOrderDto>();

            try
            {
                var orderServiceUrl = _configuration["MicroserviceUrls:OrderServiceBaseUrl"];
                var orderResponse = await _httpClient.GetFromJsonAsync<List<OrderResponseDto>>(
                    $"{orderServiceUrl}/api/Order/customer/{customerId}");

                if (orderResponse == null)
                    return orders;

                foreach (var order in orderResponse)
                {
                    var customerOrder = new CustomerOrderDto
                    {
                        OrderId = order.OrderId,
                        OrderStatus = order.OrderStatus,
                        TotalAmount = order.TotalAmount,
                        PaymentStatus = order.PaymentStatus,
                        PaymentMethod = order.PaymentMethod,
                        OrderDate = order.OrderDate,
                        DeliveryTime = order.DeliveryTime,
                        SpecialInstructions = order.SpecialInstructions,
                        Items = order.OrderItems?.Select(i => new CustomerOrderItemDto
                        {
                            MenuItemId = i.MenuItemId,
                            ItemName = i.ItemName,
                            Quantity = i.Quantity,
                            UnitPrice = i.UnitPrice,
                            TotalPrice = i.TotalPrice
                        }) ?? []
                    };

                    customerOrder.Restaurant = await GetRestaurantInfoAsync(order.RestaurantId);
                    customerOrder.Delivery = await GetDeliveryInfoAsync(order.OrderId);
                    customerOrder.Payment = await GetPaymentInfoAsync(order.OrderId);

                    orders.Add(customerOrder);
                }
            }
            catch
            {
                return new List<CustomerOrderDto>();
            }
            return orders;
        }

        private async Task<CustomerOrderRestaurantDto?> GetRestaurantInfoAsync(int restaurantId)
        {
            try
            {
                var restaurantServiceUrl = _configuration["MicroserviceUrls:RestaurantServiceBaseUrl"];
                var restaurant = await _httpClient.GetFromJsonAsync<RestaurantResponseDto>(
                    $"{restaurantServiceUrl}/api/Restaurant/{restaurantId}");

                if (restaurant == null)
                    return null;

                return new CustomerOrderRestaurantDto
                {
                    RestaurantId = restaurant.RestaurantId,
                    Name = restaurant.Name,
                    Address = restaurant.Address,
                    PhoneNumber = restaurant.PhoneNumber,
                    Rating = restaurant.Rating
                };
            }
            catch
            {
                return null;
            }
        }

        private async Task<CustomerOrderDeliveryDto?> GetDeliveryInfoAsync(int orderId)
        {
            try
            {
                var deliveryServiceUrl = _configuration["MicroserviceUrls:DeliveryServiceBaseUrl"];
                var delivery = await _httpClient.GetFromJsonAsync<DeliveryResponseDto>(
                    $"{deliveryServiceUrl}/api/Delivery/Order/{orderId}");

                if (delivery == null)
                    return null;

                return new CustomerOrderDeliveryDto
                {
                    DeliveryId = delivery.DeliveryId,
                    Status = delivery.Status,
                    AssignedAt = delivery.AssignedAt,
                    PickedUpAt = delivery.PickedUpAt,
                    DeliveredAt = delivery.DeliveredAt,
                    DeliveryPartnerName = delivery.DeliveryPartner?.FullName,
                    DeliveryPartnerPhone = delivery.DeliveryPartner?.PhoneNumber,
                    VehicleType = delivery.DeliveryPartner?.VehicleType,
                    VehicleNumber = delivery.DeliveryPartner?.VehicleNumber
                };
            }
            catch
            {
                return null;
            }
        }

        private async Task<CustomerOrderPaymentDto?> GetPaymentInfoAsync(int orderId)
        {
            try
            {
                var paymentServiceUrl = _configuration["MicroserviceUrls:PaymentServiceBaseUrl"];
                var payment = await _httpClient.GetFromJsonAsync<PaymentResponseDto>(
                    $"{paymentServiceUrl}/api/Payment/order/{orderId}");

                if (payment == null)
                    return null;

                return new CustomerOrderPaymentDto
                {
                    PaymentId = payment.PaymentId,
                    Amount = payment.Amount,
                    PaymentMethod = payment.PaymentMethod,
                    Status = payment.Status,
                    TransactionId = payment.TransactionId,
                    PaymentDate = payment.PaymentDate,
                    CompletedAt = payment.CompletedAt
                };
            }
            catch
            {
                return null;
            }
        }

        private static CustomerStatsDto CalculateStats(List<CustomerOrderDto> orders)
        {
            var stats = new CustomerStatsDto
            {
                TotalOrders = orders.Count,
                TotalSpent = orders.Sum(o => o.TotalAmount),
                CompletedOrders = orders.Count(o => o.OrderStatus == "Delivered"),
                PendingOrders = orders.Count(o => o.OrderStatus != "Delivered" && o.OrderStatus != "Cancelled"),
                CancelledOrders = orders.Count(o => o.OrderStatus == "Cancelled"),
                LastOrderDate = orders.OrderByDescending(o => o.OrderDate).FirstOrDefault()?.OrderDate
            };

            var favoriteRestaurant = orders
                .Where(o => o.Restaurant != null)
                .GroupBy(o => o.Restaurant!.Name)
                .OrderByDescending(g => g.Count())
                .FirstOrDefault();

            stats.FavoriteRestaurant = favoriteRestaurant?.Key;
            return stats;
        }
    }
}