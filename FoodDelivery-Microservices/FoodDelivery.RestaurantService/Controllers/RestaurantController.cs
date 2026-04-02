using FoodDelivery.RestaurantService.DTOs;
using FoodDelivery.RestaurantService.Models;
using FoodDelivery.RestaurantService.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodDelivery.RestaurantService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RestaurantController : ControllerBase
    {
        private readonly IRestaurantRequestRepository _restaurantService;
        private readonly ILogger<RestaurantController> _logger;

        public RestaurantController(IRestaurantRequestRepository restaurantService, ILogger<RestaurantController> logger)
        {
            _restaurantService = restaurantService;
            _logger = logger;
        }

        // GET: api/Restaurant - Public access for browsing restaurants
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<RestaurantListDto>>> GetRestaurants()
        {
            var restaurants = await _restaurantService.GetAllAsync();

            var restaurantDtos = restaurants
                .OfType<Restaurant>()
                .Select(r => new RestaurantListDto
                {
                    RestaurantId = r.RestaurantId,
                    Name = r.Name,
                    Description = r.Description,
                    Address = r.Address,
                    PhoneNumber = r.PhoneNumber,
                    Email = r.Email,
                    Rating = r.Rating,
                    IsActive = r.IsActive,
                    OpeningTime = r.OpeningTime,
                    ClosingTime = r.ClosingTime,
                    Cuisine = r.Cuisine,
                    ImageUrl = r.ImageUrl,
                    Latitude = r.Latitude,
                    Longitude = r.Longitude,
                    IsOpen = r.IsOpen
                });

            _logger.LogInformation("Retrieved {Count} restaurants", restaurantDtos.Count());
            return Ok(restaurantDtos);
        }

        // GET: api/Restaurant/admin - Admin view with assignment details
        [HttpGet("admin")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<RestaurantListDto>>> GetRestaurantsForAdmin()
        {
            var restaurants = await _restaurantService.GetAllAsync();

            var restaurantDtos = restaurants
                .Select(r => new RestaurantListDto
                {
                    RestaurantId = r.RestaurantId,
                    Name = r.Name,
                    Description = r.Description,
                    Address = r.Address,
                    PhoneNumber = r.PhoneNumber,
                    Email = r.Email,
                    Rating = r.Rating,
                    IsActive = r.IsActive,
                    OpeningTime = r.OpeningTime,
                    ClosingTime = r.ClosingTime,
                    Cuisine = r.Cuisine,
                    ImageUrl = r.ImageUrl,
                    Latitude = r.Latitude,
                    Longitude = r.Longitude,
                    IsOpen = r.IsOpen
                });

            return Ok(restaurantDtos);
        }

        // GET: api/Restaurant/5 - Public access for viewing restaurant details
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<RestaurantDetailDto>> GetRestaurant(int id)
        {
            var restaurant = await _restaurantService.GetIdAsync(id);

            if (restaurant == null)
            {
                _logger.LogWarning("Restaurant with id {Id} not found", id);
                return NotFound();
            }

            var restaurantDto = new RestaurantDetailDto
            {
                RestaurantId = restaurant.RestaurantId,
                Name = restaurant.Name,
                Description = restaurant.Description,
                Address = restaurant.Address,
                PhoneNumber = restaurant.PhoneNumber,
                Email = restaurant.Email,
                Rating = restaurant.Rating,
                IsActive = restaurant.IsActive,
                OpeningTime = restaurant.OpeningTime,
                ClosingTime = restaurant.ClosingTime,
                CreatedAt = restaurant.CreatedAt,
                Cuisine = restaurant.Cuisine,
                ImageUrl = restaurant.ImageUrl,
                Latitude = restaurant.Latitude,
                Longitude = restaurant.Longitude,
                IsOpen = restaurant.IsOpen,
                MenuItems = restaurant.MenuItems.Select(m => new MenuItemListDto
                {
                    MenuItemId = m.MenuItemId,
                    Name = m.Name,
                    Description = m.Description,
                    Price = m.Price,
                    Category = m.Category,
                    ImageUrl = m.ImageUrl,
                    IsAvailable = m.IsAvailable,
                    IsVegetarian = m.IsVegetarian,
                    Rating = m.Rating,
                    PreparationTime = m.PreparationTime,
                    Ingredients = m.Ingredients?.ToArray() ?? Array.Empty<string>(),
                    Allergens = m.Allergens?.ToArray() ?? Array.Empty<string>()
                })
            };

            _logger.LogInformation("Retrieved restaurant with id {Id}", id);
            return restaurantDto;
        }

        // POST: api/Restaurant - Only Admin can create restaurants
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<RestaurantDetailDto>> CreateRestaurant(CreateRestaurantDto createDto)
        {
            var restaurant = new Restaurant
            {
                Name = createDto.Name,
                Description = createDto.Description,
                Address = createDto.Address,
                PhoneNumber = createDto.PhoneNumber,
                Email = createDto.Email,
                OpeningTime = createDto.OpeningTime,
                ClosingTime = createDto.ClosingTime,
                CreatedAt = DateTime.UtcNow,
                IsActive = true,
                Rating = 0,
                Cuisine = createDto.Cuisine,
                ImageUrl = createDto.ImageUrl,
                Latitude = createDto.Latitude,
                Longitude = createDto.Longitude,
                IsOpen = createDto.IsOpen
            };

            await _restaurantService.AddAsync(restaurant);

            var restaurantDto = new RestaurantDetailDto
            {
                RestaurantId = restaurant.RestaurantId,
                Name = restaurant.Name,
                Description = restaurant.Description,
                Address = restaurant.Address,
                PhoneNumber = restaurant.PhoneNumber,
                Email = restaurant.Email,
                Rating = restaurant.Rating,
                IsActive = restaurant.IsActive,
                OpeningTime = restaurant.OpeningTime,
                ClosingTime = restaurant.ClosingTime,
                CreatedAt = restaurant.CreatedAt,
                Cuisine = restaurant.Cuisine,
                ImageUrl = restaurant.ImageUrl,
                Latitude = restaurant.Latitude,
                Longitude = restaurant.Longitude,
                IsOpen = restaurant.IsOpen,
                MenuItems = new List<MenuItemListDto>()
            };

            _logger.LogInformation("Created new restaurant with id {Id} and name {Name}", restaurant.RestaurantId, restaurant.Name);
            return CreatedAtAction(nameof(GetRestaurant), new { id = restaurant.RestaurantId }, restaurantDto);
        }

        // PUT: api/Restaurant/5 - Only Admin can update restaurants
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateRestaurant(int id, UpdateRestaurantDto updateDto)
        {
            var restaurant = await _restaurantService.GetIdAsync(id);
            if (restaurant == null)
            {
                _logger.LogWarning("Attempted to update restaurant with id {Id} but not found", id);
                return NotFound();
            }

            restaurant.Name = updateDto.Name;
            restaurant.Description = updateDto.Description;
            restaurant.Address = updateDto.Address;
            restaurant.PhoneNumber = updateDto.PhoneNumber;
            restaurant.Email = updateDto.Email;
            restaurant.OpeningTime = updateDto.OpeningTime;
            restaurant.ClosingTime = updateDto.ClosingTime;
            restaurant.Cuisine = updateDto.Cuisine;
            restaurant.ImageUrl = updateDto.ImageUrl;
            restaurant.Latitude = updateDto.Latitude;
            restaurant.Longitude = updateDto.Longitude;
            restaurant.IsOpen = updateDto.IsOpen;

            await _restaurantService.UpdateAsync(restaurant);

            _logger.LogInformation("Updated restaurant with id {Id}", id);
            return NoContent();
        }

        // PATCH: api/Restaurant/{id}/status - Admin
        [HttpPatch("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateRestaurantStatus(int id, [FromBody] bool isOpen)
        {
            var restaurant = await _restaurantService.GetIdAsync(id);
            if (restaurant == null) return NotFound();

            restaurant.IsOpen = isOpen;
            await _restaurantService.UpdateAsync(restaurant);
            return NoContent();
        }

        // DELETE: api/Restaurant/5 - Only Admin can delete restaurants
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteRestaurant(int id)
        {
            var restaurant = await _restaurantService.GetIdAsync(id);
            if (restaurant == null)
            {
                _logger.LogWarning("Attempted to delete restaurant with id {Id} but not found", id);
                return NotFound();
            }

            restaurant.IsActive = false;
            await _restaurantService.UpdateAsync(restaurant);

            _logger.LogInformation("Deactivated restaurant with id {Id}", id);
            return NoContent();
        }

        // PATCH: api/Restaurant/{id}/activate - Only Admin can activate/deactivate restaurants
        [HttpPatch("{id}/activate")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateRestaurantActiveStatus(int id, [FromBody] bool isActive)
        {
            var restaurant = await _restaurantService.GetIdAsync(id);
            if (restaurant == null)
            {
                _logger.LogWarning("Attempted to update restaurant status with id {Id} but not found", id);
                return NotFound();
            }

            restaurant.IsActive = isActive;
            await _restaurantService.UpdateAsync(restaurant);

            _logger.LogInformation("Updated restaurant {Id} active status to {IsActive}", id, isActive);
            return Ok(new { message = $"Restaurant {(isActive ? "activated" : "deactivated")} successfully", isActive });
        }

        private bool RestaurantExists(int id)
        {
            return _restaurantService.GetIdAsync(id) != null;
        }
    }
}