using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using FoodDelivery.Delivery_IntegrationTesting.Helpers;
using Microsoft.Extensions.DependencyInjection;
using FoodDelivery.DeliveryService.Data;
using FoodDelivery.DeliveryService.Models;
using Xunit;

namespace FoodDelivery.Delivery_IntegrationTesting.Controllers
{
    public class DeliveryControllerTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly HttpClient _client;
        private readonly CustomWebApplicationFactory _factory;
        private static readonly JsonSerializerOptions _jsonOptions = new() { PropertyNameCaseInsensitive = true };

        public DeliveryControllerTests(CustomWebApplicationFactory factory)
        {
            _factory = factory;
            _client = factory.CreateClient();
        }

        private void AuthorizeAs(string token)
        {
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }

        private void ClearAuth()
        {
            _client.DefaultRequestHeaders.Authorization = null;
        }

        private async Task SeedDeliveryPersonAndDelivery(int personId = 1, int orderId = 10, int customerId = 100)
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<DeliveryDbContext>();

            if (!db.DeliveryPersons.Any(p => p.DeliveryPersonId == personId))
            {
                db.DeliveryPersons.Add(new DeliveryPerson
                {
                    DeliveryPersonId = personId,
                    FirstName = "Test",
                    LastName = "Driver",
                    Email = "driver@test.com",
                    PhoneNumber = "9876543210",
                    VehicleType = "Bike",
                    VehicleNumber = "GJ01AB0001",
                    Password = "hashed",
                    IsAvailable = true
                });
            }

            if (!db.Deliveries.Any(d => d.OrderId == orderId))
            {
                db.Deliveries.Add(new Delivery
                {
                    OrderId = orderId,
                    DeliveryPersonId = personId,
                    CustomerId = customerId,
                    Status = "Pending",
                    AssignedAt = DateTime.UtcNow
                });
            }

            await db.SaveChangesAsync();
        }

        // ─── Unauthorized Tests ───────────────────────────────────────────────

        [Fact]
        public async Task GetDeliveries_WithoutToken_ReturnsUnauthorized()
        {
            ClearAuth();
            var response = await _client.GetAsync("/api/Delivery");
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetDeliveryById_WithoutToken_ReturnsUnauthorized()
        {
            ClearAuth();
            var response = await _client.GetAsync("/api/Delivery/1");
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetDeliveryPersons_WithoutToken_ReturnsUnauthorized()
        {
            ClearAuth();
            var response = await _client.GetAsync("/api/Delivery/Persons");
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        // ─── Admin access tests ───────────────────────────────────────────────

        [Fact]
        public async Task GetDeliveries_AsAdmin_ReturnsOk()
        {
            var token = TestJwtHelper.GenerateAdminToken(1, "admin@test.com");
            AuthorizeAs(token);

            var response = await _client.GetAsync("/api/Delivery");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task GetDeliveryPersons_AsAdmin_ReturnsOk()
        {
            var token = TestJwtHelper.GenerateAdminToken(1, "admin@test.com");
            AuthorizeAs(token);

            var response = await _client.GetAsync("/api/Delivery/Persons");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task GetDeliveryPersons_AsAdmin_SeededData_ReturnsListWithItems()
        {
            await SeedDeliveryPersonAndDelivery(personId: 50, orderId: 500, customerId: 200);

            var token = TestJwtHelper.GenerateAdminToken(1, "admin@test.com");
            AuthorizeAs(token);

            var response = await _client.GetAsync("/api/Delivery/Persons");
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            var persons = JsonSerializer.Deserialize<List<dynamic>>(content, _jsonOptions);
            Assert.NotNull(persons);
            Assert.True(persons.Count >= 1);
        }

        // ─── GetById tests ────────────────────────────────────────────────────

        [Fact]
        public async Task GetDeliveryById_NonExistingId_ReturnsNotFound()
        {
            var token = TestJwtHelper.GenerateAdminToken(1, "admin@test.com");
            AuthorizeAs(token);

            var response = await _client.GetAsync("/api/Delivery/99999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetDeliveryById_AsAdmin_ExistingDelivery_ReturnsOk()
        {
            await SeedDeliveryPersonAndDelivery(personId: 60, orderId: 600, customerId: 300);

            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<DeliveryDbContext>();
            var delivery = db.Deliveries.First(d => d.OrderId == 600);

            var token = TestJwtHelper.GenerateAdminToken(1, "admin@test.com");
            AuthorizeAs(token);

            var response = await _client.GetAsync($"/api/Delivery/{delivery.DeliveryId}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        // ─── GetDeliveryByOrder tests ─────────────────────────────────────────

        [Fact]
        public async Task GetDeliveryByOrder_NonExisting_ReturnsNotFound()
        {
            var token = TestJwtHelper.GenerateAdminToken(1, "admin@test.com");
            AuthorizeAs(token);

            var response = await _client.GetAsync("/api/Delivery/Order/99999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetDeliveryByOrder_ExistingOrder_AsAdmin_ReturnsOk()
        {
            await SeedDeliveryPersonAndDelivery(personId: 70, orderId: 700, customerId: 400);

            var token = TestJwtHelper.GenerateAdminToken(1, "admin@test.com");
            AuthorizeAs(token);

            var response = await _client.GetAsync("/api/Delivery/Order/700");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        // ─── AssignPerson AllowAnonymous ──────────────────────────────────────

        [Fact]
        public async Task AssignPerson_NoAvailablePerson_ReturnsBadRequest()
        {
            ClearAuth();
            var payload = new
            {
                OrderId = 9999,
                CustomerId = 9999,
                RestaurantLatitude = 0.0,
                RestaurantLongitude = 0.0,
                DeliveryLatitude = 0.0,
                DeliveryLongitude = 0.0
            };
            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await _client.PostAsync("/api/Delivery/AssignPerson", content);

            // No available delivery persons in empty DB → BadRequest
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        // ─── Customer sees only own deliveries ────────────────────────────────

        [Fact]
        public async Task GetDeliveries_AsCustomer_ReturnsOkWithOwnDeliveries()
        {
            await SeedDeliveryPersonAndDelivery(personId: 80, orderId: 800, customerId: 500);
            var token = TestJwtHelper.GenerateToken(500, "customer500@test.com", "Customer");
            AuthorizeAs(token);

            var response = await _client.GetAsync("/api/Delivery");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        // ─── GetDeliveryPerson by Id ──────────────────────────────────────────

        [Fact]
        public async Task GetDeliveryPerson_NonExistingId_ReturnsNotFound()
        {
            var token = TestJwtHelper.GenerateAdminToken(1, "admin@test.com");
            AuthorizeAs(token);

            var response = await _client.GetAsync("/api/Delivery/Persons/99999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }
    }
}
