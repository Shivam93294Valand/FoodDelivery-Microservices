using FoodDelivery.Admin_ApiTesting.Helpers;
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

namespace FoodDelivery.Admin_ApiTesting
{
    public class CustomWebApplicationFactory : WebApplicationFactory<FoodDelivery.AdminService.Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");

            builder.UseSetting("JwtSettings:SecretKey", TestJwtHelper.TestKey);
            builder.UseSetting("JwtSettings:Issuer",    TestJwtHelper.TestIssuer);
            builder.UseSetting("JwtSettings:Audience",  TestJwtHelper.TestAudience);

            builder.ConfigureServices(services =>
            {
                // Replace SQL Server DbContext with InMemory
                services.RemoveAll<DbContextOptions<AdminDbContext>>();
                services.RemoveAll<AdminDbContext>();
                services.AddDbContext<AdminDbContext>(opts =>
                    opts.UseInMemoryDatabase("AdminApiTest_" + Guid.NewGuid()));

                // Replace Hangfire SQL Server storage with in-memory
                services.AddHangfire(cfg => cfg.UseMemoryStorage());

                // Replace Redis with in-memory distributed cache
                services.RemoveAll<Microsoft.Extensions.Caching.Distributed.IDistributedCache>();
                services.AddDistributedMemoryCache();

                // Mock email service – no real emails during API tests
                services.RemoveAll<IEmailBackgroundService>();
                services.AddSingleton<IEmailBackgroundService>(new Mock<IEmailBackgroundService>().Object);

                // Mock password-reset service
                services.RemoveAll<IPasswordResetService>();
                var pwdMock = new Mock<IPasswordResetService>();
                pwdMock.Setup(s => s.SendPasswordResetOtpAsync(It.IsAny<string>()))
                       .ReturnsAsync(new FoodDelivery.AdminService.Services.ApiResponse { Success = true, Message = "OTP sent" });
                services.AddSingleton<IPasswordResetService>(pwdMock.Object);
            });
        }
    }
}
