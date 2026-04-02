namespace FoodDelivery.RestaurantService.DTOs
{
    public class RestaurantListDto
    {
        public int RestaurantId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string Address { get; set; }
        public string PhoneNumber { get; set; }
        public string Email { get; set; }
        public decimal Rating { get; set; }
        public bool IsActive { get; set; }
        public TimeSpan OpeningTime { get; set; }
        public TimeSpan ClosingTime { get; set; }
        public string Cuisine { get; set; }
        public string ImageUrl { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public bool IsOpen { get; set; }
    }

    public class RestaurantDetailDto
    {
        public int RestaurantId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string Address { get; set; }
        public string PhoneNumber { get; set; }
        public string Email { get; set; }
        public decimal Rating { get; set; }
        public bool IsActive { get; set; }
        public TimeSpan OpeningTime { get; set; }
        public TimeSpan ClosingTime { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Cuisine { get; set; }
        public string ImageUrl { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public bool IsOpen { get; set; }
        public IEnumerable<MenuItemListDto> MenuItems { get; set; }
    }

    public class RestaurantDto
    {
        public int RestaurantId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string Address { get; set; }
        public string PhoneNumber { get; set; }
        public string Email { get; set; }
        public decimal Rating { get; set; }
        public bool IsActive { get; set; }
        public TimeSpan OpeningTime { get; set; }
        public TimeSpan ClosingTime { get; set; }
        public DateTime CreatedAt { get; set; }
        public IEnumerable<MenuItemDto> MenuItems { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public bool IsOpen { get; set; }
    }

    public class CreateRestaurantDto
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public string Address { get; set; }
        public string PhoneNumber { get; set; }
        public string Email { get; set; }
        public TimeSpan OpeningTime { get; set; }
        public TimeSpan ClosingTime { get; set; }
        public string Cuisine { get; set; }
        public string ImageUrl { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public bool IsOpen { get; set; } = true;
    }

    public class UpdateRestaurantDto
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public string Address { get; set; }
        public string PhoneNumber { get; set; }
        public string Email { get; set; }
        public TimeSpan OpeningTime { get; set; }
        public TimeSpan ClosingTime { get; set; }
        public string Cuisine { get; set; }
        public string ImageUrl { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public bool IsOpen { get; set; }
    }
}