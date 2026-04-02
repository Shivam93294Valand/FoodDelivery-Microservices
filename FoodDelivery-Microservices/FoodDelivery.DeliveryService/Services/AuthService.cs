using FoodDelivery.DeliveryService.DTOs;
using FoodDelivery.DeliveryService.Models;
using FoodDelivery.DeliveryService.Repositories;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace FoodDelivery.DeliveryService.Services
{
    public class AuthService : IAuthService
    {
        private readonly IDeliveryRequestRepository _repo;
        private readonly IConfiguration _config;

        public AuthService(IDeliveryRequestRepository repo, IConfiguration config)
        {
            _repo = repo;
            _config = config;
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
        {
            var normalizedEmail = (loginDto.Email ?? string.Empty).Trim().ToLowerInvariant();
            var person = await _repo.GetByEmailAsync(normalizedEmail)
                ?? await _repo.GetByEmailAsync(loginDto.Email);
            if (person == null) throw new Exception("Invalid email or password");

            var password = loginDto.Password?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(password))
            {
                throw new Exception("Invalid email or password");
            }

            var isBcryptHash = !string.IsNullOrWhiteSpace(person.Password) &&
                               (person.Password.StartsWith("$2a$") ||
                                person.Password.StartsWith("$2b$") ||
                                person.Password.StartsWith("$2y$"));

            if (isBcryptHash)
            {
                if (!BCrypt.Net.BCrypt.Verify(password, person.Password))
                {
                    throw new Exception("Invalid email or password");
                }
            }
            else
            {
                if (person.Password != password && person.Password != loginDto.Password)
                {
                    throw new Exception("Invalid email or password");
                }

                person.Password = BCrypt.Net.BCrypt.HashPassword(password);
                await _repo.UpdateAsync(person);
            }

            var token = GenerateJwtToken(person);

            return new AuthResponseDto
            {
                Token = token,
                DeliveryPerson = new DeliveryPersonAuthDto
                {
                    DeliveryPersonId = person.DeliveryPersonId,
                    FirstName = person.FirstName,
                    LastName = person.LastName,
                    Email = person.Email,
                    PhoneNumber = person.PhoneNumber,
                    IsAvailable = person.IsAvailable
                }
            };
        }

        public string GenerateJwtToken(DeliveryPerson person)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, person.DeliveryPersonId.ToString()),
                new Claim(ClaimTypes.Email, person.Email),
                new Claim(ClaimTypes.GivenName, person.FirstName),
                new Claim(ClaimTypes.Surname, person.LastName),
                new Claim(ClaimTypes.Role, "DeliveryPerson"),
                new Claim("DeliveryPersonId", person.DeliveryPersonId.ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? "YourSuperSecretKeyHere12345678901234567890"));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var issuer = _config["Jwt:DeliveryIssuer"] ?? "FoodDelivery.DeliveryService";

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: _config["Jwt:Audience"] ?? "FoodDelivery.Client",
                claims: claims,
                expires: DateTime.Now.AddDays(7),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}