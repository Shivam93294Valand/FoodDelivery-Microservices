using FoodDelivery.DeliveryService.Data;
using FoodDelivery.DeliveryService.Repositories;
using FoodDelivery.DeliveryService.Events;
using FoodDelivery.DeliveryService.EventHandlers;
using FoodDelivery.Common._Messaging;
using FoodDelivery.DeliveryService.Services;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Hangfire;
using Hangfire.SqlServer;
using Hangfire.MemoryStorage;
using FoodDelivery.DeliveryService;

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
builder.Services.AddFluentValidationClientsideAdapters();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Delivery Service API",
        Version = "v1",
        Description = "Food Delivery Delivery Service"
    });

    c.CustomSchemaIds(type => type.FullName);
    c.ResolveConflictingActions(apiDescriptions => apiDescriptions.First());

    // Support for nullable reference types
    c.SupportNonNullableReferenceTypes();
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
// Support tokens issued by customer service and admin service (so admin role can call delivery endpoints)
var customerIssuer = builder.Configuration["Jwt:Issuer"] ?? "FoodDelivery.CustomerService";
var adminIssuer = builder.Configuration["Jwt:AdminIssuer"] ?? "FoodDelivery.AdminService";
var deliveryIssuer = builder.Configuration["Jwt:DeliveryIssuer"] ?? "FoodDelivery.DeliveryService";
var validAudience = builder.Configuration["Jwt:Audience"] ?? "FoodDelivery.Client";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuers = new[] { customerIssuer, adminIssuer, deliveryIssuer },
            ValidAudience = validAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddCors(options => options.AddPolicy("AllowAll", policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddAuthorization();

builder.Services.AddDbContext<DeliveryDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IDeliveryRequestRepository, DeliveryRequestRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IEmailBackgroundService, EmailBackgroundService>();
builder.Services.AddScoped<IPasswordResetService, PasswordResetService>();
var deliveryConnStr = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddHangfire(configuration =>
{
    configuration
        .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
        .UseSimpleAssemblyNameTypeSerializer()
        .UseRecommendedSerializerSettings();
    if (!string.IsNullOrWhiteSpace(deliveryConnStr))
        configuration.UseSqlServerStorage(deliveryConnStr);
    else
        configuration.UseMemoryStorage();
});

builder.Services.AddHangfireServer();

// Register HttpClient for inter-service communication
// For development: allow self-signed certificates on localhost
builder.Services.AddHttpClient(string.Empty, client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
})
.ConfigurePrimaryHttpMessageHandler(() =>
{
    if (builder.Environment.IsDevelopment())
    {
        // Use SocketsHttpHandler for better compatibility in .NET 8
        var handler = new SocketsHttpHandler
        {
            SslOptions = new System.Net.Security.SslClientAuthenticationOptions
            {
                // Allow self-signed SSL certificates for localhost in development
                RemoteCertificateValidationCallback = (sender, cert, chain, errors) =>
                {
                    // Allow all localhost certificates in development
                    return true;
                }
            }
        };
        return handler;
    }
    else
    {
        return new SocketsHttpHandler();
    }
});

// Register RabbitMQ Message Bus for publishing events
builder.Services.AddSingleton<IMessageBus>(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    var host = config["RabbitMQ:Host"] ?? "localhost";
    var port = config["RabbitMQ:Port"] ?? "5672";
    return new RabbitMQBus(host, port);
});

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

builder.WebHost.UseUrls("https://localhost:7004");
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

// Auto-fix DB schema: ensure CustomerId column exists on Deliveries table
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("StartupDbFix");
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<DeliveryDbContext>();
        var conn = db.Database.GetDbConnection();
        conn.Open();
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Deliveries]') AND name = 'CustomerId'";
            var exists = (int)cmd.ExecuteScalar() > 0;
            if (!exists)
            {
                logger.LogInformation("CustomerId column missing on Deliveries. Adding column and attempting backfill...");
                cmd.CommandText = "ALTER TABLE [dbo].[Deliveries] ADD [CustomerId] INT NOT NULL DEFAULT 0";
                cmd.ExecuteNonQuery();

                // Backfill from Orders table if present
                cmd.CommandText = "IF OBJECT_ID('dbo.Orders') IS NOT NULL BEGIN UPDATE D SET D.CustomerId = O.CustomerId FROM [dbo].[Deliveries] D INNER JOIN [dbo].[Orders] O ON D.OrderId = O.OrderId END";
                cmd.ExecuteNonQuery();
                logger.LogInformation("CustomerId column added and backfill attempted.");
            }
            else
            {
                logger.LogInformation("CustomerId column already present on Deliveries.");
            }

            // Ensure Password column exists on DeliveryPartners table (added when introducing DeliveryPerson.Password)
            try
            {
                cmd.CommandText = "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[DeliveryPartners]') AND name = 'Password'";
                var passExists = (int)cmd.ExecuteScalar() > 0;
                if (!passExists)
                {
                    logger.LogInformation("Password column missing on DeliveryPartners. Adding column with default empty string...");
                    cmd.CommandText = "ALTER TABLE [dbo].[DeliveryPartners] ADD [Password] NVARCHAR(256) NOT NULL DEFAULT ''";
                    cmd.ExecuteNonQuery();
                    logger.LogInformation("Password column added to DeliveryPartners.");
                }
                else
                {
                    logger.LogInformation("Password column already present on DeliveryPartners.");
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to add Password column to DeliveryPartners");
            }

            // Ensure UserId column exists on DeliveryPartners table (for linking to AdminService User)
            try
            {
                cmd.CommandText = "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[DeliveryPartners]') AND name = 'UserId'";
                var userIdExists = (int)cmd.ExecuteScalar() > 0;
                if (!userIdExists)
                {
                    logger.LogInformation("UserId column missing on DeliveryPartners. Adding nullable column...");
                    cmd.CommandText = "ALTER TABLE [dbo].[DeliveryPartners] ADD [UserId] INT NULL";
                    cmd.ExecuteNonQuery();
                    logger.LogInformation("UserId column added to DeliveryPartners.");
                }
                else
                {
                    logger.LogInformation("UserId column already present on DeliveryPartners.");
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to add UserId column to DeliveryPartners");
            }

            // Ensure ShiftStatus column exists on DeliveryPartners table
            try
            {
                cmd.CommandText = "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[DeliveryPartners]') AND name = 'ShiftStatus'";
                var shiftStatusExists = (int)cmd.ExecuteScalar() > 0;
                if (!shiftStatusExists)
                {
                    logger.LogInformation("ShiftStatus column missing on DeliveryPartners. Adding column...");
                    cmd.CommandText = "ALTER TABLE [dbo].[DeliveryPartners] ADD [ShiftStatus] INT NOT NULL DEFAULT 0";
                    cmd.ExecuteNonQuery();
                    logger.LogInformation("ShiftStatus column added to DeliveryPartners.");
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to add ShiftStatus column to DeliveryPartners");
            }

            // Ensure ShiftStartTime column exists on DeliveryPartners table
            try
            {
                cmd.CommandText = "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[DeliveryPartners]') AND name = 'ShiftStartTime'";
                var shiftStartExists = (int)cmd.ExecuteScalar() > 0;
                if (!shiftStartExists)
                {
                    logger.LogInformation("ShiftStartTime column missing on DeliveryPartners. Adding nullable column...");
                    cmd.CommandText = "ALTER TABLE [dbo].[DeliveryPartners] ADD [ShiftStartTime] DATETIME2 NULL";
                    cmd.ExecuteNonQuery();
                    logger.LogInformation("ShiftStartTime column added to DeliveryPartners.");
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to add ShiftStartTime column to DeliveryPartners");
            }

            // Ensure ShiftEndTime column exists on DeliveryPartners table
            try
            {
                cmd.CommandText = "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[DeliveryPartners]') AND name = 'ShiftEndTime'";
                var shiftEndExists = (int)cmd.ExecuteScalar() > 0;
                if (!shiftEndExists)
                {
                    logger.LogInformation("ShiftEndTime column missing on DeliveryPartners. Adding nullable column...");
                    cmd.CommandText = "ALTER TABLE [dbo].[DeliveryPartners] ADD [ShiftEndTime] DATETIME2 NULL";
                    cmd.ExecuteNonQuery();
                    logger.LogInformation("ShiftEndTime column added to DeliveryPartners.");
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to add ShiftEndTime column to DeliveryPartners");
            }

            // Ensure LastStatusChange column exists on DeliveryPartners table
            try
            {
                cmd.CommandText = "SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[DeliveryPartners]') AND name = 'LastStatusChange'";
                var lastStatusExists = (int)cmd.ExecuteScalar() > 0;
                if (!lastStatusExists)
                {
                    logger.LogInformation("LastStatusChange column missing on DeliveryPartners. Adding nullable column...");
                    cmd.CommandText = "ALTER TABLE [dbo].[DeliveryPartners] ADD [LastStatusChange] DATETIME2 NULL";
                    cmd.ExecuteNonQuery();
                    logger.LogInformation("LastStatusChange column added to DeliveryPartners.");
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to add LastStatusChange column to DeliveryPartners");
            }

            try
            {
                cmd.CommandText = "IF OBJECT_ID(N'[dbo].[PasswordResetOtps]', N'U') IS NULL BEGIN CREATE TABLE [dbo].[PasswordResetOtps]([Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,[Email] NVARCHAR(256) NOT NULL,[Otp] NVARCHAR(6) NOT NULL,[CreatedAt] DATETIME2 NOT NULL,[ExpiresAt] DATETIME2 NOT NULL,[IsUsed] BIT NOT NULL DEFAULT 0); CREATE INDEX [IX_PasswordResetOtps_Email] ON [dbo].[PasswordResetOtps]([Email]); CREATE INDEX [IX_PasswordResetOtps_ExpiresAt] ON [dbo].[PasswordResetOtps]([ExpiresAt]); END";
                cmd.ExecuteNonQuery();
                logger.LogInformation("PasswordResetOtps table check complete.");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to ensure PasswordResetOtps table");
            }

            try
            {
                cmd.CommandText = "IF OBJECT_ID(N'[dbo].[DeliveryEmergencyAlerts]', N'U') IS NULL BEGIN CREATE TABLE [dbo].[DeliveryEmergencyAlerts]([Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,[DeliveryPersonId] INT NOT NULL,[Message] NVARCHAR(500) NOT NULL,[Latitude] FLOAT NULL,[Longitude] FLOAT NULL,[Severity] NVARCHAR(50) NOT NULL DEFAULT 'Medium',[CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()); CREATE INDEX [IX_DeliveryEmergencyAlerts_DeliveryPersonId] ON [dbo].[DeliveryEmergencyAlerts]([DeliveryPersonId]); END";
                cmd.ExecuteNonQuery();
                logger.LogInformation("DeliveryEmergencyAlerts table check complete.");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to ensure DeliveryEmergencyAlerts table");
            }
        }
    }
    catch (Exception ex)
    {
        var logger2 = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("StartupDbFix");
        logger2.LogError(ex, "Failed to auto-fix Delivery DB schema");
    }
}

// Always enable Swagger for debugging
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Delivery Service API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("AllowAll");

app.UseRateLimiter();

// Hangfire dashboard (development)
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = new[] { new HangfireAuthorizationFilter() }
});

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

Console.WriteLine("==============================================");
Console.WriteLine("Delivery Service Started on https://localhost:7004");
Console.WriteLine("Listening for OrderCreatedEvent from RabbitMQ...");
Console.WriteLine("==============================================");

app.Run();
