namespace FoodDelivery.OrderService.DTOs
{
    public class CustomerDto
    {
        public int CustomerId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
    }

    public class RestaurantDto
    {
        public int RestaurantId { get; set; }
        public string Name { get; set; }
        public string Address { get; set; }
        public string PhoneNumber { get; set; }
        public bool IsActive { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }

    public class CustomerAddressDto
    {
        public int AddressId { get; set; }
        public string Header { get; set; }
        public string Description { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }
}
