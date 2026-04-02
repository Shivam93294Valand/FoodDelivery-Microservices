using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace FoodDelivery.Delivery_IntegrationTesting.Helpers
{
    public static class TestJwtHelper
    {
        private const string TestKey = "YourSuperSecretKeyHere12345678901234567890";
        private const string TestIssuer = "FoodDelivery.CustomerService";
        private const string TestAudience = "FoodDelivery.Client";

        public static string GenerateToken(int userId, string email, string role = "Customer")
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Email, email),
                new Claim(ClaimTypes.Role, role),
                new Claim("customerId", userId.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: TestIssuer,
                audience: TestAudience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public static string GenerateDeliveryToken(int deliveryPersonId, string email)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, deliveryPersonId.ToString()),
                new Claim(ClaimTypes.Email, email),
                new Claim(ClaimTypes.Role, "DeliveryPerson"),
                new Claim("deliveryPersonId", deliveryPersonId.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: "FoodDelivery.DeliveryService",
                audience: TestAudience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public static string GenerateAdminToken(int adminId, string email)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, adminId.ToString()),
                new Claim(ClaimTypes.Email, email),
                new Claim(ClaimTypes.Role, "Admin")
            };

            var token = new JwtSecurityToken(
                issuer: "FoodDelivery.AdminService",
                audience: TestAudience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
