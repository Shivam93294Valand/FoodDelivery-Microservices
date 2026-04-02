using FoodDelivery.Admin_IntegrationTesting.Helpers;
using FoodDelivery.AdminService.DTOs;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Xunit;

namespace FoodDelivery.Admin_IntegrationTesting.Controllers
{
    public class AuthControllerTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly HttpClient _client;

        public AuthControllerTests(CustomWebApplicationFactory factory)
        {
            _client = factory.CreateClient();
        }

        // ── Register ──────────────────────────────────────────────────────────

        [Fact]
        public async Task Register_ReturnsOk_WithValidAdminData()
        {
            var dto = new RegisterDto
            {
                FirstName = "Test",
                LastName  = "Admin",
                Email     = $"admin_{Guid.NewGuid():N}@test.com",
                Password  = "Admin@1234"
            };

            var response = await _client.PostAsJsonAsync("/api/Auth/register", dto);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var result = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
            Assert.NotNull(result);
            Assert.True(result!.Success);
        }

        [Fact]
        public async Task Register_ReturnsBadRequest_WithDuplicateEmail()
        {
            var email = $"dup_{Guid.NewGuid():N}@test.com";

            var dto = new RegisterDto { FirstName = "Dup", LastName = "User", Email = email, Password = "Pass@1234" };
            // First registration should succeed
            await _client.PostAsJsonAsync("/api/Auth/register", dto);

            // Second with same email should fail
            var response = await _client.PostAsJsonAsync("/api/Auth/register", dto);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task Register_ReturnsBadRequest_WithInvalidPassword()
        {
            // Password is too short (< 6 chars)
            var dto = new RegisterDto
            {
                FirstName = "Short", LastName = "Pass",
                Email = $"short_{Guid.NewGuid():N}@test.com",
                Password = "123"   // < MinLength(6)
            };

            var response = await _client.PostAsJsonAsync("/api/Auth/register", dto);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        // ── Login ─────────────────────────────────────────────────────────────

        [Fact]
        public async Task Login_ReturnsOk_WithValidCredentials()
        {
            // First register
            var email    = $"login_{Guid.NewGuid():N}@test.com";
            const string password = "Login@1234";

            await _client.PostAsJsonAsync("/api/Auth/register", new RegisterDto
            {
                FirstName = "Login", LastName = "Test",
                Email = email, Password = password
            });

            // Then login
            var response = await _client.PostAsJsonAsync("/api/Auth/login",
                new LoginDto { Email = email, Password = password });

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var result = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
            Assert.NotNull(result?.Token);
        }

        [Fact]
        public async Task Login_ReturnsUnauthorized_WithWrongPassword()
        {
            var email = $"wrong_{Guid.NewGuid():N}@test.com";
            await _client.PostAsJsonAsync("/api/Auth/register", new RegisterDto
            {
                FirstName = "Wrong", LastName = "Pass",
                Email = email, Password = "Correct@1"
            });

            var response = await _client.PostAsJsonAsync("/api/Auth/login",
                new LoginDto { Email = email, Password = "WrongPass@1" });

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task Login_ReturnsUnauthorized_WhenUserNotFound()
        {
            var response = await _client.PostAsJsonAsync("/api/Auth/login",
                new LoginDto { Email = "nobody@nowhere.com", Password = "irrelevant" });

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }
    }
}
