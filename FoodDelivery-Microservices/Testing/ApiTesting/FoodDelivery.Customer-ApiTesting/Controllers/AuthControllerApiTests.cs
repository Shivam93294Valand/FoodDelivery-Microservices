using FoodDelivery.Customer_ApiTesting.Helpers;
using FoodDelivery.CustomerService.DTOs;
using FoodDelivery.CustomerService.Models;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Xunit;

namespace FoodDelivery.Customer_ApiTesting.Controllers
{
    public class AuthControllerApiTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly HttpClient _client;

        public AuthControllerApiTests(CustomWebApplicationFactory factory)
        {
            _client = factory.CreateClient();
        }

        // ── Register ──────────────────────────────────────────────────────────

        [Fact]
        public async Task Register_ReturnsOk_WithValidData()
        {
            var dto = new RegisterDto
            {
                FirstName = "Api",
                LastName  = "Customer",
                Email     = $"api_cust_{Guid.NewGuid():N}@test.com",
                Password  = "Cust@12345"
            };

            var response = await _client.PostAsJsonAsync("/api/Auth/register", dto);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task Register_ReturnsBadRequest_WhenEmailAlreadyExists()
        {
            var email = $"dup_cust_{Guid.NewGuid():N}@test.com";
            var dto = new RegisterDto
            {
                FirstName = "Dup", LastName = "Cust",
                Email = email, Password = "Dup@12345"
            };

            await _client.PostAsJsonAsync("/api/Auth/register", dto);
            var response = await _client.PostAsJsonAsync("/api/Auth/register", dto);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        // ── Login ─────────────────────────────────────────────────────────────

        [Fact]
        public async Task Login_ReturnsOk_WithValidCredentials()
        {
            var email    = $"login_cust_{Guid.NewGuid():N}@test.com";
            const string password = "CustLogin@1234";

            await _client.PostAsJsonAsync("/api/Auth/register", new RegisterDto
            {
                FirstName = "Login", LastName = "Cust",
                Email = email, Password = password
            });

            var response = await _client.PostAsJsonAsync("/api/Auth/login",
                new LoginDto { Email = email, Password = password });

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task Login_ReturnsBadRequest_WithWrongPassword()
        {
            var email = $"wrong_cust_{Guid.NewGuid():N}@test.com";
            await _client.PostAsJsonAsync("/api/Auth/register", new RegisterDto
            {
                FirstName = "Wrong", LastName = "Cust",
                Email = email, Password = "Correct@1234"
            });

            var response = await _client.PostAsJsonAsync("/api/Auth/login",
                new LoginDto { Email = email, Password = "Wrong@1234" });

            // The customer auth returns BadRequest (wrapped exception) for wrong credentials
            Assert.True(
                response.StatusCode == HttpStatusCode.BadRequest ||
                response.StatusCode == HttpStatusCode.Unauthorized,
                $"Expected 400 or 401 but got {response.StatusCode}");
        }
    }
}
