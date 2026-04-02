using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;
using FoodDelivery.PaymentService.Data;
using FoodDelivery.PaymentService.Models;

namespace FoodDelivery.Payment_UnitTesting.Repositories
{
    public class PaymentDbContextTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly DbContextOptions<PaymentDbContext> _options;

        public PaymentDbContextTests()
        {
            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();

            _options = new DbContextOptionsBuilder<PaymentDbContext>()
                .UseSqlite(_connection)
                .Options;

            using var context = new PaymentDbContext(_options);
            context.Database.EnsureCreated();
        }

        public void Dispose()
        {
            _connection.Close();
        }

        private PaymentDbContext CreateContext() => new PaymentDbContext(_options);

        [Fact]
        public async Task AddPayment_AndRetrieve_Success()
        {
            var payment = new Payment
            {
                OrderId = 10,
                CustomerId = 1,
                Amount = 199.99m,
                PaymentMethod = "UPI",
                Status = "Pending",
                TransactionId = "TXN001",
                PaymentDate = DateTime.UtcNow
            };

            using (var context = CreateContext())
            {
                context.Payments.Add(payment);
                await context.SaveChangesAsync();
            }

            using (var context = CreateContext())
            {
                var retrieved = await context.Payments.FirstOrDefaultAsync(p => p.OrderId == 10);
                Assert.NotNull(retrieved);
                Assert.Equal(199.99m, retrieved.Amount);
                Assert.Equal("UPI", retrieved.PaymentMethod);
                Assert.Equal("Pending", retrieved.Status);
            }
        }

        [Fact]
        public async Task GetAll_ReturnsCorrectCount()
        {
            using (var context = CreateContext())
            {
                context.Payments.AddRange(
                    new Payment { OrderId = 20, CustomerId = 2, Amount = 100m, PaymentMethod = "Cash", Status = "Completed", TransactionId = "TXN020", PaymentDate = DateTime.UtcNow },
                    new Payment { OrderId = 21, CustomerId = 3, Amount = 200m, PaymentMethod = "Card", Status = "Pending", TransactionId = "TXN021", PaymentDate = DateTime.UtcNow }
                );
                await context.SaveChangesAsync();
            }

            using (var context = CreateContext())
            {
                var count = await context.Payments.CountAsync();
                Assert.Equal(2, count);
            }
        }

        [Fact]
        public async Task UpdatePaymentStatus_PersistsChange()
        {
            int id;
            using (var context = CreateContext())
            {
                var payment = new Payment { OrderId = 30, CustomerId = 4, Amount = 300m, PaymentMethod = "Card", Status = "Pending", TransactionId = "TXN030", PaymentDate = DateTime.UtcNow };
                context.Payments.Add(payment);
                await context.SaveChangesAsync();
                id = payment.PaymentId;
            }

            using (var context = CreateContext())
            {
                var payment = await context.Payments.FindAsync(id);
                Assert.NotNull(payment);
                payment.Status = "Completed";
                payment.CompletedAt = DateTime.UtcNow;
                await context.SaveChangesAsync();
            }

            using (var context = CreateContext())
            {
                var payment = await context.Payments.FindAsync(id);
                Assert.Equal("Completed", payment!.Status);
                Assert.NotNull(payment.CompletedAt);
            }
        }

        [Fact]
        public async Task GetPaymentByOrderId_ReturnsCorrectPayment()
        {
            using (var context = CreateContext())
            {
                context.Payments.Add(new Payment { OrderId = 40, CustomerId = 5, Amount = 400m, PaymentMethod = "UPI", Status = "Completed", TransactionId = "TXN040", PaymentDate = DateTime.UtcNow });
                await context.SaveChangesAsync();
            }

            using (var context = CreateContext())
            {
                var payment = await context.Payments.FirstOrDefaultAsync(p => p.OrderId == 40);
                Assert.NotNull(payment);
                Assert.Equal(400m, payment.Amount);
            }
        }

        [Fact]
        public async Task DeletePayment_RemovesFromDatabase()
        {
            int id;
            using (var context = CreateContext())
            {
                var payment = new Payment { OrderId = 50, CustomerId = 6, Amount = 50m, PaymentMethod = "Cash", Status = "Pending", TransactionId = "TXN050", PaymentDate = DateTime.UtcNow };
                context.Payments.Add(payment);
                await context.SaveChangesAsync();
                id = payment.PaymentId;
            }

            using (var context = CreateContext())
            {
                var payment = await context.Payments.FindAsync(id);
                context.Payments.Remove(payment!);
                await context.SaveChangesAsync();
            }

            using (var context = CreateContext())
            {
                var payment = await context.Payments.FindAsync(id);
                Assert.Null(payment);
            }
        }

        [Theory]
        [InlineData("Pending")]
        [InlineData("Completed")]
        [InlineData("Failed")]
        [InlineData("Refunded")]
        public async Task AddPayment_VariousStatuses_PersistsCorrectly(string status)
        {
            using (var context = CreateContext())
            {
                var payment = new Payment
                {
                    OrderId = 60 + status.Length,
                    CustomerId = 7,
                    Amount = 100m,
                    PaymentMethod = "Card",
                    Status = status,
                    TransactionId = "TXN_" + status,
                    PaymentDate = DateTime.UtcNow
                };
                context.Payments.Add(payment);
                await context.SaveChangesAsync();
            }

            using (var context = CreateContext())
            {
                var payment = await context.Payments.FirstOrDefaultAsync(p => p.Status == status);
                Assert.NotNull(payment);
                Assert.Equal(status, payment.Status);
            }
        }

        [Theory]
        [InlineData("Cash")]
        [InlineData("Card")]
        [InlineData("UPI")]
        public async Task AddPayment_VariousPaymentMethods_PersistsCorrectly(string method)
        {
            using (var context = CreateContext())
            {
                var payment = new Payment
                {
                    OrderId = 70 + method.Length,
                    CustomerId = 8,
                    Amount = 150m,
                    PaymentMethod = method,
                    Status = "Pending",
                    TransactionId = "MTXN_" + method,
                    PaymentDate = DateTime.UtcNow
                };
                context.Payments.Add(payment);
                await context.SaveChangesAsync();
            }

            using (var context = CreateContext())
            {
                var payment = await context.Payments.FirstOrDefaultAsync(p => p.PaymentMethod == method);
                Assert.NotNull(payment);
                Assert.Equal(method, payment.PaymentMethod);
            }
        }
    }
}
