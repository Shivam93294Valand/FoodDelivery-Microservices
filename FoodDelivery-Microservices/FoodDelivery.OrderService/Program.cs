using FoodDelivery.OrderService.Data;
using FoodDelivery.OrderService.Repositories;
using FoodDelivery.OrderService.Services;
using FoodDelivery.Common._Messaging;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.EntityFrameworkCore;
using System.Threading.RateLimiting;

namespace FoodDelivery.OrderService;

public partial class Program            
{
    public static void Main(string[] args)
    {
        // load .env (requires DotNetEnv package)
        DotNetEnv.Env.TraversePath().Load();

        var builder = WebApplication.CreateBuilder(args);
        builder.Configuration
            .SetBasePath(AppContext.BaseDirectory)
            .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
            .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true)
            .AddEnvironmentVariables();

        builder.Services.AddControllers();
        builder.Services.AddFluentValidationAutoValidation();
        builder.Services.AddFluentValidationClientsideAdapters();
        builder.Services.AddValidatorsFromAssemblyContaining<Program>();
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen(c =>
        {
            c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token.",
                Name = "Authorization",
                In = Microsoft.OpenApi.Models.ParameterLocation.Header,
                Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
                Scheme = "Bearer"
            });

            c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
            {
                {
                    new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                    {
                        Reference = new Microsoft.OpenApi.Models.OpenApiReference
                        {
                            Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
        });
        var jwtKey = builder.Configuration["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(jwtKey))
            jwtKey = "YourSuperSecretKeyHere12345678901234567890";
        var customerIssuer = string.IsNullOrWhiteSpace(builder.Configuration["Jwt:Issuer"]) ? "FoodDelivery.CustomerService" : builder.Configuration["Jwt:Issuer"];
        var adminIssuer = string.IsNullOrWhiteSpace(builder.Configuration["Jwt:AdminIssuer"]) ? "FoodDelivery.AdminService" : builder.Configuration["Jwt:AdminIssuer"];
        var deliveryIssuer = string.IsNullOrWhiteSpace(builder.Configuration["Jwt:DeliveryIssuer"]) ? "FoodDelivery.DeliveryService" : builder.Configuration["Jwt:DeliveryIssuer"];
        var validAudience = string.IsNullOrWhiteSpace(builder.Configuration["Jwt:Audience"]) ? "FoodDelivery.Client" : builder.Configuration["Jwt:Audience"];

        builder.Services.AddAuthentication(Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuers = new[] { customerIssuer, adminIssuer, deliveryIssuer },
                    ValidAudience = validAudience,
                    IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwtKey))
                };
            });

        builder.Services.AddCors(options => options.AddPolicy("AllowAll", policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

        builder.Services.AddAuthorization();

        builder.Services.AddDbContext<OrderDbContext>(options =>
            options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

        // Register Repository
        builder.Services.AddScoped<IOrderRepository, OrderRepository>();

        // Register HttpClient for inter-service communication
        builder.Services.AddHttpClient<MicroserviceGateway>(client =>
        {
            // Optional: set default headers if needed
        }).ConfigurePrimaryHttpMessageHandler(() =>
        {
            return new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback = (message, cert, chain, errors) => true
            };
        });

        // Register RabbitMQ Message Bus
        builder.Services.AddSingleton<IMessageBus>(sp =>
        {
            var config = sp.GetRequiredService<IConfiguration>();
            return new RabbitMQBus(
                config["RabbitMQHost"]!,
                config["RabbitMQPort"]!
            );
        });

        builder.WebHost.UseUrls("https://localhost:7003");
        builder.Services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            // Global limiter: 100 requests per minute per IP
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
            {
                var ip = context.Connection.RemoteIpAddress?.ToString() ?? "anonymous";
                return RateLimitPartition.GetFixedWindowLimiter(ip, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 100,
                    Window = TimeSpan.FromMinutes(1),
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0
                });
            });
            options.OnRejected = async (context, cancellationToken) =>
            {
                context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                context.HttpContext.Response.Headers.RetryAfter = "60";
                await context.HttpContext.Response.WriteAsync("Too many requests. Please try again later.", cancellationToken);
            };
        });

        var app = builder.Build();
        app.UseCors("AllowAll");

        app.UseRateLimiter();

        app.UseSwagger();
        app.UseSwaggerUI();

        app.UseHttpsRedirection();
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapControllers();

        app.Run();
    }
}