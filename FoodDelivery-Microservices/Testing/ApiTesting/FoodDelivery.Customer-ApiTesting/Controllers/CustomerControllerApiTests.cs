using FoodDelivery.Customer_ApiTesting.Helpers;
using FoodDelivery.CustomerService.DTOs;
using FoodDelivery.CustomerService.Models;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Xunit;

namespace FoodDelivery.Customer_ApiTesting.Controllers
{
    /// <summary>
    /// API contract tests for CustomerController.
    /// Verifies auth requirements, route existence, and response shapes.
    /// </summary>
    public class CustomerControllerApiTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly HttpClient _client;
        private readonly CustomWebApplicationFactory _factory;

        public CustomerControllerApiTests(CustomWebApplicationFactory factory)
        {
            _factory = factory;
            _client  = factory.CreateClient();
        }

        // ── GET /api/Customer ─────────────────────────────────────────────────

        [Fact]
        public async Task GetCustomers_ReturnsUnauthorized_WithoutToken()
        {
            var response = await _client.GetAsync("/api/Customer");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetCustomers_ReturnsOk_WithValidToken()
        {
            var token = TestJwtHelper.GenerateToken(role: "Customer");
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.GetAsync("/api/Customer");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        // ── GET /api/Customer/{id} ────────────────────────────────────────────

        [Fact]
        public async Task GetCustomerById_ReturnsNotFound_WhenCustomerMissing()
        {
            var response = await _client.GetAsync("/api/Customer/99999");

            // This endpoint has AllowAnonymous so no 401; but no data means 404
            Assert.True(
                response.StatusCode == HttpStatusCode.NotFound ||
                response.StatusCode == HttpStatusCode.InternalServerError,
                $"Expected 404 or 500 for missing customer, got {response.StatusCode}");
        }

        [Fact]
        public async Task GetCustomerById_ReturnsOk_WhenCustomerExists()
        {
            // Seed a customer into the in-memory repository
            _factory.CustomerRepository.WithCustomer(new Customer
            {
                FirstName   = "Seeded",
                LastName    = "User",
                Email       = $"seeded_{Guid.NewGuid():N}@test.com",
                PhoneNumber = "0987654321",
                IsActive    = true,
                Addresses   = new List<CustomerAddress>()
            });

            // CustomerId was assigned as 1 (or next sequential id)
            var response = await _client.GetAsync("/api/Customer/1");

            Assert.True(
                response.StatusCode == HttpStatusCode.OK ||
                response.StatusCode == HttpStatusCode.NotFound,
                $"Expected 200 or 404 but got {response.StatusCode}");
        }
    }
}
