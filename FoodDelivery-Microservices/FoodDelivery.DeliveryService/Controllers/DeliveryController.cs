using FoodDelivery.DeliveryService.Repositories;
using FoodDelivery.DeliveryService.DTOs;
using FoodDelivery.DeliveryService.Models;
using FoodDelivery.DeliveryService.Services;
using FoodDelivery.DeliveryService.Events;
using FoodDelivery.Common._Messaging;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Text;
using System.Text.Json;
using System.Collections.Concurrent;
using System.Security.Cryptography;

namespace FoodDelivery.DeliveryService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DeliveryController : ControllerBase
    {
        private sealed record PendingDeliveryOtp(string Otp, DateTime ExpiresAt, int OrderId, int CustomerId);

        private static readonly ConcurrentDictionary<int, PendingDeliveryOtp> DeliveryOtpStore = new();

        private readonly IDeliveryRequestRepository _deliveryRequestRepository;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IMessageBus _messageBus;

        public DeliveryController(
            IDeliveryRequestRepository deliveryRequestRepository, 
            IConfiguration configuration, 
            IEmailService emailService, 
            IHttpClientFactory httpClientFactory,
            IMessageBus messageBus)
        {
            _deliveryRequestRepository = deliveryRequestRepository;
            _configuration = configuration;
            _emailService = emailService;
            _httpClientFactory = httpClientFactory;
            _messageBus = messageBus;
        }

        // POST: api/Delivery/AssignPerson
        [HttpPost("AssignPerson")]
        [AllowAnonymous]
        public async Task<ActionResult<AssignDeliveryPersonResponseDto>> AssignPerson([FromBody] AssignDeliveryPersonDto request)
        {
            // Try to get nearest available delivery person if coordinates are provided
            DeliveryPerson? person = null;
            
            if (request.RestaurantLatitude != 0 && request.RestaurantLongitude != 0)
            {
                person = await _deliveryRequestRepository.GetNearestAvailableDeliveryPersonAsync(
                    request.RestaurantLatitude, 
                    request.RestaurantLongitude
                );
            }
            
            // Fallback to any available person if no nearby person found
            if (person == null)
            {
                person = await _deliveryRequestRepository.GetAvailableDeliveryPersonAsync();
            }

            if (person == null)
            {
                return BadRequest("No delivery persons available");
            }

            // Calculate estimated delivery time based on distance
            double distance = 0;
            if (request.RestaurantLatitude != 0 && request.DeliveryLatitude != 0)
            {
                distance = CalculateDistance(
                    request.RestaurantLatitude, request.RestaurantLongitude,
                    request.DeliveryLatitude, request.DeliveryLongitude
                );
            }

            // Calculate estimated time: (distance/30 km per hour * 60 minutes) + 10 min pickup + 15 min buffer
            int estimatedMinutes = distance > 0 ? (int)(distance / 30.0 * 60) + 25 : 30;
            var estimatedDeliveryTime = DateTime.UtcNow.AddMinutes(estimatedMinutes);

            var delivery = new Delivery
            {
                OrderId = request.OrderId,
                DeliveryPersonId = person.DeliveryPersonId,
                CustomerId = request.CustomerId,
                Status = "Assigned",
                AssignedAt = DateTime.UtcNow,
                RestaurantLatitude = request.RestaurantLatitude,
                RestaurantLongitude = request.RestaurantLongitude,
                DeliveryLatitude = request.DeliveryLatitude,
                DeliveryLongitude = request.DeliveryLongitude,
                EstimatedDeliveryTime = estimatedDeliveryTime
            };

            await _deliveryRequestRepository.AddAsync(delivery);
            person.IsAvailable = false;
            await _deliveryRequestRepository.UpdateAsync(person);

            var response = new AssignDeliveryPersonResponseDto
            {
                DeliveryPersonId = person.DeliveryPersonId,
                DeliveryPersonName = $"{person.FirstName} {person.LastName}",
                PhoneNumber = person.PhoneNumber,
                VehicleType = person.VehicleType,
                EstimatedPickupTime = $"{estimatedMinutes} minutes"
            };

            return Ok(response);
        }

        // GET: api/Delivery
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DeliveryDetailDto>>> GetDeliveries()
        {
            IEnumerable<Delivery> deliveries;
            try
            {
                deliveries = await _deliveryRequestRepository.GetAllAsync();
            }
            catch (Microsoft.Data.SqlClient.SqlException ex)
            {
                return Problem(detail: "Database schema mismatch detected: missing column (CustomerId). Please apply the migration AddCustomerIdToDeliveries.sql and restart the service.", statusCode: 500);
            }

            // Get user role and ID from claims
            var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
            var customerId = User.FindFirst("CustomerId")?.Value;

            // Filter deliveries based on role
            if (userRole == "DeliveryPerson")
            {
                if (!string.IsNullOrEmpty(customerId) && int.TryParse(customerId, out int deliveryPersonId))
                {
                    deliveries = deliveries.Where(d => d.DeliveryPersonId == deliveryPersonId || d.DeliveryPersonId == 0);
                }
            }
            else if (userRole == "Customer")
            {
                // Customers see only deliveries related to their orders
                if (!string.IsNullOrEmpty(customerId) && int.TryParse(customerId, out int custId))
                {
                    deliveries = deliveries.Where(d => d.CustomerId == custId);
                }
                else
                {
                    deliveries = Enumerable.Empty<Delivery>();
                }
            }
            else if (userRole != "Admin")
            {
                // Other roles see nothing
                deliveries = Enumerable.Empty<Delivery>();
            }

            var dtos = deliveries.Select(d => new DeliveryDetailDto
            {
                DeliveryId = d.DeliveryId,
                OrderId = d.OrderId,
                DeliveryPersonId = d.DeliveryPersonId,
                CustomerId = d.CustomerId,
                Status = d.Status,
                AssignedAt = d.AssignedAt,
                PickedUpAt = d.PickedUpAt,
                DeliveredAt = d.DeliveredAt,
                RestaurantLatitude = d.RestaurantLatitude,
                RestaurantLongitude = d.RestaurantLongitude,
                DeliveryLatitude = d.DeliveryLatitude,
                DeliveryLongitude = d.DeliveryLongitude,
                DeliveryPerson = d.DeliveryPerson != null ? new DeliveryPersonDetailDto
                {
                    DeliveryPersonId = d.DeliveryPerson.DeliveryPersonId,
                    FirstName = d.DeliveryPerson.FirstName,
                    LastName = d.DeliveryPerson.LastName,
                    FullName = $"{d.DeliveryPerson.FirstName} {d.DeliveryPerson.LastName}",
                    PhoneNumber = d.DeliveryPerson.PhoneNumber,
                    VehicleType = d.DeliveryPerson.VehicleType,
                    VehicleNumber = d.DeliveryPerson.VehicleNumber,
                    Rating = d.DeliveryPerson.Rating,
                    IsAvailable = d.DeliveryPerson.IsAvailable,
                    JoinedDate = d.DeliveryPerson.JoinedDate
                } : null,
                EstimatedDeliveryTime = d.EstimatedDeliveryTime.HasValue ? GetEstimatedDeliveryTimeString(d, CalculateDistance(d.RestaurantLatitude, d.RestaurantLongitude, d.DeliveryLatitude, d.DeliveryLongitude)) : null,
                DistanceInKm = Math.Round(CalculateDistance(d.RestaurantLatitude, d.RestaurantLongitude, d.DeliveryLatitude, d.DeliveryLongitude), 2)
            });

            return Ok(dtos);
        }

        // GET: api/Delivery/5
        [HttpGet("{id}")]
        public async Task<ActionResult<DeliveryDetailDto>> GetDeliveryById(int id)
        {
            var delivery = await _deliveryRequestRepository.GetByIdAsync(id);
            if (delivery == null) return NotFound();

            // Authorization: customers may only access deliveries for their orders
            var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
            var customerClaim = User.FindFirst("CustomerId")?.Value;
            if (userRole == "Customer")
            {
                if (string.IsNullOrEmpty(customerClaim) || !int.TryParse(customerClaim, out int custId) || custId != delivery.CustomerId)
                {
                    return NotFound();
                }
            }

            double distanceInKm = CalculateDistance(
                delivery.RestaurantLatitude, delivery.RestaurantLongitude,
                delivery.DeliveryLatitude, delivery.DeliveryLongitude);

            var estimatedDeliveryTime = GetEstimatedDeliveryTimeString(delivery, distanceInKm);

            var deliveryDto = new DeliveryDetailDto
            {
                DeliveryId = delivery.DeliveryId,
                OrderId = delivery.OrderId,
                DeliveryPersonId = delivery.DeliveryPersonId,
                CustomerId = delivery.CustomerId,
                Status = delivery.Status,
                AssignedAt = delivery.AssignedAt,
                PickedUpAt = delivery.PickedUpAt,
                DeliveredAt = delivery.DeliveredAt,
                RestaurantLatitude = delivery.RestaurantLatitude,
                RestaurantLongitude = delivery.RestaurantLongitude,
                DeliveryLatitude = delivery.DeliveryLatitude,
                DeliveryLongitude = delivery.DeliveryLongitude,
                DeliveryPerson = delivery.DeliveryPerson != null ? new DeliveryPersonDetailDto
                {
                    DeliveryPersonId = delivery.DeliveryPerson.DeliveryPersonId,
                    FirstName = delivery.DeliveryPerson.FirstName,
                    LastName = delivery.DeliveryPerson.LastName,
                    FullName = $"{delivery.DeliveryPerson.FirstName} {delivery.DeliveryPerson.LastName}",
                    PhoneNumber = delivery.DeliveryPerson.PhoneNumber,
                    VehicleType = delivery.DeliveryPerson.VehicleType,
                    VehicleNumber = delivery.DeliveryPerson.VehicleNumber,
                    Rating = delivery.DeliveryPerson.Rating,
                    IsAvailable = delivery.DeliveryPerson.IsAvailable,
                    JoinedDate = delivery.DeliveryPerson.JoinedDate
                } : null,
                EstimatedDeliveryTime = estimatedDeliveryTime,
                DistanceInKm = Math.Round(distanceInKm, 2)
            };

            return deliveryDto;
        }

        // GET: api/Delivery/Order/5
        [HttpGet("Order/{orderId}")]
        public async Task<ActionResult<DeliveryDetailDto>> GetDeliveryByOrder(int orderId)
        {
            var delivery = await _deliveryRequestRepository.GetByOrderIdAsync(orderId);

            if (delivery == null)
            {
                return NotFound();
            }

            // Calculate distance using Haversine formula
            double distanceInKm = CalculateDistance(
                delivery.RestaurantLatitude, delivery.RestaurantLongitude,
                delivery.DeliveryLatitude, delivery.DeliveryLongitude);

            // Calculate dynamic estimated delivery time
            string estimatedDeliveryTime = GetEstimatedDeliveryTimeString(delivery, distanceInKm);

            // Get delivery person stats if assigned
            int totalDeliveries = 0;
            decimal earningsToday = 0;
            if (delivery.DeliveryPerson != null)
            {
                totalDeliveries = await _deliveryRequestRepository.GetTotalDeliveriesCountAsync(delivery.DeliveryPersonId);
                var todayDeliveries = await _deliveryRequestRepository.GetTodayDeliveriesCountAsync(delivery.DeliveryPersonId);
                // Assuming average earning per delivery from config or default
                var earningPerDelivery = _configuration.GetValue<decimal>("DeliverySettings:EarningPerDelivery", 50m);
                earningsToday = todayDeliveries * earningPerDelivery;
            }

            // Authorization: customers may only access deliveries for their orders
            var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
            var customerClaim = User.FindFirst("CustomerId")?.Value;
            if (userRole == "Customer")
            {
                if (string.IsNullOrEmpty(customerClaim) || !int.TryParse(customerClaim, out int custId) || custId != delivery.CustomerId)
                {
                    return NotFound();
                }
            }

            var deliveryDto = new DeliveryDetailDto
            {
                DeliveryId = delivery.DeliveryId,
                OrderId = delivery.OrderId,
                DeliveryPersonId = delivery.DeliveryPersonId,
                CustomerId = delivery.CustomerId,
                Status = delivery.Status,
                AssignedAt = delivery.AssignedAt,
                PickedUpAt = delivery.PickedUpAt,
                DeliveredAt = delivery.DeliveredAt,
                RestaurantLatitude = delivery.RestaurantLatitude,
                RestaurantLongitude = delivery.RestaurantLongitude,
                DeliveryLatitude = delivery.DeliveryLatitude,
                DeliveryLongitude = delivery.DeliveryLongitude,
                DeliveryPerson = delivery.DeliveryPerson != null ? new DeliveryPersonDetailDto
                {
                    DeliveryPersonId = delivery.DeliveryPerson.DeliveryPersonId,
                    FirstName = delivery.DeliveryPerson.FirstName,
                    LastName = delivery.DeliveryPerson.LastName,
                    FullName = $"{delivery.DeliveryPerson.FirstName} {delivery.DeliveryPerson.LastName}",
                    PhoneNumber = delivery.DeliveryPerson.PhoneNumber,
                    VehicleType = delivery.DeliveryPerson.VehicleType,
                    VehicleNumber = delivery.DeliveryPerson.VehicleNumber,
                    Rating = delivery.DeliveryPerson.Rating,
                    IsAvailable = delivery.DeliveryPerson.IsAvailable,
                    JoinedDate = delivery.DeliveryPerson.JoinedDate,
                    TotalDeliveries = totalDeliveries,
                    EarningsToday = earningsToday
                } : null,
                EstimatedDeliveryTime = estimatedDeliveryTime,
                DistanceInKm = Math.Round(distanceInKm, 2)
            };

            return deliveryDto;
        }

        private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            // Return 0 if coordinates are not set
            if (lat1 == 0 && lon1 == 0 && lat2 == 0 && lon2 == 0)
                return 0;

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

        private string GetEstimatedDeliveryTimeString(Delivery delivery, double distanceInKm)
        {
            // If already delivered, show actual time
            if (delivery.Status == "Delivered" && delivery.DeliveredAt.HasValue)
            {
                return $"Delivered at {delivery.DeliveredAt.Value:HH:mm}";
            }

            // If estimated time is set, use it
            if (delivery.EstimatedDeliveryTime.HasValue)
            {
                var remainingMinutes = (int)(delivery.EstimatedDeliveryTime.Value - DateTime.UtcNow).TotalMinutes;
                if (remainingMinutes > 0)
                {
                    return $"{remainingMinutes}-{remainingMinutes + 10} minutes";
                }
                return "Arriving soon";
            }

            // Calculate based on distance (average 30 km/h + 10 min pickup + buffer)
            if (distanceInKm > 0)
            {
                int estimatedMinutes = (int)(distanceInKm / 30.0 * 60) + 10 + 15;
                return $"{estimatedMinutes}-{estimatedMinutes + 10} minutes";
            }

            return "30-40 minutes";
        }

        // GET: api/Delivery/Persons
        [HttpGet("Persons")]
        public async Task<ActionResult<IEnumerable<DeliveryPersonListDto>>> GetDeliveryPersons()
        {
            var persons = await _deliveryRequestRepository.GetAllDeliveryPersonsAsync();

            var personDtos = persons.Select(p => new DeliveryPersonListDto
            {
                DeliveryPersonId = p.DeliveryPersonId,
                FirstName = p.FirstName,
                LastName = p.LastName,
                FullName = $"{p.FirstName} {p.LastName}",
                PhoneNumber = p.PhoneNumber,
                VehicleType = p.VehicleType,
                Rating = p.Rating,
                IsAvailable = p.IsAvailable
            });

            return Ok(personDtos);
        }

        // GET: api/Delivery/Persons/5
        [HttpGet("Persons/{id}")]
        public async Task<ActionResult<DeliveryPersonDetailDto>> GetDeliveryPerson(int id)
        {
            var person = await _deliveryRequestRepository.GetDeliveryPersonByIdAsync(id);

            if (person == null)
            {
                return NotFound();
            }

            var totalDeliveries = await _deliveryRequestRepository.GetTotalDeliveriesCountAsync(id);
            var todayDeliveries = await _deliveryRequestRepository.GetTodayDeliveriesCountAsync(id);
            var earningPerDelivery = _configuration.GetValue<decimal>("DeliverySettings:EarningPerDelivery", 50m);

            var personDto = new DeliveryPersonDetailDto
            {
                DeliveryPersonId = person.DeliveryPersonId,
                FirstName = person.FirstName,
                LastName = person.LastName,
                FullName = $"{person.FirstName} {person.LastName}",
                PhoneNumber = person.PhoneNumber,
                VehicleType = person.VehicleType,
                VehicleNumber = person.VehicleNumber,
                Rating = person.Rating,
                IsAvailable = person.IsAvailable,
                JoinedDate = person.JoinedDate,
                TotalDeliveries = totalDeliveries,
                EarningsToday = todayDeliveries * earningPerDelivery
            };

            return personDto;
        }

        // POST: api/Delivery/Person
        [HttpPost("Person")]
        public async Task<ActionResult<DeliveryPersonDetailDto>> CreateDeliveryPerson([FromBody] CreateDeliveryPersonDto createDto)
        {
            var person = new DeliveryPerson
            {
                FirstName = createDto.FirstName,
                LastName = createDto.LastName,
                PhoneNumber = createDto.PhoneNumber,
                VehicleType = createDto.VehicleType,
                VehicleNumber = createDto.VehicleNumber,
                JoinedDate = DateTime.UtcNow,
                IsAvailable = true,
                Rating = 5.0m,
                CurrentLatitude = 0,
                CurrentLongitude = 0
            };

            await _deliveryRequestRepository.AddAsync(person);

            var personDto = new DeliveryPersonDetailDto
            {
                DeliveryPersonId = person.DeliveryPersonId,
                FirstName = person.FirstName,
                LastName = person.LastName,
                FullName = $"{person.FirstName} {person.LastName}",
                PhoneNumber = person.PhoneNumber,
                VehicleType = person.VehicleType,
                VehicleNumber = person.VehicleNumber,
                Rating = person.Rating,
                IsAvailable = person.IsAvailable,
                JoinedDate = person.JoinedDate,
                TotalDeliveries = 0,
                EarningsToday = 0
            };

            return CreatedAtAction(nameof(GetDeliveryPerson), new { id = person.DeliveryPersonId }, personDto);
        }

        // PUT: api/Delivery/Persons/5
        [HttpPut("Persons/{id}")]
        public async Task<IActionResult> UpdateDeliveryPerson(int id, [FromBody] UpdateDeliveryPersonDto updateDto)
        {
            var existingPerson = await _deliveryRequestRepository.GetDeliveryPersonByIdAsync(id);
            if (existingPerson == null)
            {
                return NotFound();
            }

            existingPerson.FirstName = updateDto.FirstName;
            existingPerson.LastName = updateDto.LastName;
            existingPerson.PhoneNumber = updateDto.PhoneNumber;
            existingPerson.VehicleType = updateDto.VehicleType;
            existingPerson.VehicleNumber = updateDto.VehicleNumber;

            await _deliveryRequestRepository.UpdateAsync(existingPerson);

            return NoContent();
        }

        // PATCH: api/Delivery/5/Status
        [HttpPatch("{id:int}/Status")]
        public async Task<IActionResult> UpdateDeliveryStatus(int id, [FromBody] UpdateDeliveryStatusDto updateDto)
        {
            var delivery = await _deliveryRequestRepository.GetByIdAsync(id);
            if (delivery == null)
            {
                return NotFound();
            }

            // Validate status transitions - only allow sequential changes
            var validTransitions = new Dictionary<string, string[]>
            {
                ["Assigned"] = new[] { "PickedUp" },
                ["PickedUp"] = new[] { "InTransit" },
                ["InTransit"] = new[] { "Delivered", "Failed" },
                ["Delivered"] = new string[] { }, // No further transitions
                ["Failed"] = new string[] { } // No further transitions
            };

            if (!validTransitions.ContainsKey(delivery.Status) || 
                !validTransitions[delivery.Status].Contains(updateDto.Status))
            {
                return BadRequest($"Cannot transition from {delivery.Status} to {updateDto.Status}");
            }

            delivery.Status = updateDto.Status;

            if (updateDto.Status == "PickedUp")
            {
                delivery.PickedUpAt = DateTime.UtcNow;
            }
            else if (updateDto.Status == "Delivered")
            {
                delivery.DeliveredAt = DateTime.UtcNow;

                var existingPerson = await _deliveryRequestRepository.GetDeliveryPersonByIdAsync(delivery.DeliveryPersonId);
                if (existingPerson != null)
                {
                    existingPerson.IsAvailable = true;
                    await _deliveryRequestRepository.UpdateAsync(existingPerson);
                }
            }

            // Sync with OrderService BEFORE saving delivery status to ensure consistency
            var mappedOrderStatus = MapDeliveryStatusToOrderStatus(updateDto.Status);
            if (!string.IsNullOrWhiteSpace(mappedOrderStatus))
            {
                var orderStatusUpdated = await UpdateOrderStatusFromDeliveryAsync(delivery.OrderId, mappedOrderStatus);
                if (!orderStatusUpdated)
                {
                    Console.WriteLine($"ERROR: Failed to sync order status for OrderId {delivery.OrderId}");
                    return StatusCode(502, "Failed to sync order status with OrderService. Please ensure OrderService is running.");
                }
            }

            // Save delivery status after successful order sync
            await _deliveryRequestRepository.UpdateAsync(delivery);

            // Send email notification to customer for delivered orders
            if (updateDto.Status == "Delivered")
            {
                _ = Task.Run(async () =>
                {
                    try
                    {
                        var customerServiceUrl = _configuration["Services:CustomerService"] ?? "https://localhost:7002";
                        var client = _httpClientFactory.CreateClient();
                        var response = await client.GetAsync($"{customerServiceUrl}/api/Customer/{delivery.CustomerId}");
                        
                        if (response.IsSuccessStatusCode)
                        {
                            var customerJson = await response.Content.ReadAsStringAsync();
                            var customer = System.Text.Json.JsonSerializer.Deserialize<CustomerDto>(customerJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                            
                            if (customer != null && !string.IsNullOrEmpty(customer.Email))
                            {
                                // Publish event for other services
                                var deliveryEvent = new OrderDeliveredEvent
                                {
                                    OrderId = delivery.OrderId,
                                    CustomerId = delivery.CustomerId,
                                    CustomerEmail = customer.Email,
                                    CustomerName = $"{customer.FirstName} {customer.LastName}",
                                    DeliveredAt = delivery.DeliveredAt ?? DateTime.UtcNow
                                };
                                
                                _messageBus.Publish(deliveryEvent, "order-delivered-events", "OrderDelivered");
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Failed to send delivery notification: {ex.Message}");
                    }
                });
            }

            return NoContent();
        }

        // POST: api/Delivery/5/ConfirmPayment
        [HttpPost("{id:int}/ConfirmPayment")]
        public async Task<IActionResult> ConfirmCashPayment(int id)
        {
            var delivery = await _deliveryRequestRepository.GetByIdAsync(id);
            if (delivery == null)
            {
                return NotFound();
            }

            if (delivery.Status != "Delivered")
            {
                return BadRequest("Can only confirm payment for delivered orders");
            }

            // Call order service to update payment status for COD orders
            try
            {
                var orderServiceUrl = _configuration["Services:OrderService"] ?? "https://localhost:7003";
                var client = _httpClientFactory.CreateClient();
                var response = await client.PostAsync($"{orderServiceUrl}/api/Order/{delivery.OrderId}/ConfirmCashPayment", null);
                
                if (!response.IsSuccessStatusCode)
                {
                    return BadRequest("Failed to confirm payment with order service");
                }

                return Ok(new { message = "Cash payment confirmed successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error confirming payment: {ex.Message}");
            }
        }

        // POST: api/Delivery/{id}/send-otp
        [HttpPost("{id:int}/send-otp")]
        public async Task<ActionResult<GenerateDeliveryOtpResponseDto>> SendDeliveryOtp(int id, [FromBody] OtpDeliveryConfirmationDto? request)
        {
            if (request is not null && request.DeliveryId != 0 && request.DeliveryId != id)
            {
                return BadRequest("Delivery ID mismatch");
            }

            var delivery = await _deliveryRequestRepository.GetByIdAsync(id);
            if (delivery == null)
            {
                return NotFound();
            }

            if (string.Equals(delivery.Status, "Delivered", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest("Delivery is already completed.");
            }

            var customerServiceUrl = _configuration["Services:CustomerService"] ?? "https://localhost:7002";
            var client = _httpClientFactory.CreateClient();
            var customerResponse = await client.GetAsync($"{customerServiceUrl.TrimEnd('/')}/api/Customer/{delivery.CustomerId}");

            if (!customerResponse.IsSuccessStatusCode)
            {
                var customerError = await customerResponse.Content.ReadAsStringAsync();
                return StatusCode(502, $"Unable to fetch customer details for OTP delivery. {customerError}");
            }

            var customerJson = await customerResponse.Content.ReadAsStringAsync();
            var customer = JsonSerializer.Deserialize<CustomerDto>(customerJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (customer == null || string.IsNullOrWhiteSpace(customer.Email))
            {
                return BadRequest("Customer email is missing; cannot send OTP.");
            }

            var otp = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
            var expiresAt = DateTime.UtcNow.AddMinutes(10);

            DeliveryOtpStore[id] = new PendingDeliveryOtp(otp, expiresAt, delivery.OrderId, delivery.CustomerId);

            var sent = await _emailService.SendDeliveryOtpEmailAsync(
                customer.Email,
                string.IsNullOrWhiteSpace(customer.FirstName) ? "Customer" : $"{customer.FirstName} {customer.LastName}".Trim(),
                delivery.OrderId,
                id,
                otp,
                expiresAt);

            if (!sent)
            {
                return StatusCode(502, "Failed to send OTP email. Please verify email service configuration.");
            }

            return Ok(new GenerateDeliveryOtpResponseDto
            {
                DeliveryId = id,
                Otp = otp,
                ExpiresAt = expiresAt,
                Message = "OTP generated and sent to customer email successfully."
            });
        }

        // POST: api/Delivery/{id}/verify-otp
        [HttpPost("{id:int}/verify-otp")]
        public async Task<ActionResult<ConfirmDeliveryResponseDto>> VerifyDeliveryOtp(int id, [FromBody] OtpDeliveryConfirmationDto request)
        {
            if (request.DeliveryId != 0 && request.DeliveryId != id)
            {
                return BadRequest("Delivery ID mismatch");
            }

            if (string.IsNullOrWhiteSpace(request.Otp))
            {
                return BadRequest("OTP is required");
            }

            var delivery = await _deliveryRequestRepository.GetByIdAsync(id);
            if (delivery == null)
            {
                return NotFound();
            }

            if (!DeliveryOtpStore.TryGetValue(id, out var pendingOtp))
            {
                return BadRequest("OTP not found. Please send OTP first.");
            }

            if (pendingOtp.ExpiresAt < DateTime.UtcNow)
            {
                DeliveryOtpStore.TryRemove(id, out _);
                return BadRequest("OTP has expired. Please request a new OTP.");
            }

            if (!string.Equals(pendingOtp.Otp, request.Otp.Trim(), StringComparison.Ordinal))
            {
                return BadRequest("Invalid OTP");
            }

            DeliveryOtpStore.TryRemove(id, out _);

            return Ok(new ConfirmDeliveryResponseDto
            {
                Success = true,
                Message = "OTP verified successfully",
                ConfirmedAt = DateTime.UtcNow
            });
        }

        private static string? MapDeliveryStatusToOrderStatus(string deliveryStatus)
        {
            return deliveryStatus switch
            {
                "Assigned" => "Confirmed",
                "PickedUp" => "OutForDelivery",
                "InTransit" => "OutForDelivery",
                "Delivered" => "Delivered",
                "Failed" => "Cancelled",
                _ => null
            };
        }

        private async Task<bool> UpdateOrderStatusFromDeliveryAsync(int orderId, string orderStatus)
        {
            const int maxRetries = 3;
            var retryDelay = TimeSpan.FromSeconds(1);
            var configuredOrderServiceUrl = _configuration["Services:OrderService"] ?? "https://localhost:7003";
            var candidateBaseUrls = GetOrderServiceBaseUrlCandidates(configuredOrderServiceUrl);

            for (int attempt = 0; attempt < maxRetries; attempt++)
            {
                foreach (var baseUrl in candidateBaseUrls)
                {
                    try
                    {
                        var client = _httpClientFactory.CreateClient();

                        var payload = JsonSerializer.Serialize(new { status = orderStatus });
                        using var content = new StringContent(payload, Encoding.UTF8, "application/json");
                        using var request = new HttpRequestMessage(HttpMethod.Patch, $"{baseUrl}/api/Order/{orderId}/status/internal")
                        {
                            Content = content
                        };

                        request.Headers.Add("X-Internal-Service", "DeliveryService");

                        var response = await client.SendAsync(request);

                        if (response.IsSuccessStatusCode)
                        {
                            Console.WriteLine($"Successfully synced order {orderId} status to {orderStatus} via {baseUrl}");
                            return true;
                        }

                        var errorContent = await response.Content.ReadAsStringAsync();
                        Console.WriteLine($"Failed to sync order {orderId} status via {baseUrl} (attempt {attempt + 1}/{maxRetries}). " +
                                        $"Status: {response.StatusCode}, Response: {errorContent}");

                        if (response.StatusCode == System.Net.HttpStatusCode.BadRequest)
                        {
                            // Don't retry for bad requests (invalid transitions, etc.)
                            return false;
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Exception syncing order {orderId} status via {baseUrl} (attempt {attempt + 1}/{maxRetries}): {ex.Message}");
                    }
                }

                // Wait before retrying
                if (attempt < maxRetries - 1)
                {
                    await Task.Delay(retryDelay);
                    retryDelay = TimeSpan.FromSeconds(retryDelay.TotalSeconds * 2); // Exponential backoff
                }
            }

            return false;
        }

        private static List<string> GetOrderServiceBaseUrlCandidates(string configuredUrl)
        {
            var urls = new List<string>();

            void Add(string? value)
            {
                if (string.IsNullOrWhiteSpace(value)) return;
                var normalized = value.Trim().TrimEnd('/');
                if (!urls.Contains(normalized, StringComparer.OrdinalIgnoreCase))
                {
                    urls.Add(normalized);
                }
            }

            Add(configuredUrl);

            if (Uri.TryCreate(configuredUrl, UriKind.Absolute, out var uri)
                && string.Equals(uri.Host, "localhost", StringComparison.OrdinalIgnoreCase))
            {
                if (string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
                {
                    var httpPort = uri.Port switch
                    {
                        7000 => 5000,
                        7001 => 5001,
                        7002 => 5002,
                        7003 => 5003,
                        7004 => 5004,
                        7005 => 5005,
                        7006 => 5006,
                        7007 => 5007,
                        _ => -1
                    };

                    if (httpPort > 0)
                    {
                        Add($"http://localhost:{httpPort}");
                    }
                }
                else if (string.Equals(uri.Scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase))
                {
                    var httpsPort = uri.Port switch
                    {
                        5000 => 7000,
                        5001 => 7001,
                        5002 => 7002,
                        5003 => 7003,
                        5004 => 7004,
                        5005 => 7005,
                        5006 => 7006,
                        5007 => 7007,
                        _ => -1
                    };

                    if (httpsPort > 0)
                    {
                        Add($"https://localhost:{httpsPort}");
                    }
                }
            }

            return urls;
        }

        // PATCH: api/Delivery/Persons/5/Availability
        [HttpPatch("Persons/{id}/Availability")]
        public async Task<IActionResult> UpdatePersonAvailability(int id, [FromBody] UpdateDeliveryPersonAvailabilityDto updateDto)
        {
            var existingPerson = await _deliveryRequestRepository.GetDeliveryPersonByIdAsync(id);
            if (existingPerson == null)
            {
                return NotFound();
            }

            existingPerson.IsAvailable = updateDto.IsAvailable;
            await _deliveryRequestRepository.UpdateAsync(existingPerson);
            return NoContent();
        }
    }
}