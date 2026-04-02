using FoodDelivery.RestaurantService.Models;

namespace FoodDelivery.RestaurantService.Repositories
{
    public interface IRestaurantRequestRepository
    {
        Task<Restaurant?> GetIdAsync(int id);
        Task<IEnumerable<Restaurant>> GetAllAsync();
        Task<Restaurant> AddAsync(Restaurant restaurant);
        Task<Restaurant> UpdateAsync(Restaurant restaurant);
        Task<Restaurant> DeleteAsync(int id);
        
        // Analytics
        Task<FoodDelivery.RestaurantService.DTOs.RestaurantStatsDto> GetStatsAsync();
    }
}