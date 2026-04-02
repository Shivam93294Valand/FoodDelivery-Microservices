using FoodDelivery.DeliveryService.DTOs;

namespace FoodDelivery.DeliveryService.Services
{
    public interface IPasswordResetService
    {
        Task<ApiResponse> SendPasswordResetOtpAsync(string email);
        Task<ApiResponse> VerifyOtpAsync(string email, string otp);
        Task<ApiResponse> ResetPasswordAsync(ResetPasswordDto resetPasswordDto);
    }
}