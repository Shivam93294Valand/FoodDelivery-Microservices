namespace FoodDelivery.EmailService.Models
{
    public class EmailLog
    {
        public int EmailLogId { get; set; }
        public string RecipientEmail { get; set; } = string.Empty;
        public string RecipientName { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public bool IsSent { get; set; }
        public DateTime SentAt { get; set; }
        public string? ErrorMessage { get; set; }
        public string EmailType { get; set; } = string.Empty; // "DeliveryAssignment", "OrderConfirmation", etc.
        public int? OrderId { get; set; }
        public int? DeliveryId { get; set; }
    }
}