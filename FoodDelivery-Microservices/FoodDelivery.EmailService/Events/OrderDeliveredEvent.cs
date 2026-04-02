namespace FoodDelivery.EmailService.Events
{
    public class OrderDeliveredEvent
    {
        public int OrderId { get; set; }
        public int CustomerId { get; set; }
        public string CustomerEmail { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public DateTime DeliveredAt { get; set; }
    }
}
