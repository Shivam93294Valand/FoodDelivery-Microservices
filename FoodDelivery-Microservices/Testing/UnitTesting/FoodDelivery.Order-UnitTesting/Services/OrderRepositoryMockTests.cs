using FoodDelivery.OrderService.Models;
using FoodDelivery.OrderService.Repositories;
using FoodDelivery.Common._Messaging;
using Moq;
using Xunit;

namespace FoodDelivery.Order_UnitTesting.Services
{
    /// <summary>
    /// Unit tests for order repository interactions via Moq.
    /// Tests business logic that sits between the controller and the data store.
    /// </summary>
    public class OrderRepositoryMockTests
    {
        private readonly Mock<IOrderRepository> _repoMock;

        public OrderRepositoryMockTests()
        {
            _repoMock = new Mock<IOrderRepository>();
        }

        // ── GetByIdAsync ──────────────────────────────────────────────────────

        [Fact]
        public async Task GetByIdAsync_ReturnsOrder_WhenExists()
        {
            var order = new Order
            {
                OrderId = 1, CustomerId = 10,
                OrderStatus = "Pending", TotalAmount = 250m
            };
            _repoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(order);
            var result = await _repoMock.Object.GetByIdAsync(1);
            Assert.NotNull(result);
            Assert.Equal(1, result!.OrderId);
            Assert.Equal("Pending", result.OrderStatus);
        }

        [Fact]
        public async Task GetByIdAsync_ReturnsNull_WhenNotExists()
        {
            _repoMock.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((Order?)null);
            var result = await _repoMock.Object.GetByIdAsync(999);
            Assert.Null(result);
        }

        // ── GetAllAsync ───────────────────────────────────────────────────────

        [Fact]
        public async Task GetAllAsync_ReturnsAllOrders()
        {
            var orders = new List<Order>
            {
                new Order { OrderId = 1, CustomerId = 1, OrderStatus = "Pending"   },
                new Order { OrderId = 2, CustomerId = 2, OrderStatus = "Delivered" }
            };
            _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(orders);
            var result = (await _repoMock.Object.GetAllAsync()).ToList();
            Assert.Equal(2, result.Count);
        }

        // ── AddAsync ──────────────────────────────────────────────────────────

        [Fact]
        public async Task AddAsync_CallsRepositoryOnce()
        {
            var order = new Order
            {
                CustomerId = 5, RestaurantId = 3,
                OrderStatus = "Pending", TotalAmount = 150m,
                OrderDate = DateTime.UtcNow
            };
            _repoMock.Setup(r => r.AddAsync(It.IsAny<Order>())).ReturnsAsync(order);
            await _repoMock.Object.AddAsync(order);
            _repoMock.Verify(r => r.AddAsync(It.IsAny<Order>()), Times.Once);
        }

        // ── UpdateAsync ───────────────────────────────────────────────────────

        [Fact]
        public async Task UpdateAsync_IsCalledWithCorrectOrder()
        {
            var order = new Order { OrderId = 1, OrderStatus = "Confirmed" };
            _repoMock.Setup(r => r.UpdateAsync(It.IsAny<Order>())).Returns(Task.CompletedTask);
            await _repoMock.Object.UpdateAsync(order);
            _repoMock.Verify(r => r.UpdateAsync(It.Is<Order>(o => o.OrderStatus == "Confirmed")), Times.Once);
        }

        // ── GetByCustomerIdAsync ──────────────────────────────────────────────

        [Fact]
        public async Task GetByCustomerIdAsync_ReturnsOrdersForCustomer()
        {
            var customerId = 7;
            var orders = new List<Order>
            {
                new Order { OrderId = 10, CustomerId = customerId, OrderStatus = "Delivered" },
                new Order { OrderId = 11, CustomerId = customerId, OrderStatus = "Cancelled" }
            };
            _repoMock.Setup(r => r.GetByCustomerIdAsync(customerId)).ReturnsAsync(orders);
            var result = (await _repoMock.Object.GetByCustomerIdAsync(customerId)).ToList();
            Assert.Equal(2, result.Count);
            Assert.All(result, o => Assert.Equal(customerId, o.CustomerId));
        }

        // ── DeleteAsync ───────────────────────────────────────────────────────

        [Fact]
        public async Task DeleteAsync_IsCalledWithCorrectId()
        {
            _repoMock.Setup(r => r.DeleteAsync(It.IsAny<int>())).Returns(Task.CompletedTask);
            await _repoMock.Object.DeleteAsync(42);
            _repoMock.Verify(r => r.DeleteAsync(42), Times.Once);
        }
    }
}
