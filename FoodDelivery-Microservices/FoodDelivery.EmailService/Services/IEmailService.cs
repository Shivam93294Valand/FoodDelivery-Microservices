namespace FoodDelivery.EmailService.Services
{
    public interface IEmailService
    {
        Task<bool> SendDeliveryAssignmentEmailAsync(
            string recipientEmail,
            string recipientName,
            int orderId,
            string restaurantName,
            string restaurantAddress,
            string deliveryAddress,
            DateTime estimatedDeliveryTime,
            decimal orderAmount
        );

        Task<bool> SendOrderConfirmationEmailAsync(
            string recipientEmail,
            string recipientName,
            int orderId,
            string restaurantName,
            decimal orderAmount,
            DateTime orderDate
        );

        Task<bool> SendOrderDeliveredEmailAsync(
            string recipientEmail,
            int orderId,
            string customerName
        );

        Task<bool> SendEmailAsync(
            string recipientEmail,
            string recipientName,
            string subject,
            string htmlBody
        );
    }
}