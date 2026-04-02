using FoodDelivery.Common._Messaging;
using FoodDelivery.PaymentService;
using FoodDelivery.PaymentService.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Moq;

namespace FoodDelivery.Payment_ApiTesting
{
    public class CustomWebApplicationFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");

            builder.ConfigureServices(services =>
            {
                // Replace SQL Server DbContext with InMemory
                services.RemoveAll<DbContextOptions<PaymentDbContext>>();
                services.RemoveAll<PaymentDbContext>();
                services.AddDbContext<PaymentDbContext>(options =>
                    options.UseInMemoryDatabase("PaymentApiTestDb_" + Guid.NewGuid()));
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

                // Override JWT validation to use test key
                services.PostConfigure<Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerOptions>(
                    Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme,
                    options =>
                    {
                        var key = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
                            System.Text.Encoding.UTF8.GetBytes(Helpers.TestJwtHelper.TestKey));
                        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
                        {
                            ValidateIssuer           = false,
                            ValidateAudience         = false,
                            ValidateLifetime         = true,
                            ValidateIssuerSigningKey = true,
                            IssuerSigningKey         = key
                        };
                    });
            });
        }
    }
}
