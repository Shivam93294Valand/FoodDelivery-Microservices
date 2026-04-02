using FoodDelivery.CustomerService;
using FoodDelivery.CustomerService.DTOs;
using FoodDelivery.CustomerService.Models;
using FoodDelivery.CustomerService.Services;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace FoodDelivery.Customer_UnitTesting.Services
{
    public class AuthServiceTests
    {
        private readonly Mock<ICustomerRequestRepository> _repoMock;
        private readonly IConfiguration _configuration;
        private readonly AuthService _authService;

        public AuthServiceTests()
        {
            _repoMock = new Mock<ICustomerRequestRepository>();

            var inMemorySettings = new Dictionary<string, string>
            {
                { "Jwt:Key",      "TestSuperSecretKeyThatIsLongEnough32Chars!" },
                { "Jwt:Issuer",   "TestIssuer" },
                { "Jwt:Audience", "TestAudience" }
            };
            _configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings!)
                .Build();

            _authService = new AuthService(_repoMock.Object, _configuration);
        }

        // ── Register ─────────────────────────────────────────────────────────

        [Fact]
        public async Task RegisterAsync_ThrowsException_WhenEmailAlreadyExists()
        {
            var existing = new Customer { CustomerId = 1, Email = "john@example.com" };
            _repoMock.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync(existing);

            var dto = new RegisterDto
            {
                FirstName = "John", LastName = "Doe",
                Email = "john@example.com", PhoneNumber = "1234567890",
                Password = "Secret123"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(() => _authService.RegisterAsync(dto));
            Assert.Contains("already exists", ex.Message);
        }



        [Fact]
        public async Task RegisterAsync_ThrowsException_WhenEmailIsEmpty()
        {
            var dto = new RegisterDto { Email = "   ", Password = "pass" };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(() => _authService.RegisterAsync(dto));
            Assert.Contains("required", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        // ── Login ─────────────────────────────────────────────────────────────

        [Fact]
        public async Task LoginAsync_ThrowsException_WhenUserNotFound()
        {
            _repoMock.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync((Customer?)null);

            var dto = new LoginDto { Email = "nobody@example.com", Password = "pass" };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(() => _authService.LoginAsync(dto));
            Assert.Contains("Invalid email or password", ex.Message);
        }

        [Fact]
        public async Task LoginAsync_ThrowsException_WhenPasswordIsWrong()
        {
            var hashed = BCrypt.Net.BCrypt.HashPassword("correct-pass");
            var customer = new Customer
            {
                CustomerId = 1, Email = "user@example.com",
                Password = hashed, IsActive = true
            };
            _repoMock.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync(customer);

            var dto = new LoginDto { Email = "user@example.com", Password = "wrong-pass" };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(() => _authService.LoginAsync(dto));
            Assert.Contains("Invalid email or password", ex.Message);
        }



        [Fact]
        public async Task LoginAsync_ThrowsException_WhenAccountIsDeactivated()
        {
            var hashed = BCrypt.Net.BCrypt.HashPassword("ValidPass1!");
            var customer = new Customer
            {
                CustomerId = 2, Email = "inactive@example.com",
                Password = hashed, IsActive = false  // deactivated
            };
            _repoMock.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync(customer);

            var dto = new LoginDto { Email = "inactive@example.com", Password = "ValidPass1!" };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(() => _authService.LoginAsync(dto));
            Assert.Contains("deactivated", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

    }
}
