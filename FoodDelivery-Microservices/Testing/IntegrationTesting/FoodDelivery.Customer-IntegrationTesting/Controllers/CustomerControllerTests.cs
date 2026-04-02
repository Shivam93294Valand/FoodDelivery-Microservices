using FoodDelivery.Customer_IntegrationTesting.Helpers;
using FoodDelivery.CustomerService.DTOs;
using FoodDelivery.CustomerService.Models;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Xunit;

namespace FoodDelivery.Customer_IntegrationTesting.Controllers
{
    public class CustomerControllerTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly HttpClient _client;
        private readonly CustomWebApplicationFactory _factory;

        public CustomerControllerTests(CustomWebApplicationFactory factory)
        {
            _factory = factory;
            _client  = factory.CreateClient();

            // Attach a valid JWT to all requests so [Authorize] passes.
            var token = TestJwtHelper.GenerateToken(customerId: 1, email: "admin@test.com");
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);
        }

        // ── GET /api/Customer ─────────────────────────────────────────────────

        [Fact]
        public async Task GetCustomers_ReturnsOk_WithEmptyList()
        {
            var response = await _client.GetAsync("/api/Customer");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var list = await response.Content.ReadFromJsonAsync<List<CustomerListDto>>();
            Assert.NotNull(list);
        }

        [Fact]
        public async Task GetCustomers_ReturnsOk_WithSeededCustomers()
        {
            // Arrange – seed customers
            _factory.CustomerRepository.WithCustomer(new Customer
            {
                FirstName = "Seeded", LastName = "One",
                Email = $"seeded_{Guid.NewGuid():N}@test.com",
                Password = "hash", IsActive = true, CreatedAt = DateTime.UtcNow
            });
            var response = await _client.GetAsync("/api/Customer");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var list = await response.Content.ReadFromJsonAsync<List<CustomerListDto>>();
            Assert.NotNull(list);
            Assert.True(list!.Count >= 1);
        }

        // ── GET /api/Customer/{id} (AllowAnonymous) ───────────────────────────

        [Fact]
        public async Task GetCustomerById_ReturnsNotFound_WhenIdDoesNotExist()
        {
            // Act – use a client WITHOUT a token to test AllowAnonymous attribute
            var anon   = _factory.CreateClient();
            var response = await anon.GetAsync("/api/Customer/99999");

            // Assert – 404 returned because customer 99999 is not in the in-memory store
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetCustomerById_ReturnsOk_WhenCustomerExists()
        {
            var customer = new Customer
            {
                FirstName = "Found", LastName = "Me",
                Email = $"found_{Guid.NewGuid():N}@test.com",
                Password = "hash", IsActive = true, CreatedAt = DateTime.UtcNow
            };
            _factory.CustomerRepository.WithCustomer(customer);
            var response = await _client.GetAsync($"/api/Customer/{customer.CustomerId}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        // ── POST /api/Customer ────────────────────────────────────────────────

        [Fact]
        public async Task CreateCustomer_ReturnsCreated_WithValidData()
        {
            var dto = new CreateCustomerDto
            {
                FirstName   = "New",
                LastName    = "Customer",
                Email       = $"create_{Guid.NewGuid():N}@test.com",
                PhoneNumber = "8001112222",
                Password    = "CreatePass@1",
                Addresses   = new List<CreateCustomerAddressDto>()
            };
            var response = await _client.PostAsJsonAsync("/api/Customer", dto);

            // Assert – 201 Created
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        }

        // ── Unauthorized access ───────────────────────────────────────────────

        [Fact]
        public async Task GetCustomers_ReturnsUnauthorized_WithoutToken()
        {
            // Arrange – no auth header
            var anonClient = _factory.CreateClient();
            var response = await anonClient.GetAsync("/api/Customer");
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }
    }
}
