namespace FoodDelivery.DeliveryService.Models
{
    public class DeliveryEmergencyAlert
    {
        public int Id { get; set; }
        public int DeliveryPersonId { get; set; }
        public string Message { get; set; } = string.Empty;
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string Severity { get; set; } = "Medium";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}