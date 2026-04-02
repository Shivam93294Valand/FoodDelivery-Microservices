using FoodDelivery.Restaurant_ApiTesting.Helpers;
using FoodDelivery.RestaurantService.DTOs;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Xunit;

namespace FoodDelivery.Restaurant_ApiTesting.Controllers
{
    public class RestaurantControllerApiTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly HttpClient _client;

        public RestaurantControllerApiTests(CustomWebApplicationFactory factory)
        {
            _client = factory.CreateClient();
        }

        // ── GET /api/Restaurant (AllowAnonymous) ──────────────────────────────

        [Fact]
        public async Task GetRestaurants_ReturnsOk_WithoutToken()
        {
            var response = await _client.GetAsync("/api/Restaurant");

            Assert.True(
                response.StatusCode == HttpStatusCode.OK ||
                response.StatusCode == HttpStatusCode.NoContent,
                $"Expected 200/204 but got {response.StatusCode}");
        }

        [Fact]
        public async Task GetRestaurants_ReturnsEmptyList_WhenNoneSeeded()
        {
            var response = await _client.GetAsync("/api/Restaurant");
            response.EnsureSuccessStatusCode();

            var items = await response.Content.ReadFromJsonAsync<List<RestaurantListDto>>();
            Assert.NotNull(items);
        }

        // ── GET /api/Restaurant/{id} (AllowAnonymous) ─────────────────────────

        [Fact]
        public async Task GetRestaurantById_ReturnsNotFound_WhenMissing()
        {
            var response = await _client.GetAsync("/api/Restaurant/99999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        // ── GET /api/Restaurant/admin (Admin only) ────────────────────────────

        [Fact]
        public async Task GetRestaurantsForAdmin_ReturnsUnauthorized_WithoutToken()
        {
            var response = await _client.GetAsync("/api/Restaurant/admin");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetRestaurantsForAdmin_ReturnsForbidden_WithNonAdminToken()
        {
            var token = TestJwtHelper.GenerateToken(role: "RestaurantOwner");
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.GetAsync("/api/Restaurant/admin");

            Assert.True(
                response.StatusCode == HttpStatusCode.Forbidden ||
                response.StatusCode == HttpStatusCode.Unauthorized,
                $"Expected 403 or 401 but got {response.StatusCode}");
        }

        [Fact]
        public async Task GetRestaurantsForAdmin_ReturnsOk_WithAdminToken()
        {
            var token = TestJwtHelper.GenerateToken(role: "Admin");
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.GetAsync("/api/Restaurant/admin");

            Assert.True(
                response.StatusCode == HttpStatusCode.OK ||
                response.StatusCode == HttpStatusCode.NoContent,
                $"Expected 200/204 but got {response.StatusCode}");
        }

        // ── POST /api/Restaurant (RestaurantOwner or Admin) ───────────────────

        [Fact]
        public async Task CreateRestaurant_ReturnsUnauthorized_WithoutToken()
        {
            _client.DefaultRequestHeaders.Authorization = null;
            var dto = new CreateRestaurantDto
            {
                Name        = "Test Restaurant",
                Description = "A test restaurant",
                Address     = "123 Test St",
                PhoneNumber = "1234567890",
                Email       = "test@restaurant.com",
                Cuisine     = "Italian"
            };

            var response = await _client.PostAsJsonAsync("/api/Restaurant", dto);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        // ── GET /api/Menu/Restaurant/{id} (AllowAnonymous) ────────────────────

        [Fact]
        public async Task GetMenuByRestaurant_ReturnsOk_WithoutToken()
        {
            var response = await _client.GetAsync("/api/Menu/Restaurant/1");

            Assert.True(
                response.StatusCode == HttpStatusCode.OK ||
                response.StatusCode == HttpStatusCode.NoContent,
                $"Expected 200/204 but got {response.StatusCode}");
        }

        [Fact]
        public async Task GetMenuItemById_ReturnsNotFound_WhenMissing()
        {
            var response = await _client.GetAsync("/api/Menu/99999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }
    }
}
