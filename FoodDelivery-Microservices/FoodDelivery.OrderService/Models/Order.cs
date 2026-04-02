namespace FoodDelivery.OrderService.Models
{
    public class Order
    {
        public int OrderId { get; set; }
        public int CustomerId { get; set; }
        public int RestaurantId { get; set; }
        public int? DeliveryPersonId { get; set; }
        public int DeliveryAddressId { get; set; }
        public string OrderStatus { get; set; } // "Pending", "Confirmed", "Preparing", "OutForDelivery", "Delivered", "Cancelled"
        public decimal SubTotal { get; set; }
        public decimal DeliveryCharge { get; set; }
        public decimal Tax { get; set; }
        public decimal TotalAmount { get; set; }
        public string PaymentStatus { get; set; } // "Pending", "Completed", "Failed"
        public string PaymentMethod { get; set; } // "Cash", "Card", "UPI"
        public DateTime OrderDate { get; set; }
        public DateTime? DeliveryTime { get; set; }
        public string SpecialInstructions { get; set; }

        public ICollection<OrderItem> OrderItems { get; set; }
    }
}