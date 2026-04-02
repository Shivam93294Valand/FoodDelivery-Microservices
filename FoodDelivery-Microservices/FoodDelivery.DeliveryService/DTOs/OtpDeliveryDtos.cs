using FoodDelivery.DeliveryService.Models;

namespace FoodDelivery.DeliveryService.DTOs
{
    public class OtpDeliveryConfirmationDto
    {
        public int DeliveryId { get; set; }
        public string Otp { get; set; } = string.Empty;
    }

    public class GenerateDeliveryOtpResponseDto
    {
        public int DeliveryId { get; set; }
        public string Otp { get; set; } = string.Empty; // Remove in production
        public DateTime ExpiresAt { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class ConfirmDeliveryResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public DateTime? ConfirmedAt { get; set; }
    }
}
