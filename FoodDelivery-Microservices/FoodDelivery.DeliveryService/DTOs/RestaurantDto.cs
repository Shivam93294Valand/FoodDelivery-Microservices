namespace FoodDelivery.DeliveryService.DTOs
{
    public class RestaurantDetailDto
    {
        public int RestaurantId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public decimal Rating { get; set; }
        public bool IsActive { get; set; }
        public TimeSpan OpeningTime { get; set; }
        public TimeSpan ClosingTime { get; set; }
        public DateTime CreatedAt { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }
}
