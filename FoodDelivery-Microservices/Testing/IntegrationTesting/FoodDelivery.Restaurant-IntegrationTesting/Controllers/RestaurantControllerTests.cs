using FoodDelivery.RestaurantService.Data;
using FoodDelivery.RestaurantService.DTOs;
using FoodDelivery.RestaurantService.Models;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace FoodDelivery.Restaurant_IntegrationTesting.Controllers
{
    public class RestaurantControllerTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly HttpClient _client;
        private readonly CustomWebApplicationFactory _factory;

        public RestaurantControllerTests(CustomWebApplicationFactory factory)
        {
            _factory = factory;
            _client  = factory.CreateClient();
        }

        // ── GET /api/Restaurant  (AllowAnonymous) ─────────────────────────────

        [Fact]
        public async Task GetRestaurants_ReturnsListWithSeededData()
        {
            await SeedRestaurantAsync("Integration Diner");
            var response = await _client.GetAsync("/api/Restaurant");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var list = await response.Content.ReadFromJsonAsync<List<RestaurantListDto>>();
            Assert.NotNull(list);
        }

        // ── GET /api/Restaurant/{id}  (AllowAnonymous) ───────────────────────

        [Fact]
        public async Task GetRestaurantById_ReturnsNotFound_WhenIdDoesNotExist()
        {
            var response = await _client.GetAsync("/api/Restaurant/99999");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetRestaurantById_ReturnsOk_WhenExists()
        {
            var r        = await SeedRestaurantAsync("SQLite Grill");
            var response = await _client.GetAsync($"/api/Restaurant/{r.RestaurantId}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        // ── Helpers ───────────────────────────────────────────────────────────

        private async Task<Restaurant> SeedRestaurantAsync(string name)
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<RestaurantDbContext>();

            var r = new Restaurant
            {
                Name = name, Description = "Test", Address = "1 Test St",
                PhoneNumber = "9001112222", Email = $"{Guid.NewGuid():N}@test.com",
                Rating = 4.0m, IsActive = true, IsOpen = true,
                OpeningTime = new TimeSpan(9, 0, 0), ClosingTime = new TimeSpan(22, 0, 0),
                CreatedAt = DateTime.UtcNow, Cuisine = "Test"
            };
            db.Restaurants.Add(r);
            await db.SaveChangesAsync();
            return r;
        }

        private static CreateRestaurantDto BuildCreateDto(string name) => new()
        {
            Name         = name,
            Description  = "A great test restaurant",
            Address      = "99 Test Ave",
            PhoneNumber  = "8001234567",
            Email        = $"{Guid.NewGuid():N}@test.com",
            OpeningTime  = new TimeSpan(8, 0, 0),
            ClosingTime  = new TimeSpan(23, 0, 0),
            Cuisine      = "Fusion",
            IsOpen       = true
        };
    }
}
