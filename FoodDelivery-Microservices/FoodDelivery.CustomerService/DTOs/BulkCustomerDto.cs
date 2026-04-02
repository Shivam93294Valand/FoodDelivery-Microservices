namespace FoodDelivery.CustomerService.DTOs
{
    public class BulkCreateCustomerDto
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string Password { get; set; }
    }

    public class BulkInsertResultDto
    {
        public int TotalInserted { get; set; }
        public List<CustomerListDto> InsertedCustomers { get; set; }
        public string Message { get; set; }
    }
}