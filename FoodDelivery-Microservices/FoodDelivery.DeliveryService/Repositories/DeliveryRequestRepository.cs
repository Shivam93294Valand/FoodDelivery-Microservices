using FoodDelivery.DeliveryService.Data;
using FoodDelivery.DeliveryService.Models;
using Microsoft.EntityFrameworkCore;

namespace FoodDelivery.DeliveryService.Repositories
{
    public class DeliveryRequestRepository : IDeliveryRequestRepository
    {
        private readonly DeliveryDbContext _context;
    
        public DeliveryRequestRepository(DeliveryDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(Delivery delivery)
        {
            await _context.Deliveries.AddAsync(delivery);
            await _context.SaveChangesAsync();
        }

        public async Task AddAsync(DeliveryPerson person)
        {
            await _context.DeliveryPersons.AddAsync(person);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var delivery = await GetByIdAsync(id);
            if (delivery != null)
            {
                _context.Deliveries.Remove(delivery);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<IEnumerable<Delivery>> GetAllAsync()
        {
            return await _context.Deliveries.ToListAsync();
        }

        public async Task<IEnumerable<DeliveryPerson>> GetAllDeliveryPersonsAsync()
        {
            return await _context.DeliveryPersons.ToListAsync();
        }

        public async Task<DeliveryPerson?> GetAvailableDeliveryPersonAsync()
        {
            return await _context.DeliveryPersons
                .Where(p => p.IsAvailable)
                .OrderBy(p => Guid.NewGuid())
                .FirstOrDefaultAsync();
        }

        public async Task<DeliveryPerson?> GetNearestAvailableDeliveryPersonAsync(double lat, double lon)
        {
            var availablePersons = await _context.DeliveryPersons
                .Where(p => p.IsAvailable)
                .ToListAsync();

            if (!availablePersons.Any())
                return null;

            return availablePersons
                .OrderBy(p => CalculateDistance(lat, lon, p.CurrentLatitude, p.CurrentLongitude))
                .FirstOrDefault();
        }

        private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            const double R = 6371; // Earth's radius in km
            var dLat = ToRadians(lat2 - lat1);
            var dLon = ToRadians(lon2 - lon1);
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return R * c;
        }

        private double ToRadians(double degrees) => degrees * Math.PI / 180;

        public async Task<Delivery?> GetByIdAsync(int id)
        {
            return await _context.Deliveries
                .Include(d => d.DeliveryPerson)
                .FirstOrDefaultAsync(d => d.DeliveryId == id);
        }

        public async Task<Delivery?> GetByOrderIdAsync(int orderId)
        {
            return await _context.Deliveries
                .Include(d => d.DeliveryPerson)
                .FirstOrDefaultAsync(d => d.OrderId == orderId);
        }

        public async Task UpdateAsync(Delivery delivery)
        {
            _context.Deliveries.Update(delivery);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(DeliveryPerson person)
        {
            _context.DeliveryPersons.Update(person);
            await _context.SaveChangesAsync();
        }

        public async Task<DeliveryPerson?> GetDeliveryPersonByIdAsync(int id)
        {
            return await _context.DeliveryPersons.FindAsync(id);
        }

        public async Task<DeliveryPerson?> GetByEmailAsync(string email)
        {
            var normalizedEmail = (email ?? string.Empty).Trim().ToLower();
            return await _context.DeliveryPersons.FirstOrDefaultAsync(p => p.Email.Trim().ToLower() == normalizedEmail);
        }

        public async Task<int> GetTotalDeliveriesCountAsync(int deliveryPersonId)
        {
            return await _context.Deliveries
                .Where(d => d.DeliveryPersonId == deliveryPersonId && d.Status == "Delivered")
                .CountAsync();
        }

        public async Task<int> GetTodayDeliveriesCountAsync(int deliveryPersonId)
        {
            var today = DateTime.UtcNow.Date;
            return await _context.Deliveries
                .Where(d => d.DeliveryPersonId == deliveryPersonId 
                    && d.Status == "Delivered" 
                    && d.DeliveredAt.HasValue 
                    && d.DeliveredAt.Value.Date == today)
                .CountAsync();
        }

        public async Task<IEnumerable<Delivery>> GetDeliveriesByPersonAsync(int deliveryPersonId)
        {
            return await _context.Deliveries
                .Include(d => d.DeliveryPerson)
                .Where(d => d.DeliveryPersonId == deliveryPersonId)
                .ToListAsync();
        }

        public async Task DeleteDeliveryPersonAsync(int id)
        {
            var person = await _context.DeliveryPersons.FindAsync(id);
            if (person != null)
            {
                // Optionally ensure there are no active deliveries assigned
                _context.DeliveryPersons.Remove(person);
                await _context.SaveChangesAsync();
            }
        }

        // Dashboard Stats Implementation
        public async Task<int> GetWeekDeliveriesCountAsync(int deliveryPersonId)
        {
            var weekStart = DateTime.UtcNow.Date.AddDays(-(int)DateTime.UtcNow.DayOfWeek);
            return await _context.Deliveries
                .Where(d => d.DeliveryPersonId == deliveryPersonId 
                    && d.Status == "Delivered" 
                    && d.DeliveredAt.HasValue 
                    && d.DeliveredAt.Value >= weekStart)
                .CountAsync();
        }

        public async Task<int> GetMonthDeliveriesCountAsync(int deliveryPersonId)
        {
            var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            return await _context.Deliveries
                .Where(d => d.DeliveryPersonId == deliveryPersonId 
                    && d.Status == "Delivered" 
                    && d.DeliveredAt.HasValue 
                    && d.DeliveredAt.Value >= monthStart)
                .CountAsync();
        }

        public async Task<int> GetYearDeliveriesCountAsync(int deliveryPersonId)
        {
            var yearStart = new DateTime(DateTime.UtcNow.Year, 1, 1);
            return await _context.Deliveries
                .Where(d => d.DeliveryPersonId == deliveryPersonId 
                    && d.Status == "Delivered" 
                    && d.DeliveredAt.HasValue 
                    && d.DeliveredAt.Value >= yearStart)
                .CountAsync();
        }

        public async Task<decimal> GetTodayEarningsAsync(int deliveryPersonId)
        {
            var today = DateTime.UtcNow.Date;
            var deliveries = await _context.Deliveries
                .Where(d => d.DeliveryPersonId == deliveryPersonId 
                    && d.Status == "Delivered" 
                    && d.DeliveredAt.HasValue 
                    && d.DeliveredAt.Value.Date == today)
                .ToListAsync();
            
            // Assuming delivery fee of $5 per delivery (can be made configurable)
            return deliveries.Count * 5m;
        }

        public async Task<decimal> GetWeekEarningsAsync(int deliveryPersonId)
        {
            var weekStart = DateTime.UtcNow.Date.AddDays(-(int)DateTime.UtcNow.DayOfWeek);
            var deliveries = await _context.Deliveries
                .Where(d => d.DeliveryPersonId == deliveryPersonId 
                    && d.Status == "Delivered" 
                    && d.DeliveredAt.HasValue 
                    && d.DeliveredAt.Value >= weekStart)
                .ToListAsync();
            
            return deliveries.Count * 5m;
        }

        public async Task<decimal> GetMonthEarningsAsync(int deliveryPersonId)
        {
            var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            var deliveries = await _context.Deliveries
                .Where(d => d.DeliveryPersonId == deliveryPersonId 
                    && d.Status == "Delivered" 
                    && d.DeliveredAt.HasValue 
                    && d.DeliveredAt.Value >= monthStart)
                .ToListAsync();
            
            return deliveries.Count * 5m;
        }

        public async Task<decimal> GetYearEarningsAsync(int deliveryPersonId)
        {
            var yearStart = new DateTime(DateTime.UtcNow.Year, 1, 1);
            var deliveries = await _context.Deliveries
                .Where(d => d.DeliveryPersonId == deliveryPersonId 
                    && d.Status == "Delivered" 
                    && d.DeliveredAt.HasValue 
                    && d.DeliveredAt.Value >= yearStart)
                .ToListAsync();
            
            return deliveries.Count * 5m;
        }
    }
}