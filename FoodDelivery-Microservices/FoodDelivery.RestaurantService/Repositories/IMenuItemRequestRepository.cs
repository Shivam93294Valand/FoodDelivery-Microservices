using FoodDelivery.RestaurantService.Models;

namespace FoodDelivery.RestaurantService.Repositories
{
    public interface IMenuItemRequestRepository
    {
        Task<MenuItem?> GetIdAsync(int id);
        Task<IEnumerable<MenuItem>> GetAllAsync();
        Task<MenuItem> AddAsync(MenuItem menuItem);
        Task<MenuItem> UpdateAsync(MenuItem menuItem);
        Task<MenuItem> DeleteAsync(int id);
        Task<IEnumerable<MenuItem>> GetByRestaurantIdAsync(int restaurantId);
    }
}