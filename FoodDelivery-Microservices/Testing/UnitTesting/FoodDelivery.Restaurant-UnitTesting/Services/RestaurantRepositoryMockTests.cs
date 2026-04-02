using FoodDelivery.RestaurantService.Models;
using FoodDelivery.RestaurantService.Repositories;
using Moq;
using Xunit;

namespace FoodDelivery.Restaurant_UnitTesting.Services
{
    public class RestaurantRepositoryMockTests
    {
        private readonly Mock<IRestaurantRequestRepository> _repoMock;

        public RestaurantRepositoryMockTests()
        {
            _repoMock = new Mock<IRestaurantRequestRepository>();
        }

        [Fact]
        public async Task GetIdAsync_ReturnsRestaurant_WhenExists()
        {
            var restaurant = new Restaurant
            {
                RestaurantId = 1, Name = "Test Kitchen", IsActive = true,
                Cuisine = "Italian", Rating = 4.5m
            };
            _repoMock.Setup(r => r.GetIdAsync(1)).ReturnsAsync(restaurant);

            var result = await _repoMock.Object.GetIdAsync(1);

            Assert.NotNull(result);
            Assert.Equal("Test Kitchen", result!.Name);
        }

        [Fact]
        public async Task GetIdAsync_ReturnsNull_WhenNotExists()
        {
            _repoMock.Setup(r => r.GetIdAsync(999)).ReturnsAsync((Restaurant?)null);

            var result = await _repoMock.Object.GetIdAsync(999);

            Assert.Null(result);
        }

        [Fact]
        public async Task GetAllAsync_ReturnsAllRestaurants()
        {
            var restaurants = new List<Restaurant>
            {
                new Restaurant { RestaurantId = 1, Name = "Pizza Palace",    IsActive = true },
                new Restaurant { RestaurantId = 2, Name = "Burger Barn",     IsActive = true },
                new Restaurant { RestaurantId = 3, Name = "Sushi World",     IsActive = false }
            };
            _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(restaurants);

            var result = (await _repoMock.Object.GetAllAsync()).ToList();

            Assert.Equal(3, result.Count);
        }

        [Fact]
        public async Task AddAsync_CallsRepositoryOnceAndReturnsEntity()
        {
            var restaurant = new Restaurant
            {
                Name = "New Spot", IsActive = true, Cuisine = "Indian",
                Rating = 0m, CreatedAt = DateTime.UtcNow
            };
            _repoMock.Setup(r => r.AddAsync(It.IsAny<Restaurant>()))
                     .ReturnsAsync(restaurant);

            var result = await _repoMock.Object.AddAsync(restaurant);

            _repoMock.Verify(r => r.AddAsync(It.IsAny<Restaurant>()), Times.Once);
            Assert.Equal("New Spot", result.Name);
        }

        [Fact]
        public async Task UpdateAsync_IsCalledWithCorrectData()
        {
            var existing = new Restaurant { RestaurantId = 5, Name = "Old Name", IsActive = true };
            existing.Name = "Updated Name";
            _repoMock.Setup(r => r.UpdateAsync(It.IsAny<Restaurant>())).ReturnsAsync(existing);

            var result = await _repoMock.Object.UpdateAsync(existing);

            _repoMock.Verify(r => r.UpdateAsync(It.Is<Restaurant>(x => x.Name == "Updated Name")), Times.Once);
            Assert.Equal("Updated Name", result.Name);
        }

        [Fact]
        public async Task DeleteAsync_CallsRepositoryOnce()
        {
            var restaurant = new Restaurant { RestaurantId = 7, Name = "To Delete" };
            _repoMock.Setup(r => r.DeleteAsync(7)).ReturnsAsync(restaurant);

            await _repoMock.Object.DeleteAsync(7);

            _repoMock.Verify(r => r.DeleteAsync(7), Times.Once);
        }
    }
}
