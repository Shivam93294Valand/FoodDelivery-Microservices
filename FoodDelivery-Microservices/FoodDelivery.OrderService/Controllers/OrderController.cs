using FoodDelivery.OrderService.DTOs;
using FoodDelivery.OrderService.Models;
using FoodDelivery.OrderService.Repositories;
using FoodDelivery.OrderService.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using FoodDelivery.Common._Messaging;
using FoodDelivery.OrderService.Events;
using System.Security.Claims;

namespace FoodDelivery.OrderService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrderController : ControllerBase
    {
        private readonly IOrderRepository _orderRepository;
        private readonly MicroserviceGateway _gateway;
        private readonly IMessageBus _messageBus;

        public OrderController(IOrderRepository orderRepository, MicroserviceGateway gateway, IMessageBus messageBus)
        {
            _orderRepository = orderRepository;
            _gateway = gateway;
            _messageBus = messageBus;
        }

        // POST: api/Order/Create
        [HttpPost("Create")]
        public async Task<ActionResult<OrderDetailDto>> CreateOrder(CreateOrderDto orderDto)
        {
            // Step 1: Validate Customer and Get Details
            var customer = await _gateway.GetCustomer(orderDto.CustomerId);
            if (customer == null)
            {
                var customerUrl = _gateway.GetCustomerServiceUrl(orderDto.CustomerId);
                return BadRequest($"Invalid Customer ID {orderDto.CustomerId} or Customer Service unavailable at {customerUrl}");
            }

            // Step 2: Validate Restaurant and Get Details
            RestaurantDto restaurant;
            try 
            {
                restaurant = await _gateway.GetRestaurant(orderDto.RestaurantId);
            }
            catch (Exception ex)
            {
                return BadRequest($"Invalid Restaurant ID or Restaurant Service unavailable. Details: {ex.Message}");
            }

            // Step 2.5: Get Delivery Address Details (for coordinates)
            CustomerAddressDto? deliveryAddress = null;
            try
            {
               deliveryAddress = await _gateway.GetCustomerAddress(orderDto.DeliveryAddressId);
            }
            catch (Exception ex)
            {
               // Log but continue
               Console.WriteLine($"Failed to fetch delivery address: {ex.Message}");
            }

            // Step 3: Create Order Object
            var order = new Order
            {
                CustomerId = orderDto.CustomerId,
                RestaurantId = orderDto.RestaurantId,
                DeliveryAddressId = orderDto.DeliveryAddressId,
                DeliveryPersonId = orderDto.DeliveryPersonId,
                OrderStatus = "Pending",
                PaymentStatus = "Pending",
                PaymentMethod = orderDto.PaymentMethod,
                OrderDate = DateTime.UtcNow,
                SpecialInstructions = orderDto.SpecialInstructions,
                OrderItems = new List<OrderItem>()
            };

            decimal subTotal = 0;

            // Step 5: Validate Menu Items and Calculate Prices
            foreach (var item in orderDto.Items)
            {
                var menuItem = await _gateway.GetMenuItem(item.MenuItemId);

                if (menuItem == null || !menuItem.IsAvailable)
                {
                    return BadRequest($"Menu Item {item.MenuItemId} is not available");
                }

                var orderItem = new OrderItem
                {
                    MenuItemId = item.MenuItemId,
                    ItemName = menuItem.Name,
                    Quantity = item.Quantity,
                    UnitPrice = menuItem.Price,
                    TotalPrice = menuItem.Price * item.Quantity,
                    SpecialInstructions = item.SpecialInstructions
                };

                order.OrderItems.Add(orderItem);
                subTotal += orderItem.TotalPrice;
            }

            // Step 6: Calculate Totals
            // In a real app, these might come from a pricing rule engine or database
            order.SubTotal = subTotal;
            order.DeliveryCharge = 50; // Standard delivery charge
            order.Tax = subTotal * 0.05m; // 5% Tax
            order.TotalAmount = order.SubTotal + order.DeliveryCharge + order.Tax;

            // Step 7: Save Order to Database
            await _orderRepository.AddAsync(order);

            // Step 8: Publish event to RabbitMQ for async delivery assignment and email notification
            var orderCreatedEvent = new OrderCreatedEvent
            {
                OrderId = order.OrderId,
                CustomerId = order.CustomerId,
                CustomerName = $"{customer.FirstName} {customer.LastName}",
                CustomerEmail = customer.Email,
                RestaurantId = order.RestaurantId,
                RestaurantName = restaurant.Name,
                RestaurantAddress = restaurant.Address,
                DeliveryAddressId = order.DeliveryAddressId,
                DeliveryPersonId = order.DeliveryPersonId,
                TotalAmount = order.TotalAmount,
                PaymentMethod = order.PaymentMethod,
                OrderDate = order.OrderDate,
                RestaurantLatitude = restaurant.Latitude,
                RestaurantLongitude = restaurant.Longitude,
                DeliveryLatitude = deliveryAddress?.Latitude ?? 0,
                DeliveryLongitude = deliveryAddress?.Longitude ?? 0
            };

            await _messageBus.Publish(
                orderCreatedEvent,
                exchangeName: "order-events",
                eventName: "OrderCreated"
            );

            // Step 9: Process Payment
            if (orderDto.PaymentMethod != "Cash")
            {
                var paymentSuccess = await _gateway.ProcessPayment(
                    order.OrderId,
                    order.CustomerId,
                    order.TotalAmount,
                    orderDto.PaymentMethod
                );

                if (paymentSuccess)
                {
                    order.PaymentStatus = "Completed";
                }
                else
                {
                    order.PaymentStatus = "Failed";
                    order.OrderStatus = "Cancelled";
                }
            }

            // Step 10: Update Order Status
            await _orderRepository.UpdateAsync(order);

            var orderDtoResponse = new OrderDetailDto
            {
                OrderId = order.OrderId,
                CustomerId = order.CustomerId,
                CustomerName = $"{customer.FirstName} {customer.LastName}",
                RestaurantId = order.RestaurantId,
                RestaurantName = restaurant.Name,
                DeliveryPersonId = order.DeliveryPersonId,
                DeliveryAddressId = order.DeliveryAddressId,
                OrderStatus = order.OrderStatus,
                SubTotal = order.SubTotal,
                DeliveryCharge = order.DeliveryCharge,
                Tax = order.Tax,
                TotalAmount = order.TotalAmount,
                PaymentStatus = order.PaymentStatus,
                PaymentMethod = order.PaymentMethod,
                OrderDate = order.OrderDate,
                DeliveryTime = order.DeliveryTime,
                SpecialInstructions = order.SpecialInstructions,
                OrderItems = order.OrderItems.Select(oi => new OrderItemDto
                {
                    OrderItemId = oi.OrderItemId,
                    OrderId = oi.OrderId,
                    MenuItemId = oi.MenuItemId,
                    ItemName = oi.ItemName,
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice,
                    TotalPrice = oi.TotalPrice,
                    SpecialInstructions = oi.SpecialInstructions
                })
            };

            return CreatedAtAction(nameof(GetOrder), new { id = order.OrderId }, orderDtoResponse);
        }

        // GET: api/Order/5
        [HttpGet("{id}")]
        public async Task<ActionResult<OrderDetailDto>> GetOrder(int id)
        {
            var order = await _orderRepository.GetByIdWithItemsAsync(id);

            if (order == null)
            {
                return NotFound();
            }

            // 1. More robust role detection
            var userRoles = User.Claims
                .Where(c => c.Type == System.Security.Claims.ClaimTypes.Role || c.Type == "role")
                .Select(c => c.Value)
                .ToList();

            bool isElevated = userRoles.Any(r => 
                string.Equals(r, "Admin", StringComparison.OrdinalIgnoreCase) || 
                string.Equals(r, "DeliveryPerson", StringComparison.OrdinalIgnoreCase));

            if (!isElevated)
            {
                var customerIdClaim = User.FindFirst("CustomerId")?.Value 
                                     ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(customerIdClaim) || !int.TryParse(customerIdClaim, out int claimCustId) || claimCustId != order.CustomerId)
                {
                    // Return NotFound to avoid revealing existence of the order to unauthorized users
                    return NotFound();
                }
            }

            // 2. Enrich DTO with names from other services
            string restaurantName = "Restaurant #" + order.RestaurantId;
            string customerName = "Customer #" + order.CustomerId;
            string deliveryPersonName = order.DeliveryPersonId.HasValue ? "Delivery Person #" + order.DeliveryPersonId : null;

            try {
                var restaurant = await _gateway.GetRestaurant(order.RestaurantId);
                if (restaurant != null) restaurantName = restaurant.Name;
            } catch { /* fallback to id */ }

            try {
                var customer = await _gateway.GetCustomer(order.CustomerId);
                if (customer != null) customerName = $"{customer.FirstName} {customer.LastName}";
            } catch { /* fallback to id */ }

            if (order.DeliveryPersonId.HasValue) {
                // optional: fetch delivery person name if needed
            }

            var orderDto = new OrderDetailDto
            {
                OrderId = order.OrderId,
                CustomerId = order.CustomerId,
                CustomerName = customerName,
                RestaurantId = order.RestaurantId,
                RestaurantName = restaurantName,
                DeliveryPersonId = order.DeliveryPersonId,
                DeliveryPersonName = deliveryPersonName,
                DeliveryAddressId = order.DeliveryAddressId,
                OrderStatus = order.OrderStatus,
                SubTotal = order.SubTotal,
                DeliveryCharge = order.DeliveryCharge,
                Tax = order.Tax,
                TotalAmount = order.TotalAmount,
                PaymentStatus = order.PaymentStatus,
                PaymentMethod = order.PaymentMethod,
                OrderDate = order.OrderDate,
                DeliveryTime = order.DeliveryTime,
                SpecialInstructions = order.SpecialInstructions,
                OrderItems = order.OrderItems.Select(oi => new OrderItemDto
                {
                    OrderItemId = oi.OrderItemId,
                    OrderId = oi.OrderId,
                    MenuItemId = oi.MenuItemId,
                    ItemName = oi.ItemName,
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice,
                    TotalPrice = oi.TotalPrice,
                    SpecialInstructions = oi.SpecialInstructions
                })
            };

            return orderDto;
        }

        // GET: api/Order/Customer/5
        [HttpGet("Customer/{customerId}")]
        public async Task<ActionResult<IEnumerable<OrderListDto>>> GetCustomerOrders(int customerId)
        {
            var orders = await _orderRepository.GetByCustomerIdAsync(customerId);

            var orderListDtos = orders.Select(o => new OrderListDto
            {
                OrderId = o.OrderId,
                CustomerId = o.CustomerId,
                RestaurantId = o.RestaurantId,
                OrderStatus = o.OrderStatus,
                TotalAmount = o.TotalAmount,
                PaymentStatus = o.PaymentStatus,
                OrderDate = o.OrderDate,
                DeliveryTime = o.DeliveryTime,
                ItemCount = o.OrderItems.Count
            });

            return Ok(orderListDtos);
        }

        // PUT: api/Order/UpdateStatus/5
        [HttpPut("UpdateStatus/{id}")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusDto updateDto)
        {
            if (!IsDeliveryPersonRequest())
            {
                return StatusCode(StatusCodes.Status403Forbidden, "Only delivery person can update order status");
            }

            var order = await _orderRepository.GetByIdAsync(id);

            if (order == null)
            {
                return NotFound();
            }

            if (!IsAllowedOrderStatus(updateDto.Status))
            {
                return BadRequest("Invalid order status");
            }

            if (!IsValidOrderTransition(order.OrderStatus, updateDto.Status))
            {
                return BadRequest($"Cannot transition from {order.OrderStatus} to {updateDto.Status}");
            }

            order.OrderStatus = updateDto.Status;

            if (updateDto.Status == "Delivered")
            {
                order.DeliveryTime = DateTime.UtcNow;
            }

            await _orderRepository.UpdateAsync(order);

            return NoContent();
        }

        // GET: api/Order
        [HttpGet]
        public async Task<ActionResult<IEnumerable<OrderListDto>>> GetOrders()
        {
            var orders = await _orderRepository.GetAllAsync();

            // 1. More robust role detection
            var userRoles = User.Claims
                .Where(c => c.Type == System.Security.Claims.ClaimTypes.Role || c.Type == "role")
                .Select(c => c.Value)
                .ToList();

            bool isElevated = userRoles.Any(r => 
                string.Equals(r, "Admin", StringComparison.OrdinalIgnoreCase) || 
                string.Equals(r, "DeliveryPerson", StringComparison.OrdinalIgnoreCase));

            if (!isElevated)
            {
                var customerIdClaim = User.FindFirst("CustomerId")?.Value 
                                     ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                if (!string.IsNullOrEmpty(customerIdClaim) && int.TryParse(customerIdClaim, out int customerIdInt))
                {
                    orders = orders.Where(o => o.CustomerId == customerIdInt);
                }
                else
                {
                    orders = Enumerable.Empty<Order>();
                }
            }

            var orderListDtos = orders.Select(o => new OrderListDto
            {
                OrderId = o.OrderId,
                CustomerId = o.CustomerId,
                RestaurantId = o.RestaurantId,
                OrderStatus = o.OrderStatus,
                TotalAmount = o.TotalAmount,
                PaymentStatus = o.PaymentStatus,
                OrderDate = o.OrderDate,
                DeliveryTime = o.DeliveryTime,
                ItemCount = o.OrderItems.Count
            });

            return Ok(orderListDtos);
        }

        // PATCH: api/Order/{id}/status
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateOrderStatusPatch(int id, [FromBody] UpdateOrderStatusDto updateDto)
        {
            if (!IsDeliveryPersonRequest())
            {
                return StatusCode(StatusCodes.Status403Forbidden, "Only delivery person can update order status");
            }

            var order = await _orderRepository.GetByIdAsync(id);
            if (order == null) return NotFound();

            if (!IsAllowedOrderStatus(updateDto.Status))
            {
                return BadRequest("Invalid order status");
            }

            if (!IsValidOrderTransition(order.OrderStatus, updateDto.Status))
            {
                return BadRequest($"Cannot transition from {order.OrderStatus} to {updateDto.Status}");
            }

            order.OrderStatus = updateDto.Status;

            if (updateDto.Status == "Delivered")
            {
                order.DeliveryTime = DateTime.UtcNow;
            }

            await _orderRepository.UpdateAsync(order);
            return NoContent();
        }

        // PATCH: api/Order/{id}/status/internal
        [HttpPatch("{id}/status/internal")]
        [AllowAnonymous]
        public async Task<IActionResult> UpdateOrderStatusInternal(int id, [FromBody] UpdateOrderStatusDto updateDto)
        {
            if (!IsInternalDeliveryServiceRequest())
            {
                return StatusCode(StatusCodes.Status403Forbidden, "Only delivery service can update order status internally");
            }

            var order = await _orderRepository.GetByIdAsync(id);
            if (order == null)
            {
                return NotFound();
            }

            if (!IsAllowedOrderStatus(updateDto.Status))
            {
                return BadRequest("Invalid order status");
            }

            if (!IsValidInternalDeliveryTransition(order.OrderStatus, updateDto.Status))
            {
                return BadRequest($"Cannot transition from {order.OrderStatus} to {updateDto.Status}");
            }

            order.OrderStatus = updateDto.Status;

            if (updateDto.Status == "Delivered")
            {
                order.DeliveryTime = DateTime.UtcNow;
            }

            await _orderRepository.UpdateAsync(order);
            return NoContent();
        }

        private static bool IsValidInternalDeliveryTransition(string currentStatus, string nextStatus)
        {
            if (string.Equals(currentStatus, nextStatus, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
            // even if restaurant-side statuses lag behind.
            if (string.Equals(nextStatus, "OutForDelivery", StringComparison.OrdinalIgnoreCase))
            {
                return string.Equals(currentStatus, "Pending", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(currentStatus, "Confirmed", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(currentStatus, "Preparing", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(currentStatus, "OutForDelivery", StringComparison.OrdinalIgnoreCase);
            }

            // Keep normal flow for all other internal transitions.
            return IsValidOrderTransition(currentStatus, nextStatus);
        }

        // POST: api/Order/{id}/cancel
        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelOrder(int id)
        {
            var order = await _orderRepository.GetByIdAsync(id);
            if (order == null) return NotFound();

            // Only allow cancellation if order is not already delivered or cancelled
            if (order.OrderStatus == "Delivered" || order.OrderStatus == "Cancelled")
            {
                return BadRequest("Cannot cancel order in current status");
            }

            order.OrderStatus = "Cancelled";

            // Process refund if payment was completed
            if (order.PaymentStatus == "Completed" && order.PaymentMethod != "Cash")
            {
                try
                {
                    // Call payment service to process refund
                    var refundSuccess = await _gateway.ProcessRefund(order.OrderId, order.TotalAmount);
                    if (refundSuccess)
                    {
                        order.PaymentStatus = "Refunded";
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Refund processing failed: {ex.Message}");
                    // Still cancel the order but mark payment status appropriately
                    order.PaymentStatus = "RefundPending";
                }
            }
            else if (order.PaymentMethod == "Cash")
            {
                // For cash orders, just mark as cancelled
                order.PaymentStatus = "Cancelled";
            }

            await _orderRepository.UpdateAsync(order);
            return Ok(new { message = "Order cancelled successfully", refundStatus = order.PaymentStatus });
        }

        // POST: api/Order/{id}/ConfirmCashPayment
        [HttpPost("{id}/ConfirmCashPayment")]
        [AllowAnonymous]
        public async Task<IActionResult> ConfirmCashPayment(int id)
        {
            var order = await _orderRepository.GetByIdAsync(id);
            if (order == null) return NotFound();

            if (order.PaymentMethod != "Cash")
            {
                return BadRequest("This endpoint is only for cash payment confirmation");
            }

            if (order.OrderStatus != "Delivered")
            {
                return BadRequest("Can only confirm payment for delivered orders");
            }

            order.PaymentStatus = "Completed";
            await _orderRepository.UpdateAsync(order);
            try
            {
                await _gateway.ProcessPayment(order.OrderId, order.CustomerId, order.TotalAmount, "Cash");
            }
            catch (Exception ex)
            {
                // Log but don't fail the confirmation
                Console.WriteLine($"Failed to update payment service: {ex.Message}");
            }

            return Ok(new { message = "Cash payment confirmed successfully" });
        }

        private bool IsDeliveryPersonRequest()
        {
            var roles = User.Claims
                .Where(c => c.Type == ClaimTypes.Role || c.Type == "role")
                .Select(c => c.Value);

            return roles.Any(r => string.Equals(r, "DeliveryPerson", StringComparison.OrdinalIgnoreCase));
        }

        private bool IsInternalDeliveryServiceRequest()
        {
            if (!Request.Headers.TryGetValue("X-Internal-Service", out var serviceHeader))
            {
                return false;
            }

            return string.Equals(serviceHeader.ToString(), "DeliveryService", StringComparison.OrdinalIgnoreCase);
        }

        private static bool IsAllowedOrderStatus(string status)
        {
            var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "Pending", "Confirmed", "Preparing", "OutForDelivery", "Delivered", "Cancelled"
            };

            return !string.IsNullOrWhiteSpace(status) && allowed.Contains(status);
        }

        private static bool IsValidOrderTransition(string currentStatus, string nextStatus)
        {
            var transitions = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
            {
                ["Pending"] = new[] { "Confirmed", "Cancelled" },
                ["Confirmed"] = new[] { "Preparing", "Cancelled" },
                ["Preparing"] = new[] { "OutForDelivery", "Cancelled" },
                ["OutForDelivery"] = new[] { "Delivered" },
                ["Delivered"] = Array.Empty<string>(),
                ["Cancelled"] = Array.Empty<string>()
            };

            if (string.Equals(currentStatus, nextStatus, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            return transitions.TryGetValue(currentStatus, out var allowedNext) &&
                   allowedNext.Contains(nextStatus, StringComparer.OrdinalIgnoreCase);
        }
    }
}