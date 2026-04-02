namespace FoodDelivery.OrderService.Models
{
    public class OrderRating
    {
        public int RatingId { get; set; }
        public int OrderId { get; set; }
        public int CustomerId { get; set; }
        public int? RestaurantId { get; set; }
        public int? DeliveryPersonId { get; set; }
        
        // Ratings (1-5 stars)
        public int FoodRating { get; set; }
        public int DeliveryRating { get; set; }
        public int OverallRating { get; set; }
        
        // Reviews
        public string? FoodReview { get; set; }
        public string? DeliveryReview { get; set; }
        public string? OverallReview { get; set; }
        
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        
        public bool IsPublic { get; set; } = true;
        public bool IsVerified { get; set; } = true;

        public Order? Order { get; set; }
    }
}
