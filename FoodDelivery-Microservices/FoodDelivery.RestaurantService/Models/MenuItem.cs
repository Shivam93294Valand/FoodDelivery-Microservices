using System.Text.Json.Serialization;

namespace FoodDelivery.RestaurantService.Models
{
    public class MenuItem
    {
        public int MenuItemId { get; set; }
        public int RestaurantId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
        public string Category { get; set; } // e.g., "Appetizer", "Main Course", "Dessert"
        public string ImageUrl { get; set; }
        public bool IsAvailable { get; set; }
        public bool IsVegetarian { get; set; }
        public DateTime CreatedAt { get; set; }
        public decimal? Rating { get; set; }
        public int? PreparationTime { get; set; }
        public List<string> Ingredients { get; set; } = new List<string>();
        public List<string> Allergens { get; set; } = new List<string>();

        // Navigation property
        [JsonIgnore]
        public Restaurant Restaurant { get; set; }
    }
} 