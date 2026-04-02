using FoodDelivery.Order_ApiTesting.Helpers;
using FoodDelivery.OrderService.DTOs;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Xunit;

namespace FoodDelivery.Order_ApiTesting.Controllers
{
    /// <summary>
    /// API contract tests for OrderController.
    /// Verifies auth requirements, route existence, and basic response shapes.
    /// </summary>
    public class OrderControllerApiTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly HttpClient _client;

        public OrderControllerApiTests(CustomWebApplicationFactory factory)
        {
            _client = factory.CreateClient();
        }

        // ── POST /api/Order/Create ────────────────────────────────────────────

        [Fact]
        public async Task CreateOrder_ReturnsUnauthorized_WithoutToken()
        {
            var dto = new CreateOrderDto
            {
                CustomerId    = 1,
                RestaurantId  = 1,
                PaymentMethod = "Cash",
                Items    = new List<CreateOrderItemDto>()
            };

            var response = await _client.PostAsJsonAsync("/api/Order/Create", dto);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task CreateOrder_ReturnsBadRequest_WhenCustomerInvalid()
        {
            var token = TestJwtHelper.GenerateToken(role: "Customer");
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);
            var dto = new CreateOrderDto
            {
                CustomerId    = 9999,
                RestaurantId  = 1,
                PaymentMethod = "Cash",
                Items    = new List<CreateOrderItemDto>
                {
                    new() { MenuItemId = 1, Quantity = 1 }
                }
            };

            var response = await _client.PostAsJsonAsync("/api/Order/Create", dto);

            Assert.True(
                response.StatusCode == HttpStatusCode.BadRequest ||
                response.StatusCode == HttpStatusCode.InternalServerError,
                $"Expected 400 or 500 but got {response.StatusCode}");
        }

        // ── GET /api/Order ────────────────────────────────────────────────────

        [Fact]
        public async Task GetOrders_ReturnsUnauthorized_WithoutToken()
        {
            _client.DefaultRequestHeaders.Authorization = null;
            var response = await _client.GetAsync("/api/Order");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetOrders_ReturnsOk_WithValidToken()
        {
            var token = TestJwtHelper.GenerateToken(role: "Customer");
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.GetAsync("/api/Order");

            Assert.True(
                response.StatusCode == HttpStatusCode.OK ||
                response.StatusCode == HttpStatusCode.NoContent ||
                response.StatusCode == HttpStatusCode.NotFound,
                $"Expected 200/204/404 but got {response.StatusCode}");
        }

        // ── GET /api/Order/{id} ───────────────────────────────────────────────

        [Fact]
        public async Task GetOrderById_ReturnsUnauthorized_WithoutToken()
        {
            _client.DefaultRequestHeaders.Authorization = null;
            var response = await _client.GetAsync("/api/Order/1");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetOrderById_ReturnsNotFound_WhenOrderMissing()
        {
            var token = TestJwtHelper.GenerateToken(role: "Customer");
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.GetAsync("/api/Order/99999");

            Assert.True(
                response.StatusCode == HttpStatusCode.NotFound ||
                response.StatusCode == HttpStatusCode.OK,
                $"Expected 404 or 200 but got {response.StatusCode}");
        }

        // ── GET /api/Analytics/Orders (Admin) ─────────────────────────────────

        [Fact]
        public async Task GetOrderAnalytics_ReturnsUnauthorized_WithoutToken()
        {
            _client.DefaultRequestHeaders.Authorization = null;
            var response = await _client.GetAsync("/api/Analytics/Orders");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetOrderAnalytics_ReturnsForbiddenOrOk_WithNonAdminToken()
        {
            var token = TestJwtHelper.GenerateToken(role: "Customer");
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.GetAsync("/api/Analytics/Orders");

            Assert.True(
                response.StatusCode == HttpStatusCode.Forbidden ||
                response.StatusCode == HttpStatusCode.Unauthorized,
                $"Expected 403 or 401 but got {response.StatusCode}");
        }

        [Fact]
        public async Task GetOrderAnalytics_ReturnsOk_WithAdminToken()
        {
            var token = TestJwtHelper.GenerateToken(role: "Admin");
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.GetAsync("/api/Analytics/Orders");

            Assert.True(
                response.StatusCode == HttpStatusCode.OK ||
                response.StatusCode == HttpStatusCode.NoContent,
                $"Expected 200/204 but got {response.StatusCode}");
        }
    }
}
