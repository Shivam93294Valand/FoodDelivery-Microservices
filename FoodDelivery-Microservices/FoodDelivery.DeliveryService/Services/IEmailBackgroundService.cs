namespace FoodDelivery.DeliveryService.Services
{
    public interface IEmailBackgroundService
    {
        Task SendPasswordResetOtpEmailAsync(string email, string userName, string otp);
    }
}
