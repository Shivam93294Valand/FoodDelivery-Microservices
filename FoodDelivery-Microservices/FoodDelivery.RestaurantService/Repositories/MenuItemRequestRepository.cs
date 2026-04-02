using FoodDelivery.RestaurantService.Data;
using FoodDelivery.RestaurantService.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace FoodDelivery.RestaurantService.Repositories
{
    public class MenuItemRequestRepository : IMenuItemRequestRepository
    {
        private readonly RestaurantDbContext _context;
        private readonly IDistributedCache _cache;
        private readonly ILogger<MenuItemRequestRepository> _logger;

        public MenuItemRequestRepository(ILogger<MenuItemRequestRepository> logger, IDistributedCache cache, RestaurantDbContext context)
        {
            _context = context;
            _cache = cache;
            _logger = logger;
        }

        public async Task<IEnumerable<MenuItem>> GetAllAsync()
        {
            string cacheKey = "MenuItems_All";
            var cachedData = await _cache.GetStringAsync(cacheKey);
            if (!string.IsNullOrEmpty(cachedData))
            {
                return JsonSerializer.Deserialize<List<MenuItem>>(cachedData) ?? new List<MenuItem>();
            }

            var menuItems = await _context.MenuItems.ToListAsync();
            var options = new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10) };
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(menuItems), options);

            return menuItems;
        }

        public async Task<MenuItem?> GetIdAsync(int id)
        {
            string cacheKey = $"MenuItem_{id}";
            var cachedData = await _cache.GetStringAsync(cacheKey);
            if (!string.IsNullOrEmpty(cachedData))
            {
                return JsonSerializer.Deserialize<MenuItem>(cachedData);
            }

            var menuItem = await _context.MenuItems.FindAsync(id);
            if (menuItem != null)
            {
                var options = new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10) };
                await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(menuItem), options);
            }
            return menuItem;    
        }

        public async Task<MenuItem> AddAsync(MenuItem menuItem)
        {
            _context.MenuItems.Add(menuItem);
            await _context.SaveChangesAsync();
            await _cache.RemoveAsync("MenuItems_All");
            await _cache.RemoveAsync($"MenuItems_Restaurant_{menuItem.RestaurantId}");
            return menuItem;
        }

        public async Task<MenuItem> UpdateAsync(MenuItem menuItem)
        {
            _context.MenuItems.Update(menuItem);
            await _context.SaveChangesAsync();
            await _cache.RemoveAsync($"MenuItem_{menuItem.MenuItemId}");
            await _cache.RemoveAsync("MenuItems_All");
            await _cache.RemoveAsync($"MenuItems_Restaurant_{menuItem.RestaurantId}");
            return menuItem;
        }

        public async Task<MenuItem> DeleteAsync(int id)
        {
            var menuItem = await _context.MenuItems.FindAsync(id);
            if (menuItem == null) throw new ArgumentNullException(nameof(menuItem));

            _context.MenuItems.Remove(menuItem);
            await _context.SaveChangesAsync();
            await _cache.RemoveAsync($"MenuItem_{id}");
            await _cache.RemoveAsync("MenuItems_All");
            await _cache.RemoveAsync($"MenuItems_Restaurant_{menuItem.RestaurantId}");
            return menuItem;
        }

        public async Task<IEnumerable<MenuItem>> GetByRestaurantIdAsync(int restaurantId)
        {
            string cacheKey = $"MenuItems_Restaurant_{restaurantId}";
            var cachedData = await _cache.GetStringAsync(cacheKey);
            if (!string.IsNullOrEmpty(cachedData))
            {
                return JsonSerializer.Deserialize<List<MenuItem>>(cachedData) ?? new List<MenuItem>();
            }

            var menuItems = await _context.MenuItems
                .Where(mi => mi.RestaurantId == restaurantId)
                .ToListAsync();

            var options = new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10) };
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(menuItems), options);

            return menuItems;
        }
    }
}