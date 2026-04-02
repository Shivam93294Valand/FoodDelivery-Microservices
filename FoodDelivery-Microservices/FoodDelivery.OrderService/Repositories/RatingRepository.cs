using FoodDelivery.OrderService.Data;
using FoodDelivery.OrderService.Models;
using FoodDelivery.OrderService.DTOs;
using Microsoft.EntityFrameworkCore;

namespace FoodDelivery.OrderService.Repositories
{
    public interface IRatingRepository
    {
        Task<OrderRating> AddRatingAsync(OrderRating rating);
        Task<OrderRating?> GetRatingByOrderIdAsync(int orderId);
        Task<IEnumerable<OrderRating>> GetRatingsByRestaurantIdAsync(int restaurantId, int page = 1, int pageSize = 10);
        Task<IEnumerable<OrderRating>> GetRatingsByDeliveryPersonIdAsync(int deliveryPersonId, int page = 1, int pageSize = 10);
        Task<RatingStatsDto> GetRestaurantRatingStatsAsync(int restaurantId);
        Task<RatingStatsDto> GetDeliveryPersonRatingStatsAsync(int deliveryPersonId);
    }

    public class RatingRepository : IRatingRepository
    {
        private readonly OrderDbContext _context;

        public RatingRepository(OrderDbContext context)
        {
            _context = context;
        }

        public async Task<OrderRating> AddRatingAsync(OrderRating rating)
        {
            rating.CreatedAt = DateTime.UtcNow;
            _context.OrderRatings.Add(rating);
            await _context.SaveChangesAsync();
            return rating;
        }

        public async Task<OrderRating?> GetRatingByOrderIdAsync(int orderId)
        {
            return await _context.OrderRatings
                .FirstOrDefaultAsync(r => r.OrderId == orderId);
        }

        public async Task<IEnumerable<OrderRating>> GetRatingsByRestaurantIdAsync(int restaurantId, int page = 1, int pageSize = 10)
        {
            return await _context.OrderRatings
                .Where(r => r.RestaurantId == restaurantId && r.IsPublic)
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<IEnumerable<OrderRating>> GetRatingsByDeliveryPersonIdAsync(int deliveryPersonId, int page = 1, int pageSize = 10)
        {
            return await _context.OrderRatings
                .Where(r => r.DeliveryPersonId == deliveryPersonId && r.IsPublic)
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<RatingStatsDto> GetRestaurantRatingStatsAsync(int restaurantId)
        {
            var ratings = await _context.OrderRatings
                .Where(r => r.RestaurantId == restaurantId)
                .ToListAsync();

            if (!ratings.Any())
            {
                return new RatingStatsDto();
            }

            return new RatingStatsDto
            {
                TotalRatings = ratings.Count,
                AverageRating = ratings.Average(r => r.FoodRating),
                FiveStars = ratings.Count(r => r.FoodRating == 5),
                FourStars = ratings.Count(r => r.FoodRating == 4),
                ThreeStars = ratings.Count(r => r.FoodRating == 3),
                TwoStars = ratings.Count(r => r.FoodRating == 2),
                OneStar = ratings.Count(r => r.FoodRating == 1)
            };
        }

        public async Task<RatingStatsDto> GetDeliveryPersonRatingStatsAsync(int deliveryPersonId)
        {
            var ratings = await _context.OrderRatings
                .Where(r => r.DeliveryPersonId == deliveryPersonId)
                .ToListAsync();

            if (!ratings.Any())
            {
                return new RatingStatsDto();
            }

            return new RatingStatsDto
            {
                TotalRatings = ratings.Count,
                AverageRating = ratings.Average(r => r.DeliveryRating),
                FiveStars = ratings.Count(r => r.DeliveryRating == 5),
                FourStars = ratings.Count(r => r.DeliveryRating == 4),
                ThreeStars = ratings.Count(r => r.DeliveryRating == 3),
                TwoStars = ratings.Count(r => r.DeliveryRating == 2),
                OneStar = ratings.Count(r => r.DeliveryRating == 1)
            };
        }
    }
}
