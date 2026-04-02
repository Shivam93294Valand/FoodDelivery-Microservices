using FoodDelivery.AdminService.DTOs;

namespace FoodDelivery.AdminService.Services
{
    public interface IPasswordResetService
    {
        Task<ApiResponse> SendPasswordResetOtpAsync(string email);
        Task<ApiResponse> VerifyOtpAsync(string email, string otp);
        Task<ApiResponse> ResetPasswordAsync(ResetPasswordDto resetPasswordDto);
    }

    public class ApiResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
