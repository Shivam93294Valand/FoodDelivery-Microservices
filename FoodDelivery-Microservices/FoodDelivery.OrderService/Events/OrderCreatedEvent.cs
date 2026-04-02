namespace FoodDelivery.OrderService.Events
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
        public string PaymentMethod { get; set; } = string.Empty;
        public double RestaurantLatitude { get; set; }
        public double RestaurantLongitude { get; set; }
        public double DeliveryLatitude { get; set; }
        public double DeliveryLongitude { get; set; }
        public DateTime OrderDate { get; set; }
    }
}