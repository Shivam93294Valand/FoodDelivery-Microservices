using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;
using FoodDelivery.DeliveryService.Data;
using FoodDelivery.DeliveryService.Models;

namespace FoodDelivery.Delivery_UnitTesting.Repositories
{
    public class DeliveryDbContextTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly DbContextOptions<DeliveryDbContext> _options;

        public DeliveryDbContextTests()
        {
            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();

            _options = new DbContextOptionsBuilder<DeliveryDbContext>()
                .UseSqlite(_connection)
                .Options;

            using var context = new DeliveryDbContext(_options);
            context.Database.EnsureCreated();
        }

        public void Dispose()
        {
            _connection.Close();
        }

        private DeliveryDbContext CreateContext() => new DeliveryDbContext(_options);

        // -- DeliveryPerson tests --

        [Fact]
        public async Task AddDeliveryPerson_AndRetrieve_Success()
        {
            var person = new DeliveryPerson
            {
                FirstName = "John",
                LastName = "Doe",
                Email = "john@test.com",
                PhoneNumber = "9876543210",
                VehicleType = "Bike",
                VehicleNumber = "GJ01AB1234",
                Password = "hashed",
                IsAvailable = true
            };

            using (var context = CreateContext())
            {
                context.DeliveryPersons.Add(person);
                await context.SaveChangesAsync();
            }

            using (var context = CreateContext())
            {
                var retrieved = await context.DeliveryPersons.FirstOrDefaultAsync(p => p.Email == "john@test.com");
                Assert.NotNull(retrieved);
                Assert.Equal("John", retrieved.FirstName);
                Assert.True(retrieved.IsAvailable);
            }
        }

        [Fact]
        public async Task GetAllDeliveryPersons_ReturnsCorrectCount()
        {
            using (var context = CreateContext())
            {
                context.DeliveryPersons.AddRange(
                    new DeliveryPerson { FirstName = "Alice", Email = "alice@test.com", Password = "pw" },
                    new DeliveryPerson { FirstName = "Bob", Email = "bob@test.com", Password = "pw" }
                );
                await context.SaveChangesAsync();
            }

            using (var context = CreateContext())
            {
                var count = await context.DeliveryPersons.CountAsync();
                Assert.Equal(2, count);
            }
        }

        [Fact]
        public async Task UpdateDeliveryPerson_IsAvailable_PersistsChange()
        {
            int id;
            using (var context = CreateContext())
            {
                var person = new DeliveryPerson { FirstName = "Ravi", Email = "ravi@test.com", Password = "pw", IsAvailable = true };
                context.DeliveryPersons.Add(person);
                await context.SaveChangesAsync();
                id = person.DeliveryPersonId;
            }

            using (var context = CreateContext())
            {
                var person = await context.DeliveryPersons.FindAsync(id);
                Assert.NotNull(person);
                person.IsAvailable = false;
                person.ShiftStatus = ShiftStatus.OffShift;
                await context.SaveChangesAsync();
            }

            using (var context = CreateContext())
            {
                var person = await context.DeliveryPersons.FindAsync(id);
                Assert.False(person!.IsAvailable);
                Assert.Equal(ShiftStatus.OffShift, person.ShiftStatus);
            }
        }

        [Fact]
        public async Task DeleteDeliveryPerson_RemovesFromDatabase()
        {
            int id;
            using (var context = CreateContext())
            {
                var person = new DeliveryPerson { FirstName = "Delete", Email = "del@test.com", Password = "pw" };
                context.DeliveryPersons.Add(person);
                await context.SaveChangesAsync();
                id = person.DeliveryPersonId;
            }

            using (var context = CreateContext())
            {
                var person = await context.DeliveryPersons.FindAsync(id);
                context.DeliveryPersons.Remove(person!);
                await context.SaveChangesAsync();
            }

            using (var context = CreateContext())
            {
                var person = await context.DeliveryPersons.FindAsync(id);
                Assert.Null(person);
            }
        }

        // -- Delivery tests --

        [Fact]
        public async Task AddDelivery_AndRetrieve_Success()
        {
            int personId;
            using (var context = CreateContext())
            {
                var person = new DeliveryPerson { FirstName = "Driver", Email = "driver@test.com", Password = "pw" };
                context.DeliveryPersons.Add(person);
                await context.SaveChangesAsync();
                personId = person.DeliveryPersonId;
            }

            using (var context = CreateContext())
            {
                var delivery = new Delivery
                {
                    OrderId = 100,
                    DeliveryPersonId = personId,
                    CustomerId = 5,
                    Status = "Pending",
                    AssignedAt = DateTime.UtcNow
                };
                context.Deliveries.Add(delivery);
                await context.SaveChangesAsync();
            }

            using (var context = CreateContext())
            {
                var delivery = await context.Deliveries.FirstOrDefaultAsync(d => d.OrderId == 100);
                Assert.NotNull(delivery);
                Assert.Equal("Pending", delivery.Status);
                Assert.Equal(5, delivery.CustomerId);
            }
        }

        [Fact]
        public async Task UpdateDeliveryStatus_PersistsChange()
        {
            int deliveryId;
            int personId;
            using (var context = CreateContext())
            {
                var person = new DeliveryPerson { FirstName = "Driver2", Email = "driver2@test.com", Password = "pw" };
                context.DeliveryPersons.Add(person);
                await context.SaveChangesAsync();
                personId = person.DeliveryPersonId;

                var delivery = new Delivery { OrderId = 200, DeliveryPersonId = personId, CustomerId = 6, Status = "Pending", AssignedAt = DateTime.UtcNow };
                context.Deliveries.Add(delivery);
                await context.SaveChangesAsync();
                deliveryId = delivery.DeliveryId;
            }

            using (var context = CreateContext())
            {
                var delivery = await context.Deliveries.FindAsync(deliveryId);
                Assert.NotNull(delivery);
                delivery.Status = "Delivered";
                delivery.DeliveredAt = DateTime.UtcNow;
                await context.SaveChangesAsync();
            }

            using (var context = CreateContext())
            {
                var delivery = await context.Deliveries.FindAsync(deliveryId);
                Assert.Equal("Delivered", delivery!.Status);
                Assert.NotNull(delivery.DeliveredAt);
            }
        }

        [Fact]
        public async Task GetDeliveriesByPersonId_ReturnsCorrectDeliveries()
        {
            int personId;
            using (var context = CreateContext())
            {
                var person = new DeliveryPerson { FirstName = "Multi", Email = "multi@test.com", Password = "pw" };
                context.DeliveryPersons.Add(person);
                await context.SaveChangesAsync();
                personId = person.DeliveryPersonId;

                context.Deliveries.AddRange(
                    new Delivery { OrderId = 301, DeliveryPersonId = personId, CustomerId = 7, Status = "Delivered", AssignedAt = DateTime.UtcNow },
                    new Delivery { OrderId = 302, DeliveryPersonId = personId, CustomerId = 8, Status = "Delivered", AssignedAt = DateTime.UtcNow }
                );
                await context.SaveChangesAsync();
            }

            using (var context = CreateContext())
            {
                var deliveries = await context.Deliveries
                    .Where(d => d.DeliveryPersonId == personId)
                    .ToListAsync();
                Assert.Equal(2, deliveries.Count);
            }
        }

        [Theory]
        [InlineData("Pending")]
        [InlineData("Assigned")]
        [InlineData("PickedUp")]
        [InlineData("Delivered")]
        [InlineData("Failed")]
        public async Task AddDelivery_VariousStatuses_PersistsCorrectly(string status)
        {
            int personId;
            using (var context = CreateContext())
            {
                var person = new DeliveryPerson { FirstName = "St" + status, Email = $"st{status.ToLower()}@test.com", Password = "pw" };
                context.DeliveryPersons.Add(person);
                await context.SaveChangesAsync();
                personId = person.DeliveryPersonId;
            }

            using (var context = CreateContext())
            {
                var delivery = new Delivery
                {
                    OrderId = 400 + status.Length,
                    DeliveryPersonId = personId,
                    CustomerId = 9,
                    Status = status,
                    AssignedAt = DateTime.UtcNow
                };
                context.Deliveries.Add(delivery);
                await context.SaveChangesAsync();
            }

            using (var context = CreateContext())
            {
                var delivery = await context.Deliveries.FirstOrDefaultAsync(d => d.Status == status && d.DeliveryPersonId == personId);
                Assert.NotNull(delivery);
                Assert.Equal(status, delivery.Status);
            }
        }
    }
}
