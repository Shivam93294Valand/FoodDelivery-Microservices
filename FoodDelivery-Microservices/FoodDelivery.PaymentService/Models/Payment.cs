namespace FoodDelivery.PaymentService.Models
{
    public class Payment
    {
        public int PaymentId { get; set; }
        public int OrderId { get; set; }
        public int CustomerId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty; // "Cash", "Card", "UPI"
        public string Status { get; set; } = "Pending"; // "Pending", "Completed", "Failed", "Refunded"
        public string TransactionId { get; set; } = string.Empty;
        public DateTime PaymentDate { get; set; }
        public DateTime? CompletedAt { get; set; }
    }
}