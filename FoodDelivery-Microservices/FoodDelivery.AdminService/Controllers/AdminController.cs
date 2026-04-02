using FoodDelivery.AdminService.DTOs;
using FoodDelivery.AdminService.Services; // Ensure IAuthService is available
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodDelivery.AdminService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<AdminController> _logger;

        public AdminController(IAuthService authService, IHttpClientFactory httpClientFactory, ILogger<AdminController> logger)
        {
            _authService = authService;
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        [HttpPost("CreateDeliveryPerson")]
        public async Task<IActionResult> CreateDeliveryPerson([FromBody] CreateDeliveryPersonDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // 1. Create User in AdminService (Auth)
            var registerDto = new RegisterDto
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                Password = "Abc@123", // Default password
                ConfirmPassword = "Abc@123",
                Role = "DeliveryPerson"
            };

            var authResult = await _authService.RegisterAsync(registerDto);
            if (!authResult.Success)
            {
                return BadRequest(authResult.Message);
            }

            // 2. Create Profile in DeliveryService
            // Note: We need to pass the newly created UserId if DeliveryService links by UserId.
            // But RegisterDto/AuthResponse might return UserId. Let's check AuthResponse.
            // Assuming AuthResponse has User object with UserId.

            var userId = authResult.User?.UserId;

            // Determine DeliveryService URL - assuming running locally on known port or specific env var
            // Hardcoding for now based on other configs: DeliveryService usually at https://localhost:7004
            var deliveryServiceUrl = "https://localhost:7004/api/DeliveryPerson";

            var deliveryPerson = new 
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                VehicleType = dto.VehicleType ?? "Bike",
                VehicleNumber = dto.VehicleNumber ?? "Unknown",
                IsAvailable = true,
                CurrentLatitude = 0,
                CurrentLongitude = 0,
                UserId = userId // Linking ID if available
            };

            try
            {
                var client = _httpClientFactory.CreateClient();
                // Need to propagate current Admin's token? Or use a Service-to-Service token?
                // For now, simpler: we are Admin, we have a token in the request header.
                // We forward it? Or easier: DeliveryService POST /api/DeliveryPerson requires Admin role.
                
                string token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
                if (!string.IsNullOrEmpty(token))
                {
                    client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
                }

                var response = await client.PostAsJsonAsync(deliveryServiceUrl, deliveryPerson);
                response.EnsureSuccessStatusCode();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create Delivery Person profile in DeliveryService");
                // Rollback User creation? Hard to do without transactions. 
                // Return success with warning?
                return StatusCode(500, "User created but failed to create Delivery Profile. Manual intervention required. " + ex.Message);
            }

            return Ok(new { Message = "Delivery Person created successfully", UserId = userId, DefaultPassword = "Abc@123" });
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            try 
            {
                // Use InsecureClient to bypass SSL errors for local service-to-service calls
                var client = _httpClientFactory.CreateClient("InsecureClient");
                if (Request.Headers.TryGetValue("Authorization", out var token))
                {
                    client.DefaultRequestHeaders.Add("Authorization", token.ToString());
                }

                // Call CustomerService
                var response = await client.GetAsync("https://localhost:7002/api/Customer");
                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode((int)response.StatusCode, "Failed to fetch users from CustomerService");
                }

                var users = await response.Content.ReadFromJsonAsync<object>();
                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching users");
                return StatusCode(500, ex.Message);
            }
        }

        [HttpGet("restaurants")]
        public async Task<IActionResult> GetRestaurants()
        {
            try
            {
                var client = _httpClientFactory.CreateClient("InsecureClient");
                // Restaurants endpoint is public, but passing token doesn't hurt
                if (Request.Headers.TryGetValue("Authorization", out var token))
                {
                    client.DefaultRequestHeaders.Add("Authorization", token.ToString());
                }

                // Call RestaurantService admin restaurant feed
                var response = await client.GetAsync("https://localhost:7001/api/Restaurant/admin");
                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode((int)response.StatusCode, "Failed to fetch restaurants from RestaurantService");
                }

                var restaurants = await response.Content.ReadFromJsonAsync<object>();
                return Ok(restaurants);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching restaurants");
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPatch("restaurants/{id}/toggle-status")]
        public async Task<IActionResult> ToggleRestaurantStatus(int id)
        {
            try
            {
                var client = _httpClientFactory.CreateClient("InsecureClient");
                if (Request.Headers.TryGetValue("Authorization", out var token))
                {
                    client.DefaultRequestHeaders.Add("Authorization", token.ToString());
                }

                // First, get the current restaurant status
                var getResponse = await client.GetAsync($"https://localhost:7001/api/Restaurant/{id}");
                if (!getResponse.IsSuccessStatusCode)
                {
                    return StatusCode((int)getResponse.StatusCode, "Failed to fetch restaurant from RestaurantService");
                }

                var restaurantJson = await getResponse.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
                bool currentStatus = false;
                
                // Try to get IsActive property (handles both PascalCase and camelCase)
                if (restaurantJson.TryGetProperty("isActive", out var isActiveElement))
                {
                    currentStatus = isActiveElement.GetBoolean();
                }
                else if (restaurantJson.TryGetProperty("IsActive", out var IsActiveElement))
                {
                    currentStatus = IsActiveElement.GetBoolean();
                }
                
                bool newStatus = !currentStatus;
                
                _logger.LogInformation("Toggling restaurant {Id} status from {CurrentStatus} to {NewStatus}", id, currentStatus, newStatus);

                // Toggle the status
                var patchResponse = await client.PatchAsJsonAsync($"https://localhost:7001/api/Restaurant/{id}/activate", newStatus);
                if (!patchResponse.IsSuccessStatusCode)
                {
                    var errorContent = await patchResponse.Content.ReadAsStringAsync();
                    _logger.LogError("Failed to toggle restaurant {Id} status: {Error}", id, errorContent);
                    return StatusCode((int)patchResponse.StatusCode, $"Failed to toggle restaurant status: {errorContent}");
                }

                var result = await patchResponse.Content.ReadFromJsonAsync<object>();
                _logger.LogInformation("Successfully toggled restaurant {Id} status to {NewStatus}", id, newStatus);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling restaurant status for restaurant {Id}", id);
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPut("restaurants/{id}")]
        public async Task<IActionResult> UpdateRestaurant(int id, [FromBody] object restaurantData)
        {
            try
            {
                var client = _httpClientFactory.CreateClient("InsecureClient");
                if (Request.Headers.TryGetValue("Authorization", out var token))
                {
                    client.DefaultRequestHeaders.Add("Authorization", token.ToString());
                }

                // Forward the update request to RestaurantService
                var response = await client.PutAsJsonAsync($"https://localhost:7001/api/Restaurant/{id}", restaurantData);
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    return StatusCode((int)response.StatusCode, $"Failed to update restaurant: {errorContent}");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating restaurant");
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost("restaurants")]
        public async Task<IActionResult> CreateRestaurant([FromBody] object restaurantData)
        {
            try
            {
                var client = _httpClientFactory.CreateClient("InsecureClient");
                if (Request.Headers.TryGetValue("Authorization", out var token))
                {
                    client.DefaultRequestHeaders.Add("Authorization", token.ToString());
                }

                // Forward the create request to RestaurantService
                var response = await client.PostAsJsonAsync("https://localhost:7001/api/Restaurant", restaurantData);
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    return StatusCode((int)response.StatusCode, $"Failed to create restaurant: {errorContent}");
                }

                var result = await response.Content.ReadFromJsonAsync<object>();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating restaurant");
                return StatusCode(500, ex.Message);
            }
        }

        [HttpDelete("restaurants/{id}")]
        public async Task<IActionResult> DeleteRestaurant(int id)
        {
            try
            {
                var client = _httpClientFactory.CreateClient("InsecureClient");
                if (Request.Headers.TryGetValue("Authorization", out var token))
                {
                    client.DefaultRequestHeaders.Add("Authorization", token.ToString());
                }

                // Forward the delete request to RestaurantService
                var response = await client.DeleteAsync($"https://localhost:7001/api/Restaurant/{id}");
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    return StatusCode((int)response.StatusCode, $"Failed to delete restaurant: {errorContent}");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting restaurant");
                return StatusCode(500, ex.Message);
            }
        }

    }
}
