using FoodDelivery.PaymentService.Data;
using FoodDelivery.PaymentService.Repositories;
using FoodDelivery.PaymentService.Events;
using FoodDelivery.PaymentService.EventHandlers;
using FoodDelivery.Common._Messaging;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using FluentValidation;
using FluentValidation.AspNetCore;

// load .env (requires DotNetEnv package)
DotNetEnv.Env.TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);
builder.Configuration
    .SetBasePath(AppContext.BaseDirectory)
    .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true)
    .AddEnvironmentVariables();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Payment Service API",
        Version = "v1",
        Description = "Food Delivery Payment Service"
    });
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
var customerIssuer = builder.Configuration["Jwt:Issuer"] ?? "FoodDelivery.CustomerService";
var adminIssuer = builder.Configuration["Jwt:AdminIssuer"] ?? "FoodDelivery.AdminService";
var validAudience = builder.Configuration["Jwt:Audience"] ?? "FoodDelivery.Client";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false, // Temporarily disable strict issuer validation for debugging
            ValidateAudience = false, // Temporarily disable strict audience validation
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuers = new[] { customerIssuer, adminIssuer, "FoodDelivery.CustomerService", "FoodDelivery.DeliveryService", "FoodDelivery.AdminService" },
            ValidAudiences = new[] { validAudience, "FoodDelivery.Client", "FoodDelivery.Clients" },
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var authHeader = context.Request.Headers.Authorization.ToString();
                if (!string.IsNullOrWhiteSpace(authHeader) && !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    context.Token = authHeader;
                }

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddCors(options => options.AddPolicy("AllowAll", policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddAuthorization();

// Register HttpClientFactory for calling other microservices
builder.Services.AddHttpClient("", client => { })
    .ConfigurePrimaryHttpMessageHandler(() => new System.Net.Http.HttpClientHandler
    {
        ServerCertificateCustomValidationCallback = (message, cert, chain, errors) => true
    });

builder.Services.AddDbContext<PaymentDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IPaymentRepository, PaymentRepository>();

// Register Event Handler
builder.Services.AddScoped<OrderCreatedEventHandler>();

// Register Background Service to listen to RabbitMQ
builder.Services.AddHostedService<GlobalMessageSubscriber<OrderCreatedEvent, OrderCreatedEventHandler>>(
    sp => new GlobalMessageSubscriber<OrderCreatedEvent, OrderCreatedEventHandler>(
        sp,
        sp.GetRequiredService<IConfiguration>(),
        exchangeName: "order-events"
    )
);

builder.WebHost.UseUrls("https://localhost:7005");
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    // Global limiter: 60 requests per minute per IP
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    {
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "anonymous";
        return RateLimitPartition.GetFixedWindowLimiter(ip, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 60,
            Window = TimeSpan.FromMinutes(1),
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit = 0
        });
    });
    // Strict limiter for payment transactions: 10 per minute per IP
    options.AddFixedWindowLimiter("payment", opt =>
    {
        opt.PermitLimit = 10;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 0;
    });
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.Headers.RetryAfter = "60";
        await context.HttpContext.Response.WriteAsync("Too many requests. Please try again later.", cancellationToken);
    };
});

var app = builder.Build();

// Auto-fix DB schema: ensure CustomerId column exists on Payments table
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("StartupDbFix");
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<PaymentDbContext>();
        var conn = db.Database.GetDbConnection();
        conn.Open();
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Payments]') AND name = 'CustomerId'";
            var exists = (int)cmd.ExecuteScalar() > 0;
            if (!exists)
            {
                logger.LogInformation("CustomerId column missing on Payments. Adding column and attempting backfill...");
                cmd.CommandText = "ALTER TABLE [dbo].[Payments] ADD [CustomerId] INT NOT NULL DEFAULT 0";
                cmd.ExecuteNonQuery();

                // Attempt to backfill from Orders table if present in same DB
                cmd.CommandText = "IF OBJECT_ID('dbo.Orders') IS NOT NULL BEGIN UPDATE P SET P.CustomerId = O.CustomerId FROM [dbo].[Payments] P INNER JOIN [dbo].[Orders] O ON P.OrderId = O.OrderId END";
                cmd.ExecuteNonQuery();
                logger.LogInformation("CustomerId column added and backfill attempted.");
            }
            else
            {
                logger.LogInformation("CustomerId column already present on Payments.");
            }
        }
    }
    catch (Exception ex)
    {
        var logger2 = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("StartupDbFix");
        logger2.LogError(ex, "Failed to auto-fix Payment DB schema");
    }
}

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Payment Service API v1");
});

app.UseCors("AllowAll");
app.UseRateLimiter();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
