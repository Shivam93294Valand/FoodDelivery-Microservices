using FoodDelivery.Delivery_ApiTesting.Helpers;
using FoodDelivery.DeliveryService.DTOs;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Xunit;

namespace FoodDelivery.Delivery_ApiTesting.Controllers
{
    /// <summary>
    /// API contract tests for DeliveryController and DeliveryPersonController.
    /// </summary>
    public class DeliveryControllerApiTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly HttpClient _client;

        public DeliveryControllerApiTests(CustomWebApplicationFactory factory)
        {
            _client = factory.CreateClient();
        }

        // ── GET /api/Delivery ─────────────────────────────────────────────────

        [Fact]
        public async Task GetDeliveries_ReturnsUnauthorized_WithoutToken()
        {
            var response = await _client.GetAsync("/api/Delivery");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetDeliveries_ReturnsOk_WithValidToken()
        {
            var token = TestJwtHelper.GenerateToken(role: "Admin");
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.GetAsync("/api/Delivery");

            Assert.True(
                response.StatusCode == HttpStatusCode.OK ||
                response.StatusCode == HttpStatusCode.NoContent,
                $"Expected 200/204 but got {response.StatusCode}");
        }

        // ── POST /api/Delivery/AssignPerson (AllowAnonymous) ──────────────────

        [Fact]
        public async Task AssignPerson_ReturnsBadRequest_WhenBodyIsEmpty()
        {
            var response = await _client.PostAsJsonAsync("/api/Delivery/AssignPerson", new { });

            Assert.True(
                response.StatusCode == HttpStatusCode.BadRequest ||
                response.StatusCode == HttpStatusCode.NotFound,
                $"Expected 400 or 404, got {response.StatusCode}");
        }

        [Fact]
        public async Task AssignPerson_ReturnsExpectedStatusCode_WithValidRequest()
        {
            var request = new AssignDeliveryPersonDto
            {
                OrderId             = 1,
                RestaurantLatitude  = 0,
                RestaurantLongitude = 0
            };

            var response = await _client.PostAsJsonAsync("/api/Delivery/AssignPerson", request);

            // No delivery persons seeded → NotFound or OK with null person
            Assert.True(
                response.StatusCode == HttpStatusCode.OK     ||
                response.StatusCode == HttpStatusCode.NotFound ||
                response.StatusCode == HttpStatusCode.BadRequest,
                $"Unexpected status {response.StatusCode}");
        }

        // ── GET /api/DeliveryPerson ───────────────────────────────────────────

        [Fact]
        public async Task GetAllDeliveryPersons_ReturnsUnauthorized_WithoutToken()
        {
            _client.DefaultRequestHeaders.Authorization = null;
            var response = await _client.GetAsync("/api/DeliveryPerson");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetAllDeliveryPersons_ReturnsOk_WithAdminToken()
        {
            var token = TestJwtHelper.GenerateToken(role: "Admin");
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.GetAsync("/api/DeliveryPerson");

            Assert.True(
                response.StatusCode == HttpStatusCode.OK ||
                response.StatusCode == HttpStatusCode.NoContent,
                $"Expected 200/204 but got {response.StatusCode}");
        }

        [Fact]
        public async Task GetDeliveryPersonById_ReturnsNotFound_WhenPersonMissing()
        {
            var response = await _client.GetAsync("/api/DeliveryPerson/99999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }
    }
}
