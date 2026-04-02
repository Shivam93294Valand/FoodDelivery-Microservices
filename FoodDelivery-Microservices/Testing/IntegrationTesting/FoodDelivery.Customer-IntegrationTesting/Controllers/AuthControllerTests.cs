using FoodDelivery.Customer_IntegrationTesting.Helpers;
using FoodDelivery.CustomerService.DTOs;
using FoodDelivery.CustomerService.Models;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace FoodDelivery.Customer_IntegrationTesting.Controllers
{
    public class AuthControllerTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly HttpClient _client;
        private readonly CustomWebApplicationFactory _factory;

        public AuthControllerTests(CustomWebApplicationFactory factory)
        {
            _factory = factory;
            _client  = factory.CreateClient();
        }

        // ── Register ─────────────────────────────────────────────────────────

        [Fact]
        public async Task Register_ReturnsOk_WithValidData()
        {
            var dto = new RegisterDto
            {
                FirstName   = "Test",
                LastName    = "User",
                Email       = $"new_{Guid.NewGuid():N}@example.com",
                PhoneNumber = "9000000001",
                Password    = "TestPass@123"
            };
            var response = await _client.PostAsJsonAsync("/api/Auth/register", dto);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var result = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
            Assert.NotNull(result);
            Assert.NotEmpty(result!.Token);
        }

        [Fact]
        public async Task Register_ReturnsBadRequest_WhenEmailAlreadyExists()
        {
            // Arrange – seed an existing customer
            var email = $"dup_{Guid.NewGuid():N}@example.com";
            _factory.CustomerRepository.WithCustomer(new Customer
            {
                FirstName = "Existing", LastName = "User",
                Email = email, Password = "hash", IsActive = true,
                CreatedAt = DateTime.UtcNow
            });

            var dto = new RegisterDto
            {
                FirstName = "New", LastName = "User",
                Email = email, Password = "AnotherPass@1"
            };
            var response = await _client.PostAsJsonAsync("/api/Auth/register", dto);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        // ── Login ─────────────────────────────────────────────────────────────

        [Fact]
        public async Task Login_ReturnsOk_WithValidCredentials()
        {
            // Arrange – register a customer first
            var email = $"login_{Guid.NewGuid():N}@example.com";
            const string password = "LoginPass@1";

            var registerDto = new RegisterDto
            {
                FirstName = "Login", LastName = "Tester",
                Email = email, PhoneNumber = "9000000002",
                Password = password
            };
            await _client.PostAsJsonAsync("/api/Auth/register", registerDto);

            var loginDto = new LoginDto { Email = email, Password = password };
            var response = await _client.PostAsJsonAsync("/api/Auth/login", loginDto);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var result = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
            Assert.NotNull(result?.Token);
        }

        [Fact]
        public async Task Login_ReturnsBadRequest_WhenUserDoesNotExist()
        {
            var dto = new LoginDto
            {
                Email    = "nobody@nonexistent.com",
                Password = "irrelevant"
            };
            var response = await _client.PostAsJsonAsync("/api/Auth/login", dto);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        // ── Forgot Password ───────────────────────────────────────────────────

        [Fact]
        public async Task ForgotPassword_ReturnsOk_WithValidEmail()
        {
            var dto = new ForgotPasswordDto { Email = "anyone@example.com" };
            var response = await _client.PostAsJsonAsync("/api/Auth/forgot-password", dto);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task ForgotPassword_ReturnsBadRequest_WithInvalidEmail()
        {
            // Arrange – send an invalid (non-email) value so model validation fails
            var dto = new { Email = "not-an-email" };
            var response = await _client.PostAsJsonAsync("/api/Auth/forgot-password", dto);

            // Assert – 400 from FluentValidation / DataAnnotations
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }
    }
}
