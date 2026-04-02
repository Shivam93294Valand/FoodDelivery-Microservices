using FoodDelivery.RestaurantService.Data;
using FoodDelivery.RestaurantService.Models;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace FoodDelivery.Restaurant_UnitTesting.Repositories
{
    public class RestaurantDbContextTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly RestaurantDbContext _context;

        public RestaurantDbContextTests()
        {
            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();

            var options = new DbContextOptionsBuilder<RestaurantDbContext>()
                .UseSqlite(_connection)
                .Options;

            _context = new RestaurantDbContext(options);
            _context.Database.EnsureCreated();
        }

        public void Dispose()
        {
            _context.Dispose();
            _connection.Dispose();
        }

        [Fact]
        public async Task AddRestaurant_CanBeRetrievedById()
        {
            var restaurant = new Restaurant
            {
                Name = "SQLite Bistro", Description = "Test",
                Address = "123 Test Lane", PhoneNumber = "9000000001",
                Email = "bistro@test.com", Rating = 4.0m, IsActive = true,
                OpeningTime = new TimeSpan(9, 0, 0), ClosingTime = new TimeSpan(22, 0, 0),
                CreatedAt = DateTime.UtcNow, Cuisine = "Fusion", IsOpen = true
            };

            _context.Restaurants.Add(restaurant);
            await _context.SaveChangesAsync();

            var retrieved = await _context.Restaurants.FindAsync(restaurant.RestaurantId);

            Assert.NotNull(retrieved);
            Assert.Equal("SQLite Bistro", retrieved!.Name);
        }

        [Fact]
        public async Task AddRestaurantWithMenuItems_CascadeLoadsItems()
        {
            var restaurant = new Restaurant
            {
                Name = "Menu Test Restaurant", Rating = 3.5m, IsActive = true,
                OpeningTime = new TimeSpan(10, 0, 0), ClosingTime = new TimeSpan(21, 0, 0),
                CreatedAt = DateTime.UtcNow, IsOpen = true,
                MenuItems = new List<MenuItem>
                {
                    new MenuItem
                    {
                        Name = "Test Burger", Description = "A test burger", Price = 99m,
                        Category = "Main", IsAvailable = true, IsVegetarian = false,
                        CreatedAt = DateTime.UtcNow, Ingredients = new List<string>(), Allergens = new List<string>()
                    }
                }
            };

            _context.Restaurants.Add(restaurant);
            await _context.SaveChangesAsync();

            var loaded = await _context.Restaurants
                .Include(r => r.MenuItems)
                .FirstOrDefaultAsync(r => r.Name == "Menu Test Restaurant");

            Assert.NotNull(loaded);
            Assert.Single(loaded!.MenuItems);
            Assert.Equal("Test Burger", loaded.MenuItems.First().Name);
        }

        [Fact]
        public async Task UpdateRestaurant_PersistsRatingChange()
        {
            var restaurant = new Restaurant
            {
                Name = "Rating Test", Rating = 3.0m, IsActive = true,
                OpeningTime = new TimeSpan(8, 0, 0), ClosingTime = new TimeSpan(20, 0, 0),
                CreatedAt = DateTime.UtcNow, IsOpen = true
            };
            _context.Restaurants.Add(restaurant);
            await _context.SaveChangesAsync();

            restaurant.Rating = 4.8m;
            _context.Restaurants.Update(restaurant);
            await _context.SaveChangesAsync();

            var updated = await _context.Restaurants.FindAsync(restaurant.RestaurantId);

            Assert.Equal(4.8m, updated!.Rating);
        }

        [Fact]
        public async Task DeleteRestaurant_CascadesMenuItems()
        {
            var restaurant = new Restaurant
            {
                Name = "Cascade Delete Test", Rating = 2.0m, IsActive = true,
                OpeningTime = new TimeSpan(11, 0, 0), ClosingTime = new TimeSpan(23, 0, 0),
                CreatedAt = DateTime.UtcNow, IsOpen = true,
                MenuItems = new List<MenuItem>
                {
                    new MenuItem
                    {
                        Name = "Cascade Item", Price = 50m, Category = "Starter",
                        IsAvailable = true, IsVegetarian = true,
                        CreatedAt = DateTime.UtcNow, Ingredients = new List<string>(), Allergens = new List<string>()
                    }
                }
            };
            _context.Restaurants.Add(restaurant);
            await _context.SaveChangesAsync();
            var restaurantId = restaurant.RestaurantId;

            _context.Restaurants.Remove(restaurant);
            await _context.SaveChangesAsync();

            var deleted = await _context.Restaurants.FindAsync(restaurantId);
            var items   = await _context.MenuItems.Where(m => m.RestaurantId == restaurantId).ToListAsync();
            Assert.Null(deleted);
            Assert.Empty(items);
        }

        [Fact]
        public async Task GetAllRestaurants_ReturnsCorrectCount()
        {
            _context.Restaurants.AddRange(
                new Restaurant { Name = "R1", Rating = 4m, IsActive = true, OpeningTime = TimeSpan.Zero, ClosingTime = TimeSpan.FromHours(24), CreatedAt = DateTime.UtcNow },
                new Restaurant { Name = "R2", Rating = 3m, IsActive = true, OpeningTime = TimeSpan.Zero, ClosingTime = TimeSpan.FromHours(24), CreatedAt = DateTime.UtcNow }
            );
            await _context.SaveChangesAsync();
            var all = await _context.Restaurants.ToListAsync();
            Assert.True(all.Count >= 2);
        }
    }
}
