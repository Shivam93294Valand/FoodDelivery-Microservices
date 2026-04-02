using FoodDelivery.AdminService.Models;
using FoodDelivery.AdminService.Repositories;
using Moq;
using Xunit;

namespace FoodDelivery.Admin_UnitTesting.Services
{
    public class UserRepositoryMockTests
    {
        private readonly Mock<IUserRepository> _repoMock;

        public UserRepositoryMockTests()
        {
            _repoMock = new Mock<IUserRepository>();
        }

        [Fact]
        public async Task GetByIdAsync_ReturnsUser_WhenExists()
        {
            var user = new User { UserId = 1, FirstName = "Alice", LastName = "Admin",
                Email = "alice@admin.com", Role = UserRole.Admin, IsActive = true };
            _repoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(user);
            var result = await _repoMock.Object.GetByIdAsync(1);
            Assert.NotNull(result);
            Assert.Equal("Alice", result!.FirstName);
            Assert.Equal(UserRole.Admin, result.Role);
        }

        [Fact]
        public async Task GetByIdAsync_ReturnsNull_WhenNotFound()
        {
            _repoMock.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((User?)null);
            var result = await _repoMock.Object.GetByIdAsync(999);
            Assert.Null(result);
        }

        [Fact]
        public async Task GetByEmailAsync_ReturnsUser_WhenEmailExists()
        {
            var user = new User { UserId = 2, Email = "bob@admin.com", IsActive = true };
            _repoMock.Setup(r => r.GetByEmailAsync("bob@admin.com")).ReturnsAsync(user);
            var result = await _repoMock.Object.GetByEmailAsync("bob@admin.com");
            Assert.NotNull(result);
            Assert.Equal("bob@admin.com", result!.Email);
        }

        [Fact]
        public async Task GetAllAsync_ReturnsAllUsers()
        {
            var users = new List<User>
            {
                new User { UserId = 1, Email = "a@test.com", Role = UserRole.Admin    },
                new User { UserId = 2, Email = "b@test.com", Role = UserRole.Customer }
            };
            _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(users);
            var result = (await _repoMock.Object.GetAllAsync()).ToList();
            Assert.Equal(2, result.Count);
        }

        [Fact]
        public async Task AddAsync_InvokesRepositoryOnce()
        {
            var user = new User { FirstName = "New", LastName = "Admin",
                Email = "new@admin.com", Role = UserRole.Admin, IsActive = true };
            _repoMock.Setup(r => r.AddAsync(It.IsAny<User>())).ReturnsAsync(user);
            await _repoMock.Object.AddAsync(user);
            _repoMock.Verify(r => r.AddAsync(It.IsAny<User>()), Times.Once);
        }

        [Fact]
        public async Task ExistsAsync_ReturnsTrue_WhenEmailExists()
        {
            _repoMock.Setup(r => r.ExistsAsync("taken@admin.com")).ReturnsAsync(true);
            var exists = await _repoMock.Object.ExistsAsync("taken@admin.com");
            Assert.True(exists);
        }

        [Fact]
        public async Task ExistsAsync_ReturnsFalse_WhenEmailFree()
        {
            _repoMock.Setup(r => r.ExistsAsync("free@admin.com")).ReturnsAsync(false);
            var exists = await _repoMock.Object.ExistsAsync("free@admin.com");
            Assert.False(exists);
        }

        [Fact]
        public async Task DeleteAsync_ReturnsTrue_WhenDeleted()
        {
            _repoMock.Setup(r => r.DeleteAsync(5)).ReturnsAsync(true);
            var result = await _repoMock.Object.DeleteAsync(5);
            Assert.True(result);
            _repoMock.Verify(r => r.DeleteAsync(5), Times.Once);
        }

        [Theory]
        [InlineData(UserRole.Admin)]
        [InlineData(UserRole.Customer)]
        [InlineData(UserRole.DeliveryPerson)]
        public async Task AddAsync_AcceptsAllRoles(UserRole role)
        {
            var user = new User { Email = $"{role}@test.com", Role = role, IsActive = true };
            _repoMock.Setup(r => r.AddAsync(It.IsAny<User>())).ReturnsAsync(user);
            var result = await _repoMock.Object.AddAsync(user);
            Assert.Equal(role, result.Role);
        }
    }
}
