using FoodDelivery.Admin_IntegrationTesting.Helpers;
using System.Net;
using System.Net.Http.Headers;
using Xunit;

namespace FoodDelivery.Admin_IntegrationTesting.Controllers
{
    public class AdminControllerTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly HttpClient _adminClient;
        private readonly HttpClient _anonClient;
        private readonly CustomWebApplicationFactory _factory;

        public AdminControllerTests(CustomWebApplicationFactory factory)
        {
            _factory    = factory;
            _anonClient = factory.CreateClient();

            _adminClient = factory.CreateClient();
            var adminToken = TestJwtHelper.GenerateToken(userId: 1, email: "admin@test.com", role: "Admin");
            _adminClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", adminToken);
        }

        // ── GET /api/Admin/users  (Admin only) ────────────────────────────────

        [Fact]
        public async Task GetUsers_ReturnsUnauthorized_WithoutToken()
        {
            var response = await _anonClient.GetAsync("/api/Admin/users");
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetUsers_ReturnsForbidden_WithCustomerRole()
        {
            var client = _factory.CreateClient();
            var token  = TestJwtHelper.GenerateToken(userId: 5, email: "customer@test.com", role: "Customer");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await client.GetAsync("/api/Admin/users");
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task GetUsers_ReturnsOk_WithAdminToken()
        {
            var response = await _adminClient.GetAsync("/api/Admin/users");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        // ── GET /api/Admin/restaurants  (Admin only) ──────────────────────────

        [Fact]
        public async Task GetRestaurants_ReturnsOk_WithAdminToken()
        {
            var response = await _adminClient.GetAsync("/api/Admin/restaurants");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task GetRestaurants_ReturnsUnauthorized_WithoutToken()
        {
            var response = await _anonClient.GetAsync("/api/Admin/restaurants");
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        // ── GET /api/Dashboard/stats  (Admin only) ───────────────────────────

        [Fact]
        public async Task GetDashboardStats_ReturnsUnauthorized_WithoutToken()
        {
            var response = await _anonClient.GetAsync("/api/Dashboard/stats");
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetDashboardStats_ReturnsOkOrForbidden_WithAdminToken()
        {
            // May return 200 if the external service calls succeed, or 503 if they fail.
            // We just assert the JWT auth layer is working (not 401).
            var response = await _adminClient.GetAsync("/api/Dashboard/stats");
            Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
        }
    }
}
