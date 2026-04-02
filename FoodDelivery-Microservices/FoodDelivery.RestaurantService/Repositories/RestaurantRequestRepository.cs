using FoodDelivery.RestaurantService.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace FoodDelivery.RestaurantService.Repositories
{
    public class RestaurantRequestRepository : IRestaurantRequestRepository
    {
        private readonly RestaurantDbContext _context;
        private readonly IDistributedCache _cache;

        public RestaurantRequestRepository(RestaurantDbContext context, IDistributedCache cache)
        {
            _context = context;
            _cache = cache;
        }

        public async Task<Models.Restaurant?> GetIdAsync(int id)
        {
            var options = new JsonSerializerOptions { ReferenceHandler = ReferenceHandler.IgnoreCycles, PropertyNameCaseInsensitive = true };

            var cachedData = await _cache.GetStringAsync($"Restaurant_{id}");
            if (!string.IsNullOrEmpty(cachedData))
            {
                return JsonSerializer.Deserialize<Models.Restaurant>(cachedData, options);
            }

            var restaurant = await _context.Restaurants
                .Include(r => r.MenuItems)
                .FirstOrDefaultAsync(r => r.RestaurantId == id);

            if (restaurant != null)
            {
                await _cache.SetStringAsync($"Restaurant_{id}", JsonSerializer.Serialize(restaurant, options));
            }

            return restaurant;
        }

        public async Task<IEnumerable<Models.Restaurant>> GetAllAsync()
        {
            var serializerOptions = new JsonSerializerOptions { ReferenceHandler = ReferenceHandler.IgnoreCycles, PropertyNameCaseInsensitive = true };

            var cacheKey = "AllRestaurants";
            var cachedData = await _cache.GetStringAsync(cacheKey);
            if (!string.IsNullOrEmpty(cachedData))
            {
                return JsonSerializer.Deserialize<IEnumerable<Models.Restaurant>>(cachedData, serializerOptions) ?? new List<Models.Restaurant>();
            }

            var restaurants = await _context.Restaurants.ToListAsync();
            var cacheOptions = new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5) };
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(restaurants, serializerOptions), cacheOptions);
            return restaurants;
        }

        public async Task<Models.Restaurant> AddAsync(Models.Restaurant restaurant)
        {
            _context.Restaurants.Add(restaurant);
            await _context.SaveChangesAsync();
            await _cache.RemoveAsync("AllRestaurants");
            return restaurant;
        }

        public async Task<Models.Restaurant> UpdateAsync(Models.Restaurant restaurant)
        {
            _context.Restaurants.Update(restaurant);
            await _context.SaveChangesAsync();
            await _cache.RemoveAsync($"Restaurant_{restaurant.RestaurantId}");
            await _cache.RemoveAsync("AllRestaurants");
            return restaurant;
        }

        public async Task<Models.Restaurant> DeleteAsync(int id)
        {
            var restaurant = await _context.Restaurants.FindAsync(id);
            if (restaurant != null)
            {
                _context.Restaurants.Remove(restaurant);
                await _context.SaveChangesAsync();
                await _cache.RemoveAsync($"Restaurant_{id}");
                await _cache.RemoveAsync("AllRestaurants");
            }
            return restaurant;
        }

        public async Task<FoodDelivery.RestaurantService.DTOs.RestaurantStatsDto> GetStatsAsync()
        {
             var total = await _context.Restaurants.CountAsync();
             var active = await _context.Restaurants.CountAsync(r => r.IsActive);
             var avgRating = total > 0 ? await _context.Restaurants.AverageAsync(r => r.Rating) : 0;

             return new FoodDelivery.RestaurantService.DTOs.RestaurantStatsDto
             {
                 TotalRestaurants = total,
                 ActiveRestaurants = active,
                 AverageRating = (double)avgRating
             };
        }
    }
}