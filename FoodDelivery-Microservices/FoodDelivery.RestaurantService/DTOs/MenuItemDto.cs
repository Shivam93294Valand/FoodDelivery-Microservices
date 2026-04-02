namespace FoodDelivery.RestaurantService.DTOs
{
    public class MenuItemListDto
    {
        public int MenuItemId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
        public string Category { get; set; }
        public string ImageUrl { get; set; }
        public bool IsAvailable { get; set; }
        public bool IsVegetarian { get; set; }
        public decimal? Rating { get; set; }
        public int? PreparationTime { get; set; }
        public string[] Ingredients { get; set; }
        public string[] Allergens { get; set; }
    }

    public class MenuItemDetailDto
    {
        public int MenuItemId { get; set; }
        public int RestaurantId { get; set; }
        public string RestaurantName { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
        public string Category { get; set; }
        public string ImageUrl { get; set; }
        public bool IsAvailable { get; set; }
        public bool IsVegetarian { get; set; }
        public DateTime CreatedAt { get; set; }
        public decimal? Rating { get; set; }
        public int? PreparationTime { get; set; }
        public string[] Ingredients { get; set; }
        public string[] Allergens { get; set; }
    }

    public class MenuItemDto
    {
        public int MenuItemId { get; set; }
        public int RestaurantId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
        public string Category { get; set; }
        public string ImageUrl { get; set; }
        public bool IsAvailable { get; set; }
        public bool IsVegetarian { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateMenuItemDto
    {
        public int RestaurantId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
        public string Category { get; set; }
        public string ImageUrl { get; set; }
        public bool IsVegetarian { get; set; }
        public int? PreparationTime { get; set; }
        public string[] Ingredients { get; set; }
        public string[] Allergens { get; set; }
    }

    public class UpdateMenuItemDto
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
        public string Category { get; set; }
        public string ImageUrl { get; set; }
        public bool IsAvailable { get; set; }
        public bool IsVegetarian { get; set; }
        public int? PreparationTime { get; set; }
        public string[] Ingredients { get; set; }
        public string[] Allergens { get; set; }
    }

    public class UpdateMenuItemAvailabilityDto
    {
        public bool IsAvailable { get; set; }
    }
}