using FoodDelivery.Customer_IntegrationTesting.Helpers;
using FoodDelivery.CustomerService;
using FoodDelivery.CustomerService.Data;
using FoodDelivery.CustomerService.Repositories;
using FoodDelivery.CustomerService.Services;
using Hangfire;
using Hangfire.MemoryStorage;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Moq;

namespace FoodDelivery.Customer_IntegrationTesting
{
    /// <summary>
    /// Custom WebApplicationFactory for CustomerService integration tests.
    /// Replaces SQL Server dependencies with in-memory equivalents so tests
    /// run without an external database or mail server.
    /// </summary>
    public class CustomWebApplicationFactory : WebApplicationFactory<FoodDelivery.CustomerService.Program>
    {
        /// <summary>Shared in-memory repository – seed data here in test constructors.</summary>
        public InMemoryCustomerRepository CustomerRepository { get; } = new InMemoryCustomerRepository();

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");

            // Provide the test JWT key so token validation passes.
            builder.UseSetting("Jwt:Key",      TestJwtHelper.TestKey);
            builder.UseSetting("Jwt:Issuer",   TestJwtHelper.TestIssuer);
            builder.UseSetting("Jwt:Audience", TestJwtHelper.TestAudience);

            builder.ConfigureServices(services =>
            {
                // ── Database ──────────────────────────────────────────────────
                services.RemoveAll<DbContextOptions<CustomerDbContext>>();
                services.RemoveAll<CustomerDbContext>();
                services.AddDbContext<CustomerDbContext>(opts =>
                    opts.UseInMemoryDatabase("CustomerTest_" + Guid.NewGuid()));

                // ── Repository ────────────────────────────────────────────────
                // Replace SQL-Server/Dapper repository with our in-memory stub.
                services.RemoveAll<ICustomerRequestRepository>();
                services.AddSingleton<ICustomerRequestRepository>(CustomerRepository);

                // ── Hangfire ──────────────────────────────────────────────────
                // Override SQL Server storage with in-memory to avoid connection.
                services.AddHangfire(cfg => cfg.UseMemoryStorage());

                // ── External Services ─────────────────────────────────────────
                // Prevent real emails being sent during tests.
                services.RemoveAll<IEmailBackgroundService>();
                services.AddSingleton<IEmailBackgroundService>(new Mock<IEmailBackgroundService>().Object);

                // Prevent real password-reset OTPs touching any external system.
                services.RemoveAll<IPasswordResetService>();
                var pwdMock = new Mock<IPasswordResetService>();
                pwdMock.Setup(s => s.SendPasswordResetOtpAsync(It.IsAny<string>()))
                       .ReturnsAsync(new FoodDelivery.CustomerService.DTOs.ApiResponse { Success = true, Message = "OTP sent" });
                services.AddSingleton<IPasswordResetService>(pwdMock.Object);
            });
        }
    }
}
