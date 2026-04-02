using FoodDelivery.CustomerService.DTOs;
using FoodDelivery.CustomerService.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace FoodDelivery.CustomerService.Services
{
    public class AuthService : IAuthService
    {
        private readonly ICustomerRequestRepository _customerRepository;
        private readonly IConfiguration _configuration;

        public AuthService(ICustomerRequestRepository customerRepository, IConfiguration configuration)
        {
            _customerRepository = customerRepository;
            _configuration = configuration;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto)
        {
            // Normalize email
            var normalizedEmail = registerDto.Email?.Trim()?.ToLower();
            if (string.IsNullOrWhiteSpace(normalizedEmail))
            {
                throw new Exception("Email is required");
            }
            var existingCustomer = await _customerRepository.GetByEmailAsync(normalizedEmail);
            if (existingCustomer == null)
            {
                existingCustomer = await _customerRepository.GetByEmailAsync(registerDto.Email);
            }
            
            if (existingCustomer != null)
            {
                throw new Exception("User with this email already exists");
            }
            var customer = new Customer
            {
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName,
                Email = normalizedEmail, // Store normalized email
                PhoneNumber = registerDto.PhoneNumber,
                Password = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
                CreatedAt = DateTime.UtcNow,
                IsActive = true,
                Addresses = new List<CustomerAddress>()
            };

            await _customerRepository.AddRequestAsync(customer);

            // Generate JWT token
            var token = GenerateJwtToken(customer);

            return new AuthResponseDto
            {
                Token = token,
                Customer = new CustomerDto
                {
                    CustomerId = customer.CustomerId,
                    FirstName = customer.FirstName,
                    LastName = customer.LastName,
                    Email = customer.Email,
                    PhoneNumber = customer.PhoneNumber
                }
            };
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
        {
            // Normalize email input
            var normalizedEmail = loginDto.Email?.Trim()?.ToLower();
            if (string.IsNullOrWhiteSpace(normalizedEmail))
            {
                throw new Exception("Invalid email or password");
            }

            // Try to find customer with case-insensitive email search
            var customer = await _customerRepository.GetByEmailAsync(loginDto.Email);
            
            // If not found, try with normalized email
            if (customer == null)
            {
                customer = await _customerRepository.GetByEmailAsync(normalizedEmail);
            }

            if (customer == null)
            {
                throw new Exception("Invalid email or password");
            }

            // Trim password input
            var password = loginDto.Password?.Trim();
            if (string.IsNullOrWhiteSpace(password))
            {
                throw new Exception("Invalid email or password");
            }

            var isBcryptHash = customer.Password.StartsWith("$2a$") ||
                               customer.Password.StartsWith("$2b$") ||
                               customer.Password.StartsWith("$2y$");

            if (isBcryptHash)
            {
                if (!BCrypt.Net.BCrypt.Verify(password, customer.Password))
                {
                    throw new Exception("Invalid email or password");
                }
            }
            else
            {
                if (customer.Password != password && customer.Password != loginDto.Password)
                {
                    throw new Exception("Invalid email or password");
                }

                customer.Password = BCrypt.Net.BCrypt.HashPassword(password);
                await _customerRepository.UpdateRequestAsync(customer);
            }

            if (!customer.IsActive)
            {
                throw new Exception("Account is deactivated");
            }

            var token = GenerateJwtToken(customer);

            return new AuthResponseDto
            {
                Token = token,
                Customer = new CustomerDto
                {
                    CustomerId = customer.CustomerId,
                    FirstName = customer.FirstName,
                    LastName = customer.LastName,
                    Email = customer.Email,
                    PhoneNumber = customer.PhoneNumber
                }
            };
        }

        public async Task<Customer> GetCurrentUserAsync(int customerId)
        {
            return await _customerRepository.GetRequestByIdAsync(customerId);
        }

        public string GenerateJwtToken(Customer customer)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, customer.CustomerId.ToString()),
                new Claim(ClaimTypes.Email, customer.Email),
                new Claim(ClaimTypes.GivenName, customer.FirstName),
                new Claim(ClaimTypes.Surname, customer.LastName),
                new Claim(ClaimTypes.Role, "Customer"),
                new Claim("CustomerId", customer.CustomerId.ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddDays(7),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}