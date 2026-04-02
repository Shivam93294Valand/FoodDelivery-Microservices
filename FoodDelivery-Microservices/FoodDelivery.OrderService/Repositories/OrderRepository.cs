using FoodDelivery.OrderService.Data;
using FoodDelivery.OrderService.Models;
using FoodDelivery.OrderService.DTOs;
using Microsoft.EntityFrameworkCore;

namespace FoodDelivery.OrderService.Repositories
{
    public class OrderRepository : IOrderRepository
    {
        private readonly OrderDbContext _context;

        public OrderRepository(OrderDbContext context)
        {
            _context = context;
        }

        public async Task<Order?> GetByIdAsync(int id)
        {
            return await _context.Orders.FindAsync(id);
        }

        public async Task<Order?> GetByIdWithItemsAsync(int id)
        {
            return await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.OrderId == id);
        }

        public async Task<IEnumerable<Order>> GetAllAsync()
        {
            return await _context.Orders
                .Include(o => o.OrderItems)
                .ToListAsync();
        }

        public async Task<IEnumerable<Order>> GetByCustomerIdAsync(int customerId)
        {
            return await _context.Orders
                .Include(o => o.OrderItems)
                .Where(o => o.CustomerId == customerId)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();
        }

        public async Task<Order> AddAsync(Order order)
        {
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();
            return order;
        }

        public async Task UpdateAsync(Order order)
        {
            _context.Entry(order).State = EntityState.Modified;
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order != null)
            {
                _context.Orders.Remove(order);
                await _context.SaveChangesAsync();
            }
        }

        // Analytics Implementation
        public async Task<IEnumerable<OrderStatsDto>> GetOrderStatsByMonthAsync(int year)
        {
            var data = await _context.Orders
                .Where(o => o.OrderDate.Year == year)
                .GroupBy(o => o.OrderDate.Month)
                .Select(g => new { 
                    Month = g.Key, 
                    Count = g.Count(),
                    TotalRevenue = g.Sum(o => o.TotalAmount)
                })
                .ToListAsync();

            string[] months = System.Globalization.CultureInfo.CurrentCulture.DateTimeFormat.AbbreviatedMonthNames;
            var result = new List<OrderStatsDto>();

            // Initialize all months with 0
            for (int i = 1; i <= 12; i++)
            {
                var monthData = data.FirstOrDefault(d => d.Month == i);
                result.Add(new OrderStatsDto
                {
                    Period = months[i - 1],
                    Count = monthData?.Count ?? 0,
                    TotalRevenue = monthData?.TotalRevenue ?? 0
                });
            }

            return result;
        }

        public async Task<IEnumerable<OrderStatsDto>> GetOrderStatsByYearAsync()
        {
             var data = await _context.Orders
                .GroupBy(o => o.OrderDate.Year)
                .Select(g => new OrderStatsDto
                { 
                    Period = g.Key.ToString(), 
                    Count = g.Count(),
                    TotalRevenue = g.Sum(o => o.TotalAmount)
                })
                .ToListAsync();

             return data;
        }

        public async Task<IEnumerable<TopCustomerDto>> GetTopCustomersAsync(int count)
        {
            return await _context.Orders
                .GroupBy(o => o.CustomerId)
                .Select(g => new TopCustomerDto
                {
                    CustomerId = g.Key,
                    OrderCount = g.Count(),
                    TotalSpent = g.Sum(o => o.TotalAmount),
                    CustomerName = "Customer #" + g.Key // Placeholder, will be enriched by Controller/Gateway if needed
                })
                .OrderByDescending(x => x.TotalSpent)
                .Take(count)
                .ToListAsync();
        }

        public async Task<IEnumerable<FrequentItemDto>> GetFrequentItemsAsync(int count)
        {
            // Assuming OrderItems are accessible via Orders.SelectMany or directly if DbSet exists.
            // Using SelectMany on Orders might be slower if no direct DbSet, but works.
            return await _context.Orders
                .SelectMany(o => o.OrderItems)
                .GroupBy(oi => new { oi.MenuItemId, oi.ItemName })
                .Select(g => new FrequentItemDto
                {
                    MenuItemId = g.Key.MenuItemId,
                    ItemName = g.Key.ItemName,
                    Count = g.Sum(x => x.Quantity)
                })
                .OrderByDescending(x => x.Count)
                .Take(count)
                .ToListAsync();
        }

        public async Task<DailyStatsDto> GetDailyStatsAsync(DateTime date)
        {
            var startDate = date.Date;
            var endDate = startDate.AddDays(1);

            var data = await _context.Orders
                .Where(o => o.OrderDate >= startDate && o.OrderDate < endDate)
                .ToListAsync();

            return new DailyStatsDto
            {
                Date = startDate,
                TotalOrders = data.Count,
                TotalRevenue = data.Sum(o => o.TotalAmount)
            };
        }
    }
}
