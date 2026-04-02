namespace FoodDelivery.RestaurantService.DTOs
{
    public class RestaurantStatsDto
    {
        public int TotalRestaurants { get; set; }
        public int ActiveRestaurants { get; set; }
        public double AverageRating { get; set; }
    }
}
