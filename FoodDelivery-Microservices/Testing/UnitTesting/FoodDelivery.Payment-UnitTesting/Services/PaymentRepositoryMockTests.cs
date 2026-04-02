using Moq;
using Xunit;
using FoodDelivery.PaymentService.Repositories;
using FoodDelivery.PaymentService.Models;

namespace FoodDelivery.Payment_UnitTesting.Services
{
    public class PaymentRepositoryMockTests
    {
        private readonly Mock<IPaymentRepository> _mockRepo;

        public PaymentRepositoryMockTests()
        {
            _mockRepo = new Mock<IPaymentRepository>();
        }

        [Fact]
        public async Task GetPaymentByIdAsync_ExistingId_ReturnsPayment()
        {
            var payment = new Payment { PaymentId = 1, OrderId = 100, Amount = 250.00m, Status = "Completed" };
            _mockRepo.Setup(r => r.GetPaymentByIdAsync(1)).ReturnsAsync(payment);

            var result = await _mockRepo.Object.GetPaymentByIdAsync(1);

            Assert.NotNull(result);
            Assert.Equal(1, result.PaymentId);
            Assert.Equal("Completed", result.Status);
        }

        [Fact]
        public async Task GetAllAsync_ReturnsAllPayments()
        {
            var payments = new List<Payment>
            {
                new Payment { PaymentId = 1, OrderId = 100, Amount = 150m, Status = "Completed" },
                new Payment { PaymentId = 2, OrderId = 101, Amount = 200m, Status = "Pending" }
            };
            _mockRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(payments);

            var result = await _mockRepo.Object.GetAllAsync();

            Assert.Equal(2, result.Count());
        }

        [Fact]
        public async Task AddPaymentAsync_CallsRepositoryOnce()
        {
            var payment = new Payment { OrderId = 102, Amount = 300m, Status = "Pending" };
            _mockRepo.Setup(r => r.AddPaymentAsync(It.IsAny<Payment>())).Returns(Task.CompletedTask);

            await _mockRepo.Object.AddPaymentAsync(payment);

            _mockRepo.Verify(r => r.AddPaymentAsync(It.IsAny<Payment>()), Times.Once);
        }

        [Fact]
        public async Task UpdatePaymentAsync_CallsRepositoryOnce()
        {
            var payment = new Payment { PaymentId = 1, Status = "Completed" };
            _mockRepo.Setup(r => r.UpdatePaymentAsync(It.IsAny<Payment>())).Returns(Task.CompletedTask);

            await _mockRepo.Object.UpdatePaymentAsync(payment);

            _mockRepo.Verify(r => r.UpdatePaymentAsync(It.Is<Payment>(p => p.Status == "Completed")), Times.Once);
        }

        [Fact]
        public async Task GetPaymentByOrderIdAsync_ExistingOrderId_ReturnsPayment()
        {
            var payment = new Payment { PaymentId = 5, OrderId = 55, Amount = 500m, Status = "Pending" };
            _mockRepo.Setup(r => r.GetPaymentByOrderIdAsync(55)).ReturnsAsync(payment);

            var result = await _mockRepo.Object.GetPaymentByOrderIdAsync(55);

            Assert.NotNull(result);
            Assert.Equal(55, result.OrderId);
        }

        [Fact]
        public async Task GetPaymentByOrderIdAsync_NonExistingOrderId_ReturnsNull()
        {
            _mockRepo.Setup(r => r.GetPaymentByOrderIdAsync(999)).ReturnsAsync((Payment?)null);

            var result = await _mockRepo.Object.GetPaymentByOrderIdAsync(999);

            Assert.Null(result);
        }

        [Theory]
        [InlineData("Pending")]
        [InlineData("Completed")]
        [InlineData("Failed")]
        [InlineData("Refunded")]
        public async Task AddPaymentAsync_VariousStatuses_CallsRepositoryOnce(string status)
        {
            var payment = new Payment { OrderId = 200, Amount = 100m, Status = status };
            _mockRepo.Setup(r => r.AddPaymentAsync(It.IsAny<Payment>())).Returns(Task.CompletedTask);

            await _mockRepo.Object.AddPaymentAsync(payment);

            _mockRepo.Verify(r => r.AddPaymentAsync(It.Is<Payment>(p => p.Status == status)), Times.Once);
        }

        [Theory]
        [InlineData("Cash")]
        [InlineData("Card")]
        [InlineData("UPI")]
        public async Task AddPaymentAsync_VariousPaymentMethods_CallsRepositoryOnce(string method)
        {
            var payment = new Payment { OrderId = 300, Amount = 100m, PaymentMethod = method, Status = "Pending" };
            _mockRepo.Setup(r => r.AddPaymentAsync(It.IsAny<Payment>())).Returns(Task.CompletedTask);

            await _mockRepo.Object.AddPaymentAsync(payment);

            _mockRepo.Verify(r => r.AddPaymentAsync(It.Is<Payment>(p => p.PaymentMethod == method)), Times.Once);
        }

        [Fact]
        public async Task UpdatePaymentAsync_UpdatesAmountCorrectly()
        {
            var payment = new Payment { PaymentId = 3, OrderId = 300, Amount = 999.99m, Status = "Completed" };
            _mockRepo.Setup(r => r.UpdatePaymentAsync(It.IsAny<Payment>())).Returns(Task.CompletedTask);

            await _mockRepo.Object.UpdatePaymentAsync(payment);

            _mockRepo.Verify(r => r.UpdatePaymentAsync(It.Is<Payment>(p => p.Amount == 999.99m)), Times.Once);
        }
    }
}
