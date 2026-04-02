using FoodDelivery.CustomerService.DTOs;
using Xunit;

namespace FoodDelivery.Customer_UnitTesting
{
    public class Customer_UnitTest
    {
        [Fact]
        public void CustomerDto_FullName_ReturnsConcatenated()
        {
            var dto = new CustomerDto { FirstName = "John", LastName = "Doe" };
            var full = dto.FullName;
            Assert.Equal("John Doe", full);
        }

        [Fact]
        public void CustomerAddressDto_FullAddress_IncludesAddress2_WhenPresent()
        {
            var addr = new CustomerAddressDto
            {
                AddressLine1 = "123 Main St",
                AddressLine2 = "Apt 4B",
                City = "Metropolis",
                State = "NY",
                ZipCode = "10001"
            };
            var result = addr.FullAddress;
            Assert.Equal("123 Main St, Apt 4B, Metropolis, NY 10001", result);
        }

        [Fact]
        public void CreateCustomerDto_Addresses_IsInitialized_NotNull()
        {
            // Arrange & Act
            var create = new CreateCustomerDto();
            Assert.NotNull(create.Addresses);
        }

        [Fact]
        public void CreateCustomerDto_Addresses_IsInitialized_Empty()
        {
            // Arrange & Act
            var create = new CreateCustomerDto();
            Assert.Empty(create.Addresses);
        }

        [Fact]
        public void CustomerAddressListDto_ShortAddress_FormatsCorrectly()
        {
            var list = new CustomerAddressListDto
            {
                AddressLine1 = "500 Market",
                City = "Gotham",
                State = "CA"
            };
            var shortAddr = list.ShortAddress;
            Assert.Equal("500 Market, Gotham, CA", shortAddr);
        }
    }
}