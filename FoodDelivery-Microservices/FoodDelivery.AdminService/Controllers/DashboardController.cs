using FoodDelivery.AdminService.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodDelivery.AdminService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;

        public DashboardController(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        [HttpGet("stats")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetStats()
        {
            // Try to fetch Delivery Persons count from DeliveryService (DeliveryController exposes /api/Delivery/Persons)
            int deliveryPersonsCount = 0;

            try
            {
                var client = _httpClientFactory.CreateClient();
                var resp = await client.GetAsync("https://localhost:7004/api/Delivery/Persons");
                if (resp.IsSuccessStatusCode)
                {
                    var list = await resp.Content.ReadFromJsonAsync<List<object>>();
                    deliveryPersonsCount = list?.Count ?? 0;
                }
            }
            catch (Exception ex)
            {
                // Log and continue - frontend will fallback if needed
                Console.WriteLine("Failed to query DeliveryService for persons: " + ex.Message);
            }

            return Ok(new 
            {
                TotalUsers = 0, // Placeholder, frontend will fetch if 0
                TotalRestaurants = 0,
                DeliveryPersons = deliveryPersonsCount
            });
        }
    }
}
