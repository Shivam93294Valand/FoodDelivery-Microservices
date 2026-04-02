using FoodDelivery.Admin_ApiTesting.Helpers;
using FoodDelivery.AdminService.DTOs;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Xunit;

namespace FoodDelivery.Admin_ApiTesting.Controllers
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
        public async Task Register_ReturnsOk_WhenDataIsValid()
        {
            var dto = new RegisterDto
            {
                FirstName       = "Api",
                LastName        = "Test",
                Email           = $"api_reg_{Guid.NewGuid():N}@test.com",
                Password        = "ApiTest@1234",
                ConfirmPassword = "ApiTest@1234",
                Role            = "Admin"
            };

            var response = await _client.PostAsJsonAsync("/api/Auth/register", dto);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var body = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
            Assert.NotNull(body);
            Assert.True(body!.Success);
        }

        [Fact]
        public async Task Register_ReturnsBadRequest_WhenEmailIsDuplicate()
        {
            var email = $"dup_{Guid.NewGuid():N}@test.com";
            var dto = new RegisterDto
            {
                FirstName = "Dup", LastName = "User",
                Email = email,
                Password = "Dup@12345", ConfirmPassword = "Dup@12345",
                Role = "Admin"
            };

            await _client.PostAsJsonAsync("/api/Auth/register", dto);
            var response = await _client.PostAsJsonAsync("/api/Auth/register", dto);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task Register_ReturnsBadRequest_WhenPasswordTooShort()
        {
            var dto = new RegisterDto
            {
                FirstName = "Short", LastName = "Pass",
                Email = $"short_{Guid.NewGuid():N}@test.com",
                Password = "123", ConfirmPassword = "123",
                Role = "Admin"
            };

            var response = await _client.PostAsJsonAsync("/api/Auth/register", dto);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task Register_ReturnsBadRequest_WhenPasswordsDoNotMatch()
        {
            var dto = new RegisterDto
            {
                FirstName = "Mismatch", LastName = "Pass",
                Email = $"mismatch_{Guid.NewGuid():N}@test.com",
                Password = "Pass@12345", ConfirmPassword = "Other@12345",
                Role = "Admin"
            };

            var response = await _client.PostAsJsonAsync("/api/Auth/register", dto);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        // ── Login ─────────────────────────────────────────────────────────────

        [Fact]
        public async Task Login_ReturnsOk_WithValidCredentials()
        {
            var email    = $"login_{Guid.NewGuid():N}@test.com";
            const string password = "Login@12345";

            await _client.PostAsJsonAsync("/api/Auth/register", new RegisterDto
            {
                FirstName = "Login", LastName = "User",
                Email = email, Password = password, ConfirmPassword = password,
                Role = "Admin"
            });

            var response = await _client.PostAsJsonAsync("/api/Auth/login",
                new LoginDto { Email = email, Password = password });

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var body = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
            Assert.NotNull(body?.Token);
        }

        [Fact]
        public async Task Login_ReturnsUnauthorized_WhenPasswordIsWrong()
        {
            var email = $"wrong_{Guid.NewGuid():N}@test.com";
            await _client.PostAsJsonAsync("/api/Auth/register", new RegisterDto
            {
                FirstName = "Wrong", LastName = "Pass",
                Email = email, Password = "Correct@1234", ConfirmPassword = "Correct@1234",
                Role = "Admin"
            });

            var response = await _client.PostAsJsonAsync("/api/Auth/login",
                new LoginDto { Email = email, Password = "Wrong@1234" });

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task Login_ReturnsUnauthorized_WhenUserDoesNotExist()
        {
            var response = await _client.PostAsJsonAsync("/api/Auth/login",
                new LoginDto { Email = "ghost@nonexistent.com", Password = "Any@1234" });

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task Login_ReturnsBadRequest_WhenBodyIsEmpty()
        {
            var response = await _client.PostAsJsonAsync("/api/Auth/login", new { });

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        // ── Forgot Password ───────────────────────────────────────────────────

        [Fact]
        public async Task ForgotPassword_ReturnsOk_ForRegisteredEmail()
        {
            var email = $"forgot_{Guid.NewGuid():N}@test.com";
            await _client.PostAsJsonAsync("/api/Auth/register", new RegisterDto
            {
                FirstName = "Forgot", LastName = "Pass",
                Email = email, Password = "Forgot@1234", ConfirmPassword = "Forgot@1234",
                Role = "Admin"
            });

            var response = await _client.PostAsJsonAsync("/api/Auth/forgot-password",
                new ForgotPasswordDto { Email = email });

            Assert.True(
                response.StatusCode == HttpStatusCode.OK ||
                response.StatusCode == HttpStatusCode.Accepted,
                $"Expected 200/202 but got {response.StatusCode}");
        }
    }
}
