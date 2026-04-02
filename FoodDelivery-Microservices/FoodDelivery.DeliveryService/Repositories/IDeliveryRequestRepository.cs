using FoodDelivery.DeliveryService.Models;

namespace FoodDelivery.DeliveryService.Repositories
{
    public interface IDeliveryRequestRepository
    {
        Task<Delivery?> GetByIdAsync(int id);
        Task<IEnumerable<Delivery>> GetAllAsync();
        Task AddAsync(Delivery delivery);
        Task UpdateAsync(Delivery delivery);
        Task DeleteAsync(int id);
        Task<DeliveryPerson?> GetAvailableDeliveryPersonAsync();
        Task<DeliveryPerson?> GetNearestAvailableDeliveryPersonAsync(double lat, double lon);
        Task UpdateAsync(DeliveryPerson person);
        Task<Delivery?> GetByOrderIdAsync(int orderId);
        Task<IEnumerable<DeliveryPerson>> GetAllDeliveryPersonsAsync();
        Task AddAsync(DeliveryPerson person);
        Task<DeliveryPerson?> GetDeliveryPersonByIdAsync(int id);
        Task<DeliveryPerson?> GetByEmailAsync(string email);
        Task<int> GetTotalDeliveriesCountAsync(int deliveryPersonId);
        Task<int> GetTodayDeliveriesCountAsync(int deliveryPersonId);
        Task<IEnumerable<Models.Delivery>> GetDeliveriesByPersonAsync(int deliveryPersonId);
        Task DeleteDeliveryPersonAsync(int id);
        
        // Dashboard Stats
        Task<int> GetWeekDeliveriesCountAsync(int deliveryPersonId);
        Task<int> GetMonthDeliveriesCountAsync(int deliveryPersonId);
        Task<int> GetYearDeliveriesCountAsync(int deliveryPersonId);
        Task<decimal> GetTodayEarningsAsync(int deliveryPersonId);
        Task<decimal> GetWeekEarningsAsync(int deliveryPersonId);
        Task<decimal> GetMonthEarningsAsync(int deliveryPersonId);
        Task<decimal> GetYearEarningsAsync(int deliveryPersonId);
    }
}