using FoodDelivery.OrderService.DTOs;
using FoodDelivery.OrderService.Repositories;
using FoodDelivery.OrderService.Services; // For Gateway if needed to enrich names
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodDelivery.OrderService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AnalyticsController : ControllerBase
    {
        private readonly IOrderRepository _orderRepository;
        private readonly MicroserviceGateway _gateway;

        public AnalyticsController(IOrderRepository orderRepository, MicroserviceGateway gateway)
        {
            _orderRepository = orderRepository;
            _gateway = gateway;
        }

        [HttpGet("Orders")]
        public async Task<ActionResult<IEnumerable<OrderStatsDto>>> GetOrderStats([FromQuery] string period = "month", [FromQuery] int year = 0)
        {
            if (year == 0) year = DateTime.UtcNow.Year;

            if (period.ToLower() == "year")
            {
                return Ok(await _orderRepository.GetOrderStatsByYearAsync());
            }
            else
            {
                // Default to month
                return Ok(await _orderRepository.GetOrderStatsByMonthAsync(year));
            }
        }

        [HttpGet("TopCustomers")]
        public async Task<ActionResult<IEnumerable<TopCustomerDto>>> GetTopCustomers([FromQuery] int count = 5)
        {
            var topCustomers = await _orderRepository.GetTopCustomersAsync(count);
            
            // Enrich with names from Gateway
            foreach (var customer in topCustomers)
            {
                try
                {
                    var customerDetails = await _gateway.GetCustomer(customer.CustomerId);
                    if (customerDetails != null)
                    {
                        customer.CustomerName = $"{customerDetails.FirstName} {customerDetails.LastName}";
                    }
                }
                catch
                {
                    // Ignore errors, keep ID or placeholder
                }
            }

            return Ok(topCustomers);
        }

        [HttpGet("FrequentItems")]
        public async Task<ActionResult<IEnumerable<FrequentItemDto>>> GetFrequentItems([FromQuery] int count = 5)
        {
            return Ok(await _orderRepository.GetFrequentItemsAsync(count));
        }

        [HttpGet("DailyStats")]
        public async Task<ActionResult<DailyStatsDto>> GetDailyStats()
        {
            return Ok(await _orderRepository.GetDailyStatsAsync(DateTime.UtcNow));
        }
    }
}
