using FoodDelivery.OrderService.Models;
using FoodDelivery.OrderService.DTOs;

namespace FoodDelivery.OrderService.Repositories
{
    public interface IOrderRepository
    {
        Task<Order?> GetByIdAsync(int id);
        Task<Order?> GetByIdWithItemsAsync(int id);
        Task<IEnumerable<Order>> GetAllAsync();
        Task<IEnumerable<Order>> GetByCustomerIdAsync(int customerId);
        Task<Order> AddAsync(Order order);
        Task UpdateAsync(Order order);
        Task DeleteAsync(int id);
        
        // Analytics
        Task<IEnumerable<OrderStatsDto>> GetOrderStatsByMonthAsync(int year);
        Task<IEnumerable<OrderStatsDto>> GetOrderStatsByYearAsync();
        Task<IEnumerable<TopCustomerDto>> GetTopCustomersAsync(int count);
        Task<IEnumerable<FrequentItemDto>> GetFrequentItemsAsync(int count);
        Task<DailyStatsDto> GetDailyStatsAsync(DateTime date);
    }
}
