using FoodDelivery.Common._Messaging;
using FoodDelivery.DeliveryService;
using FoodDelivery.DeliveryService.Data;
using FoodDelivery.DeliveryService.Services;
using Hangfire;
using Hangfire.MemoryStorage;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Moq;

namespace FoodDelivery.Delivery_ApiTesting
{
    public class CustomWebApplicationFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");

            builder.ConfigureServices(services =>
            {
                // Replace SQL Server DbContext with InMemory
                services.RemoveAll<DbContextOptions<DeliveryDbContext>>();
                services.RemoveAll<DeliveryDbContext>();
                services.AddDbContext<DeliveryDbContext>(options =>
                    options.UseInMemoryDatabase("DeliveryApiTestDb_" + Guid.NewGuid()));

                // Replace Hangfire SQL Server storage with in-memory
                services.RemoveAll<IGlobalConfiguration>();
                services.AddHangfire(cfg => cfg.UseMemoryStorage());
                var hostedServiceDescriptors = services
                    .Where(d => d.ServiceType == typeof(IHostedService))
                    .ToList();
                foreach (var descriptor in hostedServiceDescriptors)
                    services.Remove(descriptor);

                // Mock IMessageBus
                services.RemoveAll<IMessageBus>();
                var mockBus = new Mock<IMessageBus>();
                mockBus.Setup(b => b.Publish(It.IsAny<object>(), It.IsAny<string>(), It.IsAny<string>()));
                services.AddSingleton(mockBus.Object);

                // Mock IEmailService
                services.RemoveAll<IEmailService>();
                var mockEmail = new Mock<IEmailService>();
                mockEmail.Setup(e => e.SendOrderDeliveredEmailAsync(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<string>()))
                         .Returns(Task.CompletedTask);
                mockEmail.Setup(e => e.SendDeliveryOtpEmailAsync(
                        It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(),
                        It.IsAny<int>(), It.IsAny<string>(), It.IsAny<DateTime>()))
                         .ReturnsAsync(true);
                mockEmail.Setup(e => e.SendPasswordResetOtpEmailAsync(
                        It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<DateTime>()))
                         .ReturnsAsync(true);
                services.AddSingleton(mockEmail.Object);

                // Override JWT validation to use test key
                services.PostConfigure<Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerOptions>(
                    Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme,
                    options =>
                    {
                        var key = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
                            System.Text.Encoding.UTF8.GetBytes(Helpers.TestJwtHelper.TestKey));
                        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
                        {
                            ValidateIssuer            = false,
                            ValidateAudience          = false,
                            ValidateLifetime          = true,
                            ValidateIssuerSigningKey  = true,
                            IssuerSigningKey          = key
                        };
                    });
            });
        }
    }
}
