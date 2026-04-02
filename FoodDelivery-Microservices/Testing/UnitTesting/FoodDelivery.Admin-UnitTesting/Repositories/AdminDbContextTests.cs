using FoodDelivery.AdminService.Data;
using FoodDelivery.AdminService.Models;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace FoodDelivery.Admin_UnitTesting.Repositories
{
    public class AdminDbContextTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly AdminDbContext _context;

        public AdminDbContextTests()
        {
            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();

            var options = new DbContextOptionsBuilder<AdminDbContext>()
                .UseSqlite(_connection)
                .Options;

            _context = new AdminDbContext(options);
            _context.Database.EnsureCreated();
        }

        public void Dispose()
        {
            _context.Dispose();
            _connection.Dispose();
        }

        // ── User CRUD ─────────────────────────────────────────────────────────

        [Fact]
        public async Task AddUser_CanBeRetrievedById()
        {
            var user = new User
            {
                FirstName = "Admin", LastName = "User",
                Email = "admin@test.com", PasswordHash = "hashed",
                Role = UserRole.Admin, IsActive = true, CreatedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var retrieved = await _context.Users.FindAsync(user.UserId);
            Assert.NotNull(retrieved);
            Assert.Equal("Admin", retrieved!.FirstName);
            Assert.Equal(UserRole.Admin, retrieved.Role);
        }

        [Fact]
        public async Task GetAllUsers_ReturnsCorrectCount()
        {
            _context.Users.AddRange(
                new User { FirstName = "A", LastName = "X", Email = "ax@test.com", PasswordHash = "h1", Role = UserRole.Admin,    IsActive = true, CreatedAt = DateTime.UtcNow },
                new User { FirstName = "B", LastName = "Y", Email = "by@test.com", PasswordHash = "h2", Role = UserRole.Customer, IsActive = true, CreatedAt = DateTime.UtcNow }
            );
            await _context.SaveChangesAsync();
            var all = await _context.Users.ToListAsync();
            Assert.True(all.Count >= 2);
        }

        [Fact]
        public async Task FindUserByEmail_ReturnsCorrectUser()
        {
            var user = new User
            {
                FirstName = "Eve", LastName = "Email",
                Email = "eve@uniquedomain.com", PasswordHash = "hash",
                Role = UserRole.Customer, IsActive = true, CreatedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            var found = await _context.Users.FirstOrDefaultAsync(u => u.Email == "eve@uniquedomain.com");
            Assert.NotNull(found);
            Assert.Equal("Eve", found!.FirstName);
        }

        [Fact]
        public async Task UpdateUser_PersistsRoleChange()
        {
            var user = new User
            {
                FirstName = "Bob", LastName = "Role",
                Email = "bob@roletest.com", PasswordHash = "hash",
                Role = UserRole.Customer, IsActive = true, CreatedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Act – promote to Admin
            user.Role = UserRole.Admin;
            user.UpdatedAt = DateTime.UtcNow;
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            var updated = await _context.Users.FindAsync(user.UserId);
            Assert.Equal(UserRole.Admin, updated!.Role);
        }

        [Fact]
        public async Task DeactivateUser_PersistsIsActiveChange()
        {
            var user = new User
            {
                FirstName = "Carol", LastName = "Active",
                Email = "carol@active.com", PasswordHash = "hash",
                Role = UserRole.Customer, IsActive = true, CreatedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            user.IsActive = false;
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            var updated = await _context.Users.FindAsync(user.UserId);
            Assert.False(updated!.IsActive);
        }

        [Fact]
        public async Task DeleteUser_RemovesFromDatabase()
        {
            var user = new User
            {
                FirstName = "Delete", LastName = "Me",
                Email = "deleteme@test.com", PasswordHash = "hash",
                Role = UserRole.Customer, IsActive = true, CreatedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            var userId = user.UserId;
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            var deleted = await _context.Users.FindAsync(userId);
            Assert.Null(deleted);
        }
    }
}
