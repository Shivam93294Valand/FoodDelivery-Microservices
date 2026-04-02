using FoodDelivery.Customer_ApiTesting.Helpers;
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

namespace FoodDelivery.Customer_ApiTesting
{
    public class CustomWebApplicationFactory : WebApplicationFactory<FoodDelivery.CustomerService.Program>
    {
        public InMemoryCustomerRepository CustomerRepository { get; } = new InMemoryCustomerRepository();

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");

            builder.UseSetting("Jwt:Key",      TestJwtHelper.TestKey);
            builder.UseSetting("Jwt:Issuer",   TestJwtHelper.TestIssuer);
            builder.UseSetting("Jwt:Audience", TestJwtHelper.TestAudience);

            builder.ConfigureServices(services =>
            {
                // Replace SQL Server DbContext with InMemory
                services.RemoveAll<DbContextOptions<CustomerDbContext>>();
                services.RemoveAll<CustomerDbContext>();
                services.AddDbContext<CustomerDbContext>(opts =>
                    opts.UseInMemoryDatabase("CustomerApiTest_" + Guid.NewGuid()));

                // Replace repository with in-memory stub
                services.RemoveAll<ICustomerRequestRepository>();
                services.AddSingleton<ICustomerRequestRepository>(CustomerRepository);

                // Replace Hangfire SQL Server storage with in-memory
                services.AddHangfire(cfg => cfg.UseMemoryStorage());

                // Mock email service
                services.RemoveAll<IEmailBackgroundService>();
                services.AddSingleton<IEmailBackgroundService>(new Mock<IEmailBackgroundService>().Object);

                // Mock password-reset service
                services.RemoveAll<IPasswordResetService>();
                var pwdMock = new Mock<IPasswordResetService>();
                pwdMock.Setup(s => s.SendPasswordResetOtpAsync(It.IsAny<string>()))
                       .ReturnsAsync(new FoodDelivery.CustomerService.DTOs.ApiResponse { Success = true, Message = "OTP sent" });
                services.AddSingleton<IPasswordResetService>(pwdMock.Object);
            });
        }
    }
}
