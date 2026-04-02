using FoodDelivery.RestaurantService.Data;
using FoodDelivery.RestaurantService.Repositories;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace FoodDelivery.Restaurant_IntegrationTesting
{
    public class CustomWebApplicationFactory : WebApplicationFactory<FoodDelivery.RestaurantService.Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");

            builder.ConfigureServices(services =>
            {
                // ── Database ──────────────────────────────────────────────────
                services.RemoveAll<DbContextOptions<RestaurantDbContext>>();
                services.RemoveAll<RestaurantDbContext>();
                services.AddDbContext<RestaurantDbContext>(opts =>
                    opts.UseInMemoryDatabase("RestaurantTest_" + Guid.NewGuid()));

                // ── Redis Cache → In-Memory ───────────────────────────────────
                // a plain in-memory distributed cache so tests run without Redis.
                services.RemoveAll<Microsoft.Extensions.Caching.Distributed.IDistributedCache>();
                services.AddDistributedMemoryCache();
            });
        }
    }
}
