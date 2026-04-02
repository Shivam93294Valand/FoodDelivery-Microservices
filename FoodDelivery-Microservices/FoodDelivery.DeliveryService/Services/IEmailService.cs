namespace FoodDelivery.DeliveryService.Services
{
    public interface IEmailService
    {
        Task SendOrderDeliveredEmailAsync(string customerEmail, int orderId, string customerName);
        Task<bool> SendDeliveryOtpEmailAsync(string customerEmail, string customerName, int orderId, int deliveryId, string otp, DateTime expiresAt);
        Task<bool> SendPasswordResetOtpEmailAsync(string email, string recipientName, string otp, DateTime expiresAt);
    }
}
