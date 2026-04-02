using Ocelot.DependencyInjection;
using Ocelot.Middleware;
using MMLib.Ocelot.Provider.AppConfiguration;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using MMLib.SwaggerForOcelot.DependencyInjection;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

DotNetEnv.Env.TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);
builder.Configuration
    .SetBasePath(AppContext.BaseDirectory)
    .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true)
    .AddEnvironmentVariables();

builder.Configuration.AddJsonFile("ocelot.json", optional: false, reloadOnChange: true);

builder.Services.AddOcelot(builder.Configuration)
    .AddAppConfiguration();

builder.Services.AddHttpClient("Ocelot")
    .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
    {
        ServerCertificateCustomValidationCallback = (message, cert, chain, errors) => true
    });

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSwaggerForOcelot(builder.Configuration, (opt) =>
{
    opt.GenerateDocsForGatewayItSelf = false;
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    {
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "anonymous";
        return RateLimitPartition.GetFixedWindowLimiter(ip, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 200,
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

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174", "https://localhost:5173", "https://localhost:5174")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});


builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
if (string.IsNullOrWhiteSpace(jwtKey))
    jwtKey = "YourSuperSecretKeyHere12345678901234567890";
var customerIssuer = string.IsNullOrWhiteSpace(builder.Configuration["Jwt:Issuer"]) ? "FoodDelivery.CustomerService" : builder.Configuration["Jwt:Issuer"];
var adminIssuer = string.IsNullOrWhiteSpace(builder.Configuration["Jwt:AdminIssuer"]) ? "FoodDelivery.AdminService" : builder.Configuration["Jwt:AdminIssuer"];
var deliveryIssuer = string.IsNullOrWhiteSpace(builder.Configuration["Jwt:DeliveryIssuer"]) ? "FoodDelivery.DeliveryService" : builder.Configuration["Jwt:DeliveryIssuer"];
var validAudience = string.IsNullOrWhiteSpace(builder.Configuration["Jwt:Audience"]) ? "FoodDelivery.Client" : builder.Configuration["Jwt:Audience"];

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false, // Temporarily disable strict issuer validation
            ValidateAudience = false, // Temporarily disable strict audience validation
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuers = new[] { customerIssuer, adminIssuer, deliveryIssuer },
            ValidAudience = validAudience,
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

builder.WebHost.UseKestrel(options =>
{
    options.ListenAnyIP(7000, listenOptions =>
    {
        listenOptions.UseHttps();
    });
});

var app = builder.Build();
app.UseCors("AllowFrontend");

app.UseRateLimiter();

app.UseSwaggerForOcelotUI(opt =>
{
    opt.PathToSwaggerGenerator = "/swagger/docs";
});

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

await app.UseOcelot();

app.Run();
