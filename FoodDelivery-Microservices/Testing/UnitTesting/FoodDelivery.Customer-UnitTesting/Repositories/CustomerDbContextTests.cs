using FoodDelivery.CustomerService.Data;
using FoodDelivery.CustomerService.Models;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace FoodDelivery.Customer_UnitTesting.Repositories
{
    /// <summary>
    /// Tests the CustomerDbContext (EF Core layer) using an in-memory SQLite database.
    /// These verify that schema, relationships, and constraints are correct.
    /// </summary>
    public class CustomerDbContextTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly CustomerDbContext _context;

        public CustomerDbContextTests()
        {
            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();

            var options = new DbContextOptionsBuilder<CustomerDbContext>()
                .UseSqlite(_connection)
                .Options;

            _context = new CustomerDbContext(options);
            _context.Database.EnsureCreated();
        }

        public void Dispose()
        {
            _context.Dispose();
            _connection.Dispose();
        }

        // ── Add / Read ────────────────────────────────────────────────────────

        [Fact]
        public async Task AddCustomer_CanBeRetrievedById()
        {
            var customer = new Customer
            {
                FirstName = "Alice",
                LastName  = "Wonderland",
                Email     = "alice@example.com",
                PhoneNumber = "1111111111",
                Password  = "hashed",
                CreatedAt = DateTime.UtcNow,
                IsActive  = true
            };
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            var retrieved = await _context.Customers.FindAsync(customer.CustomerId);
            Assert.NotNull(retrieved);
            Assert.Equal("Alice", retrieved.FirstName);
            Assert.Equal("alice@example.com", retrieved.Email);
        }

        [Fact]
        public async Task GetAllCustomers_ReturnsCorrectCount()
        {
            _context.Customers.AddRange(
                new Customer { FirstName = "Bob",   LastName = "Brown",  Email = "bob@example.com",   Password = "hash1", CreatedAt = DateTime.UtcNow, IsActive = true },
                new Customer { FirstName = "Carol", LastName = "Clarke", Email = "carol@example.com", Password = "hash2", CreatedAt = DateTime.UtcNow, IsActive = true }
            );
            await _context.SaveChangesAsync();
            var all = await _context.Customers.ToListAsync();
            Assert.True(all.Count >= 2);
        }

        [Fact]
        public async Task AddCustomerWithAddress_CascadeLoadsAddresses()
        {
            var customer = new Customer
            {
                FirstName = "Dave", LastName = "Doe",
                Email = "dave@example.com", Password = "hash",
                CreatedAt = DateTime.UtcNow, IsActive = true,
                Addresses = new List<CustomerAddress>
                {
                    new CustomerAddress
                    {
                        AddressLine1 = "10 Test Rd",
                        City = "TestCity", State = "TS",
                        ZipCode = "99999", AddressType = "Home",
                        IsDefault = true
                    }
                }
            };
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            var loaded = await _context.Customers
                .Include(c => c.Addresses)
                .FirstOrDefaultAsync(c => c.Email == "dave@example.com");
            Assert.NotNull(loaded);
            Assert.Single(loaded!.Addresses);
            Assert.Equal("10 Test Rd", loaded.Addresses.First().AddressLine1);
        }

        [Fact]
        public async Task UpdateCustomer_PersistsChanges()
        {
            var customer = new Customer
            {
                FirstName = "Eve", LastName = "Ellis",
                Email = "eve@example.com", Password = "hash",
                CreatedAt = DateTime.UtcNow, IsActive = true
            };
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();
            customer.PhoneNumber = "5555555555";
            _context.Customers.Update(customer);
            await _context.SaveChangesAsync();

            var updated = await _context.Customers.FindAsync(customer.CustomerId);
            Assert.Equal("5555555555", updated!.PhoneNumber);
        }

        [Fact]
        public async Task DeleteCustomer_RemovesEntityAndCascadesAddresses()
        {
            var customer = new Customer
            {
                FirstName = "Frank", LastName = "Ford",
                Email = "frank@example.com", Password = "hash",
                CreatedAt = DateTime.UtcNow, IsActive = true,
                Addresses = new List<CustomerAddress>
                {
                    new CustomerAddress
                    {
                        AddressLine1 = "99 Delete St", City = "Gone",
                        State = "GN", ZipCode = "00000", AddressType = "Work"
                    }
                }
            };
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();
            _context.Customers.Remove(customer);
            await _context.SaveChangesAsync();

            var deleted = await _context.Customers.FindAsync(customer.CustomerId);
            var addresses = await _context.CustomerAddresses
                .Where(a => a.CustomerId == customer.CustomerId)
                .ToListAsync();
            Assert.Null(deleted);
            Assert.Empty(addresses); // cascade delete
        }

        [Fact]
        public async Task FindCustomerByEmail_ReturnsCorrectCustomer()
        {
            var customer = new Customer
            {
                FirstName = "Grace", LastName = "Green",
                Email = "grace@example.com", Password = "hash",
                CreatedAt = DateTime.UtcNow, IsActive = true
            };
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();
            var found = await _context.Customers
                .FirstOrDefaultAsync(c => c.Email == "grace@example.com");
            Assert.NotNull(found);
            Assert.Equal("Grace", found!.FirstName);
        }
    }
}
