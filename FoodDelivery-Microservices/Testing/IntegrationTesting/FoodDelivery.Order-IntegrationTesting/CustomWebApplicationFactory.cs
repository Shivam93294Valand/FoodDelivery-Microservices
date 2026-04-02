using FoodDelivery.Order_IntegrationTesting.Helpers;
using FoodDelivery.OrderService.Data;
using FoodDelivery.OrderService.Repositories;
using FoodDelivery.OrderService.Services;
using FoodDelivery.Common._Messaging;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Moq;
using System.Net.Http;

namespace FoodDelivery.Order_IntegrationTesting
{
    public class CustomWebApplicationFactory : WebApplicationFactory<FoodDelivery.OrderService.Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");

            // Override configuration values
            builder.UseSetting("Jwt:Key",      TestJwtHelper.TestKey);
            builder.UseSetting("Jwt:Issuer",   TestJwtHelper.TestIssuer);
            builder.UseSetting("Jwt:Audience", TestJwtHelper.TestAudience);
            builder.UseSetting("RabbitMQHost", "localhost");
            builder.UseSetting("RabbitMQPort", "5672");

            builder.ConfigureServices(services =>
            {
                // ── Database ──────────────────────────────────────────────────
                services.RemoveAll<DbContextOptions<OrderDbContext>>();
                services.RemoveAll<OrderDbContext>();
                services.AddDbContext<OrderDbContext>(opts =>
                    opts.UseInMemoryDatabase("OrderTest_" + Guid.NewGuid()));

                // ── MicroserviceGateway (HTTP calls to other services) ─────────
                // Replace the real HttpClient with a fake that returns null/empty
                // so tests don't make live network calls.
                services.RemoveAll<MicroserviceGateway>();
                var mockGateway = new Mock<MicroserviceGateway>(
                    new System.Net.Http.HttpClient(), null!, null!);
                mockGateway.Setup(g => g.GetCustomer(It.IsAny<int>())).ReturnsAsync((FoodDelivery.OrderService.DTOs.CustomerDto?)null);
                mockGateway.Setup(g => g.GetRestaurant(It.IsAny<int>())).ReturnsAsync(new FoodDelivery.OrderService.DTOs.RestaurantDto { RestaurantId = 1, Name = "Test Restaurant" });
                services.AddSingleton(mockGateway.Object);

                // ── RabbitMQ Message Bus ───────────────────────────────────────
                // Replace real RabbitMQ with a no-op mock.
                services.RemoveAll<IMessageBus>();
                services.AddSingleton<IMessageBus>(new Mock<IMessageBus>().Object);
            });
        }
    }
}
