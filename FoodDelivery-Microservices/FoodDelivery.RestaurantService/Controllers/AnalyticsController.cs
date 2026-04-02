using FoodDelivery.RestaurantService.DTOs;
using FoodDelivery.RestaurantService.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodDelivery.RestaurantService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AnalyticsController : ControllerBase
    {
        private readonly IRestaurantRequestRepository _restaurantService;

        public AnalyticsController(IRestaurantRequestRepository restaurantService)
        {
            _restaurantService = restaurantService;
        }

        [HttpGet("Stats")]
        public async Task<ActionResult<RestaurantStatsDto>> GetStats()
        {
            return Ok(await _restaurantService.GetStatsAsync());
        }
    }
}
