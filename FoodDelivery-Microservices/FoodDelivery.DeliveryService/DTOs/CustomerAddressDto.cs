namespace FoodDelivery.DeliveryService.DTOs
{
    public class CustomerAddressDto
    {
        public int AddressId { get; set; }
        public int CustomerId { get; set; }
        public string AddressLine1 { get; set; } = string.Empty;
        public string AddressLine2 { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string ZipCode { get; set; } = string.Empty;
        public string Landmark { get; set; } = string.Empty;
        public string AddressType { get; set; } = string.Empty;
        public bool IsDefault { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string FullAddress { get; set; } = string.Empty;
    }
}
