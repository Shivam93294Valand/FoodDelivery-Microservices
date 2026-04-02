using Moq;
using Xunit;
using FoodDelivery.DeliveryService.Repositories;
using FoodDelivery.DeliveryService.Models;

namespace FoodDelivery.Delivery_UnitTesting.Services
{
    public class DeliveryRepositoryMockTests
    {
        private readonly Mock<IDeliveryRequestRepository> _mockRepo;

        public DeliveryRepositoryMockTests()
        {
            _mockRepo = new Mock<IDeliveryRequestRepository>();
        }

        [Fact]
        public async Task GetByIdAsync_ExistingId_ReturnsDelivery()
        {
            var delivery = new Delivery { DeliveryId = 1, OrderId = 10, Status = "Pending" };
            _mockRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(delivery);

            var result = await _mockRepo.Object.GetByIdAsync(1);

            Assert.NotNull(result);
            Assert.Equal(1, result.DeliveryId);
            Assert.Equal("Pending", result.Status);
        }

        [Fact]
        public async Task GetByIdAsync_NonExistingId_ReturnsNull()
        {
            _mockRepo.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((Delivery?)null);

            var result = await _mockRepo.Object.GetByIdAsync(999);

            Assert.Null(result);
        }

        [Fact]
        public async Task GetAllAsync_ReturnsAllDeliveries()
        {
            var deliveries = new List<Delivery>
            {
                new Delivery { DeliveryId = 1, OrderId = 10, Status = "Pending" },
                new Delivery { DeliveryId = 2, OrderId = 11, Status = "Delivered" }
            };
            _mockRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(deliveries);

            var result = await _mockRepo.Object.GetAllAsync();

            Assert.Equal(2, result.Count());
        }

        [Fact]
        public async Task AddAsync_Delivery_CallsRepositoryOnce()
        {
            var delivery = new Delivery { DeliveryId = 1, OrderId = 10, Status = "Pending" };
            _mockRepo.Setup(r => r.AddAsync(It.IsAny<Delivery>())).Returns(Task.CompletedTask);

            await _mockRepo.Object.AddAsync(delivery);

            _mockRepo.Verify(r => r.AddAsync(It.IsAny<Delivery>()), Times.Once);
        }

        [Fact]
        public async Task UpdateAsync_Delivery_UpdatesCorrectDelivery()
        {
            var delivery = new Delivery { DeliveryId = 1, OrderId = 10, Status = "PickedUp" };
            _mockRepo.Setup(r => r.UpdateAsync(It.IsAny<Delivery>())).Returns(Task.CompletedTask);

            await _mockRepo.Object.UpdateAsync(delivery);

            _mockRepo.Verify(r => r.UpdateAsync(It.Is<Delivery>(d => d.Status == "PickedUp")), Times.Once);
        }

        [Fact]
        public async Task DeleteAsync_ExistingId_CallsRepositoryOnce()
        {
            _mockRepo.Setup(r => r.DeleteAsync(1)).Returns(Task.CompletedTask);

            await _mockRepo.Object.DeleteAsync(1);

            _mockRepo.Verify(r => r.DeleteAsync(1), Times.Once);
        }

        [Fact]
        public async Task GetByOrderIdAsync_ExistingOrderId_ReturnsDelivery()
        {
            var delivery = new Delivery { DeliveryId = 1, OrderId = 42, Status = "Pending" };
            _mockRepo.Setup(r => r.GetByOrderIdAsync(42)).ReturnsAsync(delivery);

            var result = await _mockRepo.Object.GetByOrderIdAsync(42);

            Assert.NotNull(result);
            Assert.Equal(42, result.OrderId);
        }

        [Fact]
        public async Task GetByOrderIdAsync_NonExisting_ReturnsNull()
        {
            _mockRepo.Setup(r => r.GetByOrderIdAsync(999)).ReturnsAsync((Delivery?)null);

            var result = await _mockRepo.Object.GetByOrderIdAsync(999);

            Assert.Null(result);
        }

        [Fact]
        public async Task GetAvailableDeliveryPersonAsync_WhenAvailable_ReturnsPerson()
        {
            var person = new DeliveryPerson { DeliveryPersonId = 1, FirstName = "John", IsAvailable = true };
            _mockRepo.Setup(r => r.GetAvailableDeliveryPersonAsync()).ReturnsAsync(person);

            var result = await _mockRepo.Object.GetAvailableDeliveryPersonAsync();

            Assert.NotNull(result);
            Assert.True(result.IsAvailable);
        }

        [Fact]
        public async Task GetAvailableDeliveryPersonAsync_NoneAvailable_ReturnsNull()
        {
            _mockRepo.Setup(r => r.GetAvailableDeliveryPersonAsync()).ReturnsAsync((DeliveryPerson?)null);

            var result = await _mockRepo.Object.GetAvailableDeliveryPersonAsync();

            Assert.Null(result);
        }

        [Fact]
        public async Task GetNearestAvailableDeliveryPersonAsync_ReturnsPerson()
        {
            var person = new DeliveryPerson { DeliveryPersonId = 2, FirstName = "Jane", IsAvailable = true };
            _mockRepo.Setup(r => r.GetNearestAvailableDeliveryPersonAsync(It.IsAny<double>(), It.IsAny<double>()))
                     .ReturnsAsync(person);

            var result = await _mockRepo.Object.GetNearestAvailableDeliveryPersonAsync(23.0, 72.0);

            Assert.NotNull(result);
            Assert.Equal(2, result.DeliveryPersonId);
        }

        [Fact]
        public async Task GetAllDeliveryPersonsAsync_ReturnsAll()
        {
            var persons = new List<DeliveryPerson>
            {
                new DeliveryPerson { DeliveryPersonId = 1, FirstName = "John" },
                new DeliveryPerson { DeliveryPersonId = 2, FirstName = "Jane" }
            };
            _mockRepo.Setup(r => r.GetAllDeliveryPersonsAsync()).ReturnsAsync(persons);

            var result = await _mockRepo.Object.GetAllDeliveryPersonsAsync();

            Assert.Equal(2, result.Count());
        }

        [Fact]
        public async Task GetDeliveriesByPersonAsync_ReturnsList()
        {
            var deliveries = new List<Delivery>
            {
                new Delivery { DeliveryId = 1, DeliveryPersonId = 5, Status = "Delivered" }
            };
            _mockRepo.Setup(r => r.GetDeliveriesByPersonAsync(5)).ReturnsAsync(deliveries);

            var result = await _mockRepo.Object.GetDeliveriesByPersonAsync(5);

            Assert.Single(result);
        }

        [Fact]
        public async Task GetTotalDeliveriesCountAsync_ReturnsCount()
        {
            _mockRepo.Setup(r => r.GetTotalDeliveriesCountAsync(1)).ReturnsAsync(15);

            var result = await _mockRepo.Object.GetTotalDeliveriesCountAsync(1);

            Assert.Equal(15, result);
        }

        [Fact]
        public async Task GetTodayDeliveriesCountAsync_ReturnsCount()
        {
            _mockRepo.Setup(r => r.GetTodayDeliveriesCountAsync(1)).ReturnsAsync(3);

            var result = await _mockRepo.Object.GetTodayDeliveriesCountAsync(1);

            Assert.Equal(3, result);
        }

        [Theory]
        [InlineData("Pending")]
        [InlineData("Assigned")]
        [InlineData("PickedUp")]
        [InlineData("Delivered")]
        [InlineData("Failed")]
        public async Task UpdateAsync_VariousStatuses_UpdatesCorrectly(string status)
        {
            var delivery = new Delivery { DeliveryId = 1, Status = status };
            _mockRepo.Setup(r => r.UpdateAsync(It.IsAny<Delivery>())).Returns(Task.CompletedTask);

            await _mockRepo.Object.UpdateAsync(delivery);

            _mockRepo.Verify(r => r.UpdateAsync(It.Is<Delivery>(d => d.Status == status)), Times.Once);
        }
    }
}
