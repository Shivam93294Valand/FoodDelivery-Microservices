namespace FoodDelivery.RestaurantService.Models
{
    public class Restaurant
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
        public string Cuisine { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public bool IsOpen { get; set; } = true;

        // Navigation property
        public ICollection<MenuItem> MenuItems { get; set; } = new List<MenuItem>();
    }
}