namespace FoodDelivery.OrderService.DTOs
{
    public class CreateRatingDto
    {
        public int OrderId { get; set; }
        public int FoodRating { get; set; } // 1-5
        public int DeliveryRating { get; set; } // 1-5
        public int OverallRating { get; set; } // 1-5
        public string? FoodReview { get; set; }
        public string? DeliveryReview { get; set; }
        public string? OverallReview { get; set; }
    }

    public class RatingResponseDto
    {
        public int RatingId { get; set; }
        public int OrderId { get; set; }
        public int FoodRating { get; set; }
        public int DeliveryRating { get; set; }
        public int OverallRating { get; set; }
        public string? FoodReview { get; set; }
        public string? DeliveryReview { get; set; }
        public string? OverallReview { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class RatingStatsDto
    {
        public int TotalRatings { get; set; }
        public double AverageRating { get; set; }
        public int FiveStars { get; set; }
        public int FourStars { get; set; }
        public int ThreeStars { get; set; }
        public int TwoStars { get; set; }
        public int OneStar { get; set; }
    }
}
