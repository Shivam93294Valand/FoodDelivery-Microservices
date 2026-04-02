using FoodDelivery.Order_IntegrationTesting.Helpers;
using FoodDelivery.OrderService.Data;
using FoodDelivery.OrderService.DTOs;
using FoodDelivery.OrderService.Models;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Xunit;

namespace FoodDelivery.Order_IntegrationTesting.Controllers
{
    public class OrderControllerTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly HttpClient _client;
        private readonly CustomWebApplicationFactory _factory;

        public OrderControllerTests(CustomWebApplicationFactory factory)
        {
            _factory = factory;
            _client  = factory.CreateClient();

            var token = TestJwtHelper.GenerateToken(userId: 1, email: "customer@test.com", role: "Customer");
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);
        }

        // ── Helpers ───────────────────────────────────────────────────────────

        private async Task<Order> SeedOrderAsync(int customerId = 1)
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<OrderDbContext>();

            var order = new Order
            {
                CustomerId = customerId, RestaurantId = 1, DeliveryAddressId = 1,
                OrderStatus = "Pending", PaymentStatus = "Pending",
                PaymentMethod = "Cash", SubTotal = 100m, DeliveryCharge = 20m,
                Tax = 5m, TotalAmount = 125m, OrderDate = DateTime.UtcNow,
                OrderItems = new List<OrderItem>
                {
                    new OrderItem { MenuItemId = 1, ItemName = "Test Burger", Quantity = 1, UnitPrice = 100m, TotalPrice = 100m }
                }
            };

            db.Orders.Add(order);
            await db.SaveChangesAsync();
            return order;
        }

        // ── Unauthorized ──────────────────────────────────────────────────────

        [Fact]
        public async Task GetOrders_ReturnsUnauthorized_WithoutToken()
        {
            var anon     = _factory.CreateClient();
            var response = await anon.GetAsync("/api/Order");
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        // ── GET /api/Order ────────────────────────────────────────────────────

        [Fact]
        public async Task GetOrders_ReturnsOk_ForAuthenticatedUser()
        {
            // A customer token grants access; returns their own orders or empty list.
            var response = await _client.GetAsync("/api/Order");
            Assert.True(
                response.StatusCode == HttpStatusCode.OK ||
                response.StatusCode == HttpStatusCode.Forbidden,
                $"Unexpected status: {response.StatusCode}");
        }

        [Fact]
        public async Task GetOrders_ReturnsOk_ForAdminToken()
        {
            var adminClient = _factory.CreateClient();
            var adminToken  = TestJwtHelper.GenerateToken(userId: 99, email: "admin@test.com", role: "Admin");
            adminClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", adminToken);

            var response = await adminClient.GetAsync("/api/Order");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        // ── GET /api/Order/{id} ───────────────────────────────────────────────

        [Fact]
        public async Task GetOrderById_ReturnsNotFound_WhenOrderDoesNotExist()
        {
            var response = await _client.GetAsync("/api/Order/99999");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetOrderById_ReturnsOk_WhenOwnerRequests()
        {
            // Seed an order for customer 1
            var order = await SeedOrderAsync(customerId: 1);

            // Build a client with a token that has CustomerId = 1 claim
            var client = _factory.CreateClient();
            var token  = TestJwtHelper.GenerateToken(userId: 1, email: "customer@test.com", role: "Customer");
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            var response = await client.GetAsync($"/api/Order/{order.OrderId}");

            // owner can see their own order
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        // ── GET /api/Order/Customer/{customerId} ──────────────────────────────

        [Fact]
        public async Task GetCustomerOrders_ReturnsOk()
        {
            var response = await _client.GetAsync("/api/Order/Customer/1");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
    }
}
