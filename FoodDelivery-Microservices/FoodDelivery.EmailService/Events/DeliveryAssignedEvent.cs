namespace FoodDelivery.EmailService.Events
{
    public class DeliveryAssignedEvent
    {
        public int OrderId { get; set; }
        public int DeliveryId { get; set; }
        public int DeliveryPersonId { get; set; }
        public string DeliveryPersonFirstName { get; set; } = string.Empty;
        public string DeliveryPersonLastName { get; set; } = string.Empty;
        public string DeliveryPersonEmail { get; set; } = string.Empty;
        public string DeliveryPersonPhone { get; set; } = string.Empty;

        public int CustomerId { get; set; }
        public int RestaurantId { get; set; }
        public string RestaurantName { get; set; } = string.Empty;
        public string RestaurantAddress { get; set; } = string.Empty;
        public string DeliveryAddress { get; set; } = string.Empty;
        public decimal OrderTotalAmount { get; set; }

        public DateTime AssignedAt { get; set; }
        public DateTime? EstimatedDeliveryTime { get; set; }

        public double RestaurantLatitude { get; set; }
        public double RestaurantLongitude { get; set; }
        public double DeliveryLatitude { get; set; }
        public double DeliveryLongitude { get; set; }
    }
}