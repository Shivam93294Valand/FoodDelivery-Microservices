namespace FoodDelivery.DeliveryService.Events
{
    public class DeliveryPendingEvent
    {
        public int OrderId { get; set; }
        public int CustomerId { get; set; }
        public int RestaurantId { get; set; }
        public string Reason { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }
}
