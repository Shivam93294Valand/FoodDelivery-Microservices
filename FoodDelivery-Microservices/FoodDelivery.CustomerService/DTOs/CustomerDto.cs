namespace FoodDelivery.CustomerService.DTOs
{
    // Response DTOs
    public class CustomerListDto
    {
        public int CustomerId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string FullName => $"{FirstName} {LastName}";
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public bool IsActive { get; set; }
    }

    public class CustomerDetailDto
    {
        public int CustomerId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string FullName => $"{FirstName} {LastName}";
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsActive { get; set; }
        public IEnumerable<CustomerAddressDto> Addresses { get; set; }
    }

    public class CustomerDto
    {
        public int CustomerId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string FullName => $"{FirstName} {LastName}";
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
    }

    public class CreateCustomerDto
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string Password { get; set; }
        // Ensure Addresses is initialized so missing field does not cause MVC model validation to fail
        public List<CreateCustomerAddressDto> Addresses { get; set; } = new List<CreateCustomerAddressDto>();
    }

    public class UpdateCustomerDto
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
    }

    public class CustomerAddressDto
    {
        public int AddressId { get; set; }
        public int CustomerId { get; set; }
        public string AddressLine1 { get; set; }
        public string AddressLine2 { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string ZipCode { get; set; }
        public string Landmark { get; set; }
        public string AddressType { get; set; }
        public bool IsDefault { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string FullAddress => $"{AddressLine1}, {(!string.IsNullOrEmpty(AddressLine2) ? AddressLine2 + ", " : "")}{City}, {State} {ZipCode}";
    }

    public class CustomerAddressListDto
    {
        public int AddressId { get; set; }
        public string AddressLine1 { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string AddressType { get; set; }
        public bool IsDefault { get; set; }
        public string ShortAddress => $"{AddressLine1}, {City}, {State}";
    }

    public class CreateCustomerAddressDto
    {
        public string AddressLine1 { get; set; }
        public string AddressLine2 { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string ZipCode { get; set; }
        public string Landmark { get; set; }
        public string AddressType { get; set; }
        public bool IsDefault { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }

    public class UpdateCustomerAddressDto
    {
        public string AddressLine1 { get; set; }
        public string AddressLine2 { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string ZipCode { get; set; }
        public string Landmark { get; set; }
        public string AddressType { get; set; }
        public bool IsDefault { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }

    // Authentication DTOs
    public class RegisterDto
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string Password { get; set; }
    }

    public class LoginDto
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class AuthResponseDto
    {
        public string Token { get; set; }
        public CustomerDto Customer { get; set; }
    }
}