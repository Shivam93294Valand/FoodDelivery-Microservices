using FoodDelivery.DeliveryService.DTOs;
using FoodDelivery.DeliveryService.Models;

namespace FoodDelivery.DeliveryService.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto> LoginAsync(LoginDto loginDto);
        string GenerateJwtToken(DeliveryPerson person);
    }
} 