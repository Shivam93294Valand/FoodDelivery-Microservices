using FoodDelivery.PaymentService.DTOs;
using FoodDelivery.PaymentService.Models;
using FoodDelivery.PaymentService.Repositories;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;

namespace FoodDelivery.PaymentService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    [EnableRateLimiting("payment")]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentRepository _paymentRepository;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        public PaymentController(IPaymentRepository paymentRepository, IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _paymentRepository = paymentRepository;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        // POST: api/Payment/Process
        [HttpPost("Process")]
        [AllowAnonymous]
        public async Task<ActionResult<ProcessPaymentResponseDto>> ProcessPayment([FromBody] ProcessPaymentDto request)
        {
            var payment = await _paymentRepository.GetPaymentByOrderIdAsync(request.OrderId);
            var isNewPayment = payment == null;

            if (payment == null)
            {
                payment = new Payment
                {
                    OrderId = request.OrderId,
                    CustomerId = request.CustomerId,
                    Amount = request.Amount,
                    PaymentMethod = request.PaymentMethod,
                    Status = "Pending",
                    PaymentDate = DateTime.UtcNow,
                    TransactionId = Guid.NewGuid().ToString()
                };
            }
            else
            {
                payment.Amount = request.Amount;
                payment.PaymentMethod = request.PaymentMethod;
                payment.PaymentDate = DateTime.UtcNow;

                if (payment.CustomerId == 0)
                {
                    payment.CustomerId = request.CustomerId;
                }

                if (payment.Status == "Completed")
                {
                    return Ok(new ProcessPaymentResponseDto
                    {
                        PaymentId = payment.PaymentId,
                        TransactionId = payment.TransactionId,
                        Status = payment.Status,
                        Success = true,
                        Message = "Payment already processed",
                        CompletedAt = payment.CompletedAt
                    });
                }

                payment.Status = "Pending";
                payment.CompletedAt = null;

                if (string.IsNullOrWhiteSpace(payment.TransactionId))
                {
                    payment.TransactionId = Guid.NewGuid().ToString();
                }
            }

            // If CustomerId is somehow missing (legacy clients), try to fetch order
            if (payment.CustomerId == 0)
            {
                try
                {
                    var httpClient = _httpClientFactory.CreateClient();
                    var orderServiceUrl = _configuration["MicroserviceUrls:OrderServiceBaseUrl"];
                    if (!string.IsNullOrEmpty(orderServiceUrl))
                    {
                        var url = $"{orderServiceUrl}/api/Order/{request.OrderId}";
                        var order = await httpClient.GetFromJsonAsync<OrderInfo>(url);
                        if (order != null)
                        {
                            payment.CustomerId = order.CustomerId;
                        }
                    }
                }
                catch (Exception ex)
                {
                    // Log and proceed; customer id is not strictly required for the payment to process
                }
            }

            if (isNewPayment)
            {
                await _paymentRepository.AddPaymentAsync(payment);
            }
            else
            {
                await _paymentRepository.UpdatePaymentAsync(payment);
            }

            await Task.Delay(1000);

            var random = new Random();
            var success = random.Next(100) < 90;

            if (success)
            {
                payment.Status = "Completed";
                payment.CompletedAt = DateTime.UtcNow;
            }
            else
            {
                payment.Status = "Failed";
            }

            await _paymentRepository.UpdatePaymentAsync(payment);

            var response = new ProcessPaymentResponseDto
            {
                PaymentId = payment.PaymentId,
                TransactionId = payment.TransactionId,
                Status = payment.Status,
                Success = success,
                Message = success ? "Payment processed successfully" : "Payment processing failed",
                CompletedAt = payment.CompletedAt
            };

            if (!success)
            {
                return BadRequest(response);
            }

            return Ok(response);
        }

        // GET: api/Payment/Order/5
        [HttpGet("Order/{orderId}")]
        public async Task<ActionResult<PaymentDetailDto>> GetPaymentByOrder(int orderId)
        {
            var payment = await _paymentRepository.GetPaymentByOrderIdAsync(orderId);

            if (payment == null)
            {
                return NotFound();
            }

            var userRoles = User.Claims
                .Where(c => c.Type == System.Security.Claims.ClaimTypes.Role || c.Type == "role")
                .Select(c => c.Value)
                .ToList();
            
            bool isCustomer = userRoles.Any(r => string.Equals(r, "Customer", StringComparison.OrdinalIgnoreCase));
            bool isAdmin = userRoles.Any(r => string.Equals(r, "Admin", StringComparison.OrdinalIgnoreCase));

            if (isCustomer && !isAdmin)
            {
                var customerIdClaim = User.FindFirst("CustomerId")?.Value 
                                     ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(customerIdClaim) || !int.TryParse(customerIdClaim, out int custId) || custId != payment.CustomerId)
                {
                    return NotFound();
                }
            }

            var paymentDto = new PaymentDetailDto
            {
                PaymentId = payment.PaymentId,
                OrderId = payment.OrderId,
                CustomerId = payment.CustomerId,
                Amount = payment.Amount,
                PaymentMethod = payment.PaymentMethod,
                Status = payment.Status,
                PaymentDate = payment.PaymentDate,
                TransactionId = payment.TransactionId,
                CompletedAt = payment.CompletedAt
            };

            return paymentDto;
        }

        // GET: api/Payment/5
        [HttpGet("{id}")]
        public async Task<ActionResult<PaymentDetailDto>> GetPayment(int id)
        {
            var payment = await _paymentRepository.GetPaymentByIdAsync(id);

            if (payment == null)
            {
                return NotFound();
            }

            var userRoles = User.Claims
                .Where(c => c.Type == System.Security.Claims.ClaimTypes.Role || c.Type == "role")
                .Select(c => c.Value)
                .ToList();
            
            bool isCustomer = userRoles.Any(r => string.Equals(r, "Customer", StringComparison.OrdinalIgnoreCase));
            bool isAdmin = userRoles.Any(r => string.Equals(r, "Admin", StringComparison.OrdinalIgnoreCase));

            if (isCustomer && !isAdmin)
            {
                var customerIdClaim = User.FindFirst("CustomerId")?.Value 
                                     ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(customerIdClaim) || !int.TryParse(customerIdClaim, out int custId) || custId != payment.CustomerId)
                {
                    return NotFound();
                }
            }

            var paymentDto = new PaymentDetailDto
            {
                PaymentId = payment.PaymentId,
                OrderId = payment.OrderId,
                CustomerId = payment.CustomerId,
                Amount = payment.Amount,
                PaymentMethod = payment.PaymentMethod,
                Status = payment.Status,
                PaymentDate = payment.PaymentDate,
                TransactionId = payment.TransactionId,
                CompletedAt = payment.CompletedAt
            };

            return paymentDto;
        }

        // GET: api/Payment
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PaymentListDto>>> GetPayments()
        {
            IEnumerable<Payment> payments;
            try
            {
                payments = await _paymentRepository.GetAllAsync();
            }
            catch (Microsoft.Data.SqlClient.SqlException ex)
            {
                return Problem(detail: "Database schema mismatch detected: missing column (CustomerId). Please apply the migration AddCustomerIdToPayments.sql and restart the service.", statusCode: 500);
            }

            // 1. More robust role detection
            var userRoles = User.Claims
                .Where(c => c.Type == System.Security.Claims.ClaimTypes.Role || c.Type == "role")
                .Select(c => c.Value)
                .ToList();

            bool isAdmin = userRoles.Any(r => string.Equals(r, "Admin", StringComparison.OrdinalIgnoreCase));
            bool isCustomer = userRoles.Any(r => string.Equals(r, "Customer", StringComparison.OrdinalIgnoreCase));

            if (isAdmin) {
            } else if (isCustomer) {
                var customerIdClaim = User.FindFirst("CustomerId")?.Value 
                                     ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                if (!string.IsNullOrEmpty(customerIdClaim) && int.TryParse(customerIdClaim, out int custId)) {
                    payments = payments.Where(p => p.CustomerId == custId);
                } else {
                    payments = Enumerable.Empty<Payment>();
                }
            } else {
                // Non-customer/non-admin roles see nothing by default 
                payments = Enumerable.Empty<Payment>();
            }

            payments = payments
                .GroupBy(p => p.OrderId)
                .Select(g => g
                    .OrderByDescending(p => string.Equals(p.Status, "Completed", StringComparison.OrdinalIgnoreCase))
                    .ThenByDescending(p => p.CompletedAt ?? p.PaymentDate)
                    .ThenByDescending(p => p.PaymentId)
                    .First());

            var dtos = payments.Select(p => new PaymentListDto
            {
                PaymentId = p.PaymentId,
                OrderId = p.OrderId,
                CustomerId = p.CustomerId,
                Amount = p.Amount,
                PaymentMethod = p.PaymentMethod,
                PaymentDate = p.PaymentDate,
                Status = p.Status
            });

            return Ok(dtos);
        }

        // POST: api/Payment/Refund
        [HttpPost("Refund")]
        public async Task<ActionResult<RefundResponseDto>> RefundPayment(InitiateRefundDto refundDto)
        {
            var payment = await _paymentRepository.GetPaymentByIdAsync(refundDto.PaymentId);

            if (payment == null)
            {
                return NotFound("Payment not found");
            }

            if (payment.Status != "Completed")
            {
                return BadRequest(new RefundResponseDto
                {
                    PaymentId = refundDto.PaymentId,
                    Success = false,
                    Message = "Only completed payments can be refunded"
                });
            }

            await Task.Delay(500);

            payment.Status = "Refunded";
            await _paymentRepository.UpdatePaymentAsync(payment);

            var response = new RefundResponseDto
            {
                PaymentId = payment.PaymentId,
                RefundTransactionId = Guid.NewGuid().ToString(),
                RefundAmount = refundDto.RefundAmount,
                Status = "Refunded",
                Success = true,
                Message = "Refund processed successfully",
                RefundedAt = DateTime.UtcNow
            };

            return Ok(response);
        }

        // POST: api/Payment/Verify
        [HttpPost("Verify")]
        public async Task<ActionResult<VerifyPaymentResponseDto>> VerifyPayment(VerifyPaymentDto verifyDto)
        {
            var payment = await _paymentRepository.GetPaymentByOrderIdAsync(verifyDto.OrderId);

            if (payment == null || payment.TransactionId != verifyDto.TransactionId)
            {
                return Ok(new VerifyPaymentResponseDto
                {
                    IsValid = false,
                    Status = "Invalid"
                });
            }

            var response = new VerifyPaymentResponseDto
            {
                IsValid = true,
                Status = payment.Status,
                Amount = payment.Amount
            };

            return Ok(response);
        }

        private class OrderInfo
        {
            public int OrderId { get; set; }
            public int CustomerId { get; set; }
        }
    }
}