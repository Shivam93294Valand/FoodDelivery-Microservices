using FoodDelivery.EmailService.Data;
using FoodDelivery.EmailService.Services;
using FoodDelivery.EmailService.Events;
using FoodDelivery.EmailService.EventHandlers;
using FoodDelivery.Common._Messaging;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

// load .env (requires DotNetEnv package)
DotNetEnv.Env.TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);
builder.Configuration
    .SetBasePath(AppContext.BaseDirectory)
    .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true)
    .AddEnvironmentVariables();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Email Service API",
        Version = "v1",
        Description = "Food Delivery Email Notification Service"
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
    jwtKey = "FoodDelivery@Microservices#SecureKey$2024!WithEnoughLength";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "FoodDelivery.EmailService",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "FoodDelivery.Clients",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddDbContext<EmailDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register Email Service
builder.Services.AddScoped<IEmailService, EmailService>();

// Register RabbitMQ Message Bus
builder.Services.AddSingleton<IMessageBus>(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    var host = config["RabbitMQ:Host"] ?? "localhost";
    var port = config["RabbitMQ:Port"] ?? "5672";
    return new RabbitMQBus(host, port);
});

// Register Event Handlers
builder.Services.AddScoped<DeliveryAssignedEventHandler>();
builder.Services.AddScoped<OrderCreatedEventHandler>();
builder.Services.AddScoped<OrderDeliveredEventHandler>();

// Register Background Service to listen to RabbitMQ
builder.Services.AddHostedService<GlobalMessageSubscriber<DeliveryAssignedEvent, DeliveryAssignedEventHandler>>(
    sp => new GlobalMessageSubscriber<DeliveryAssignedEvent, DeliveryAssignedEventHandler>(
        sp,
        sp.GetRequiredService<IConfiguration>(),
        exchangeName: "delivery-events"
    )
);

builder.Services.AddHostedService<GlobalMessageSubscriber<OrderDeliveredEvent, OrderDeliveredEventHandler>>(
    sp => new GlobalMessageSubscriber<OrderDeliveredEvent, OrderDeliveredEventHandler>(
        sp,
        sp.GetRequiredService<IConfiguration>(),
        exchangeName: "order-delivered-events"
    )
);

builder.Services.AddHostedService<GlobalMessageSubscriber<OrderCreatedEvent, OrderCreatedEventHandler>>(
    sp => new GlobalMessageSubscriber<OrderCreatedEvent, OrderCreatedEventHandler>(
        sp,
        sp.GetRequiredService<IConfiguration>(),
        exchangeName: "order-events"
    )
);

builder.WebHost.UseUrls("https://localhost:7006");

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Email Service API v1");
    c.RoutePrefix = "swagger";
});

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

Console.WriteLine("==============================================");
Console.WriteLine("Email Service Started on https://localhost:7006");
Console.WriteLine("Listening for DeliveryAssignedEvent and OrderCreatedEvent from RabbitMQ...");
Console.WriteLine("==============================================");

app.Run();
