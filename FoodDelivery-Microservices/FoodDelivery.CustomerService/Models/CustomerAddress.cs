namespace FoodDelivery.CustomerService.Models
{
    public class CustomerAddress
    {
        public int AddressId { get; set; }
        public int CustomerId { get; set; }
        public string AddressLine1 { get; set; }
        public string AddressLine2 { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string ZipCode { get; set; }
        public string Landmark { get; set; }
        public string AddressType { get; set; } // "Home", "Work", "Other"
        public bool IsDefault { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }

        public Customer Customer { get; set; }
    }
}