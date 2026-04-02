using FoodDelivery.CustomerService.DTOs;
using FoodDelivery.CustomerService.Models;

namespace FoodDelivery.CustomerService.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto);
        Task<AuthResponseDto> LoginAsync(LoginDto loginDto);
        Task<Customer> GetCurrentUserAsync(int customerId);
        string GenerateJwtToken(Customer customer);
    }
}