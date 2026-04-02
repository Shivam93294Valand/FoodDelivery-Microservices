using FoodDelivery.OrderService.Data;
using FoodDelivery.OrderService.Models;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace FoodDelivery.Order_UnitTesting.Repositories
{
    public class OrderDbContextTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly OrderDbContext _context;

        public OrderDbContextTests()
        {
            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();

            var options = new DbContextOptionsBuilder<OrderDbContext>()
                .UseSqlite(_connection)
                .Options;

            _context = new OrderDbContext(options);
            _context.Database.EnsureCreated();
        }

        public void Dispose()
        {
            _context.Dispose();
            _connection.Dispose();
        }

        // ── Order CRUD ────────────────────────────────────────────────────────

        [Fact]
        public async Task AddOrder_CanBeRetrievedById()
        {
            var order = new Order
            {
                CustomerId = 1, RestaurantId = 2, DeliveryAddressId = 3,
                OrderStatus = "Pending", PaymentStatus = "Pending",
                PaymentMethod = "Cash", SubTotal = 100m, DeliveryCharge = 20m,
                Tax = 5m, TotalAmount = 125m, OrderDate = DateTime.UtcNow,
                OrderItems = new List<OrderItem>()
            };
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            var retrieved = await _context.Orders.FindAsync(order.OrderId);
            Assert.NotNull(retrieved);
            Assert.Equal("Pending", retrieved!.OrderStatus);
            Assert.Equal(125m, retrieved.TotalAmount);
        }

        [Fact]
        public async Task AddOrderWithItems_CascadeLoadsItems()
        {
            var order = new Order
            {
                CustomerId = 2, RestaurantId = 3, DeliveryAddressId = 4,
                OrderStatus = "Confirmed", PaymentStatus = "Completed",
                PaymentMethod = "Card", SubTotal = 200m, DeliveryCharge = 30m,
                Tax = 10m, TotalAmount = 240m, OrderDate = DateTime.UtcNow,
                OrderItems = new List<OrderItem>
                {
                    new OrderItem { MenuItemId = 10, ItemName = "Burger", Quantity = 2, UnitPrice = 80m, TotalPrice = 160m },
                    new OrderItem { MenuItemId = 11, ItemName = "Fries",  Quantity = 1, UnitPrice = 40m, TotalPrice = 40m  }
                }
            };
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            var loaded = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.OrderId == order.OrderId);
            Assert.NotNull(loaded);
            Assert.Equal(2, loaded!.OrderItems.Count);
        }

        [Fact]
        public async Task UpdateOrderStatus_PersistsChange()
        {
            var order = new Order
            {
                CustomerId = 3, RestaurantId = 4, DeliveryAddressId = 5,
                OrderStatus = "Pending", PaymentStatus = "Pending",
                PaymentMethod = "UPI", SubTotal = 50m, DeliveryCharge = 10m,
                Tax = 2.5m, TotalAmount = 62.5m, OrderDate = DateTime.UtcNow,
                OrderItems = new List<OrderItem>()
            };
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();
            order.OrderStatus = "Delivered";
            _context.Orders.Update(order);
            await _context.SaveChangesAsync();

            var updated = await _context.Orders.FindAsync(order.OrderId);
            Assert.Equal("Delivered", updated!.OrderStatus);
        }

        [Fact]
        public async Task DeleteOrder_RemovesEntityAndCascadesItems()
        {
            var order = new Order
            {
                CustomerId = 4, RestaurantId = 5, DeliveryAddressId = 6,
                OrderStatus = "Cancelled", PaymentStatus = "Failed",
                PaymentMethod = "Cash", SubTotal = 0m, DeliveryCharge = 0m,
                Tax = 0m, TotalAmount = 0m, OrderDate = DateTime.UtcNow,
                OrderItems = new List<OrderItem>
                {
                    new OrderItem { MenuItemId = 20, ItemName = "Deleted Item", Quantity = 1, UnitPrice = 0m, TotalPrice = 0m }
                }
            };
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();
            var orderId = order.OrderId;
            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();
            var deleted  = await _context.Orders.FindAsync(orderId);
            var items    = await _context.OrderItems.Where(i => i.OrderId == orderId).ToListAsync();
            Assert.Null(deleted);
            Assert.Empty(items);
        }

        [Theory]
        [InlineData("Pending")]
        [InlineData("Confirmed")]
        [InlineData("Preparing")]
        [InlineData("OutForDelivery")]
        [InlineData("Delivered")]
        [InlineData("Cancelled")]
        public async Task OrderStatus_AcceptsAllValidValues(string status)
        {
            var order = new Order
            {
                CustomerId = 99, RestaurantId = 1, DeliveryAddressId = 1,
                OrderStatus = status, PaymentStatus = "Pending",
                PaymentMethod = "Cash", SubTotal = 10m, DeliveryCharge = 5m,
                Tax = 1m, TotalAmount = 16m, OrderDate = DateTime.UtcNow,
                OrderItems = new List<OrderItem>()
            };
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();
            var saved = await _context.Orders.FindAsync(order.OrderId);
            Assert.Equal(status, saved!.OrderStatus);
        }
    }
}
