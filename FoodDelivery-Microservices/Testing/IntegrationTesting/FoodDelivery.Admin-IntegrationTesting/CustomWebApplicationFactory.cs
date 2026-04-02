using FoodDelivery.Admin_IntegrationTesting.Helpers;
using FoodDelivery.AdminService.Data;
using FoodDelivery.AdminService.Services;
using Hangfire;
using Hangfire.MemoryStorage;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Moq;

namespace FoodDelivery.Admin_IntegrationTesting
{
    public class CustomWebApplicationFactory : WebApplicationFactory<FoodDelivery.AdminService.Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");

            // Override JWT settings to match our test token helper
            builder.UseSetting("JwtSettings:SecretKey", TestJwtHelper.TestKey);
            builder.UseSetting("JwtSettings:Issuer",    TestJwtHelper.TestIssuer);
            builder.UseSetting("JwtSettings:Audience",  TestJwtHelper.TestAudience);

            builder.ConfigureServices(services =>
            {
                // ── Database ──────────────────────────────────────────────────
                services.RemoveAll<DbContextOptions<AdminDbContext>>();
                services.RemoveAll<AdminDbContext>();
                services.AddDbContext<AdminDbContext>(opts =>
                    opts.UseInMemoryDatabase("AdminTest_" + Guid.NewGuid()));

                // ── Hangfire (replace SQL Server with in-memory) ──────────────
                services.AddHangfire(cfg => cfg.UseMemoryStorage());

                // ── Redis → in-memory distributed cache ──────────────────────
                services.RemoveAll<Microsoft.Extensions.Caching.Distributed.IDistributedCache>();
                services.AddDistributedMemoryCache();

                // ── Email service (no-op mock) ────────────────────────────────
                services.RemoveAll<IEmailBackgroundService>();
                services.AddSingleton<IEmailBackgroundService>(new Mock<IEmailBackgroundService>().Object);

                // ── Password reset service (always succeeds) ──────────────────
                services.RemoveAll<IPasswordResetService>();
                var pwdMock = new Mock<IPasswordResetService>();
                pwdMock.Setup(s => s.SendPasswordResetOtpAsync(It.IsAny<string>()))
                       .ReturnsAsync(new FoodDelivery.AdminService.Services.ApiResponse { Success = true, Message = "OTP sent" });
                services.AddSingleton<IPasswordResetService>(pwdMock.Object);
            });
        }
    }
}
