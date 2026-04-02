namespace FoodDelivery.CustomerService.Models
{
    public class Customer
    {
        public int CustomerId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string Password { get; set; } 
        public DateTime CreatedAt { get; set; }
        public bool IsActive { get; set; }

        public ICollection<CustomerAddress> Addresses { get; set; } = new List<CustomerAddress>();
    }
}