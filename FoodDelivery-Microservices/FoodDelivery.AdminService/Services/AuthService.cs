using FoodDelivery.AdminService.DTOs;
using FoodDelivery.AdminService.Models;
using FoodDelivery.AdminService.Repositories;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace FoodDelivery.AdminService.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _configuration;

        public AuthService(IUserRepository userRepository, IConfiguration configuration)
        {
            _userRepository = userRepository;
            _configuration = configuration;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto)
        {
            if (await _userRepository.ExistsAsync(registerDto.Email))
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "User with this email already exists."
                };
            }

            // Parse role
            if (!Enum.TryParse<UserRole>(registerDto.Role, true, out var role))
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Invalid role specified. Valid roles are: Customer, DeliveryPerson, Manager, Admin."
                };
            }
            var user = new User
            {
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName,
                Email = registerDto.Email.ToLower(),
                PasswordHash = PasswordHasher.Hash(registerDto.Password),
                PhoneNumber = registerDto.PhoneNumber,
                Role = role,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _userRepository.AddAsync(user);

            // Generate token
            var token = GenerateJwtToken(user);
            var expiresAt = DateTime.UtcNow.AddHours(24);

            return new AuthResponseDto
            {
                Success = true,
                Message = "Registration successful.",
                Token = token,
                ExpiresAt = expiresAt,
                User = MapToUserDto(user)
            };
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
        {
            var user = await _userRepository.GetByEmailAsync(loginDto.Email);

            if (user == null)
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Invalid email or password."
                };
            }

            if (!user.IsActive)
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Account is deactivated. Please contact support."
                };
            }

            if (!PasswordHasher.Verify(loginDto.Password, user.PasswordHash))
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Invalid email or password."
                };
            }

            // Generate token
            var token = GenerateJwtToken(user);
            var expiresAt = DateTime.UtcNow.AddHours(24);

            return new AuthResponseDto
            {
                Success = true,
                Message = "Login successful.",
                Token = token,
                ExpiresAt = expiresAt,
                User = MapToUserDto(user)
            };
        }

        public async Task<UserDto?> GetUserByIdAsync(int userId)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            return user == null ? null : MapToUserDto(user);
        }

        private string GenerateJwtToken(User user)
        {
            var secretKey = _configuration["Jwt:Key"];
            if (string.IsNullOrWhiteSpace(secretKey))
                secretKey = "YourSuperSecretKeyHere12345678901234567890";
                
            var issuer = _configuration["Jwt:Issuer"];
            if (string.IsNullOrWhiteSpace(issuer))
                issuer = "FoodDeliveryApp";
                
            var audience = _configuration["Jwt:Audience"];
            if (string.IsNullOrWhiteSpace(audience))
                audience = "FoodDeliveryUsers";

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.GivenName, user.FirstName),
                new Claim(ClaimTypes.Surname, user.LastName),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(24),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static UserDto MapToUserDto(User user)
        {
            return new UserDto
            {
                UserId = user.UserId,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role.ToString(),
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt
            };
        }
    }
}