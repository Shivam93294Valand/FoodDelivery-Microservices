using FoodDelivery.RestaurantService.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace FoodDelivery.Restaurant_ApiTesting
{
    public class CustomWebApplicationFactory : WebApplicationFactory<FoodDelivery.RestaurantService.Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");

            builder.ConfigureServices(services =>
            {
                // Replace SQL Server DbContext with InMemory
                services.RemoveAll<DbContextOptions<RestaurantDbContext>>();
                services.RemoveAll<RestaurantDbContext>();
                services.AddDbContext<RestaurantDbContext>(opts =>
                    opts.UseInMemoryDatabase("RestaurantApiTest_" + Guid.NewGuid()));

                // Replace Redis distributed cache with in-memory equivalent
                services.RemoveAll<Microsoft.Extensions.Caching.Distributed.IDistributedCache>();
                services.AddDistributedMemoryCache();

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
