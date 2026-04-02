using FoodDelivery.Order_ApiTesting.Helpers;
using FoodDelivery.OrderService.Data;
using FoodDelivery.OrderService.Services;
using FoodDelivery.Common._Messaging;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Moq;

namespace FoodDelivery.Order_ApiTesting
{
    public class CustomWebApplicationFactory : WebApplicationFactory<FoodDelivery.OrderService.Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");

            builder.UseSetting("Jwt:Key",      TestJwtHelper.TestKey);
            builder.UseSetting("Jwt:Issuer",   TestJwtHelper.TestIssuer);
            builder.UseSetting("Jwt:Audience", TestJwtHelper.TestAudience);

            builder.ConfigureServices(services =>
            {
                // Replace SQL Server DbContext with InMemory
                services.RemoveAll<DbContextOptions<OrderDbContext>>();
                services.RemoveAll<OrderDbContext>();
                services.AddDbContext<OrderDbContext>(opts =>
                    opts.UseInMemoryDatabase("OrderApiTest_" + Guid.NewGuid()));

                // Mock MicroserviceGateway (avoids live HTTP calls to other services)
                services.RemoveAll<MicroserviceGateway>();
                var mockGateway = new Mock<MicroserviceGateway>(
                    new System.Net.Http.HttpClient(), null!, null!);
                mockGateway.Setup(g => g.GetCustomer(It.IsAny<int>()))
                           .ReturnsAsync((FoodDelivery.OrderService.DTOs.CustomerDto?)null);
                mockGateway.Setup(g => g.GetRestaurant(It.IsAny<int>()))
                           .ReturnsAsync(new FoodDelivery.OrderService.DTOs.RestaurantDto { RestaurantId = 1, Name = "Test Restaurant" });
                services.AddSingleton(mockGateway.Object);

                // Mock RabbitMQ message bus
                services.RemoveAll<IMessageBus>();
                services.AddSingleton<IMessageBus>(new Mock<IMessageBus>().Object);
            });
        }
    }
}
