namespace FoodDelivery.PaymentService.Events
{
    public class OrderCreatedEvent
    {
        public int OrderId { get; set; }
        public int CustomerId { get; set; }
        public decimal TotalAmount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
    }
}