using FoodDelivery.DeliveryService.Models;

namespace FoodDelivery.DeliveryService.Models
{
    public class Delivery
    {
        public int DeliveryId { get; set; }
        public int OrderId { get; set; }
        public int DeliveryPersonId { get; set; }
        public int CustomerId { get; set; } // Customer who placed the order
        public string Status { get; set; } = "Pending";
        public DateTime AssignedAt { get; set; }
        public DateTime? PickedUpAt { get; set; }
        public DateTime? DeliveredAt { get; set; }
        public double RestaurantLatitude { get; set; }
        public double RestaurantLongitude { get; set; }
        public double DeliveryLatitude { get; set; }
        public double DeliveryLongitude { get; set; }

        public DeliveryPerson? DeliveryPerson { get; set; }

        public string? PickupAddress { get; set; }
        public string? DeliveryAddress { get; set; }
        public DateTime? EstimatedDeliveryTime { get; set; } 
    }
}