using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace FoodDelivery.Customer_IntegrationTesting.Helpers
{
    /// <summary>
    /// Generates signed JWT tokens for testing protected endpoints.
    /// Uses the same key/issuer/audience as the CustomerService's appsettings.json test override.
    /// </summary>
    public static class TestJwtHelper
    {
        public const string TestKey      = "YourSuperSecretKeyHere12345678901234567890";
        public const string TestIssuer   = "FoodDelivery.CustomerService";
        public const string TestAudience = "FoodDelivery.Client";

        public static string GenerateToken(int customerId = 1, string email = "test@example.com", string role = "Customer")
        {
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub,   customerId.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, email),
                new Claim(ClaimTypes.Role,               role),
                new Claim("CustomerId",                  customerId.ToString())
            };

            var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer:            TestIssuer,
                audience:          TestAudience,
                claims:            claims,
                expires:           DateTime.UtcNow.AddHours(1),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
