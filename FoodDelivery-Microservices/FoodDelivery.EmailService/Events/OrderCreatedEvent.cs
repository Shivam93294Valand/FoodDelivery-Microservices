namespace FoodDelivery.EmailService.Events
{
    public class OrderCreatedEvent
    {
        public int OrderId { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; }
        public string CustomerEmail { get; set; }
        public int RestaurantId { get; set; }
        public string RestaurantName { get; set; }
        public string RestaurantAddress { get; set; }
        public int DeliveryAddressId { get; set; }
        public int? DeliveryPersonId { get; set; }
        public decimal TotalAmount { get; set; }
        public string PaymentMethod { get; set; }
        public DateTime OrderDate { get; set; }
    }
}
