using FoodDelivery.CustomerService.Models;

namespace FoodDelivery.CustomerService
{
    public interface ICustomerRequestRepository
    {
        Task<Customer> GetRequestByIdAsync(int id);
        Task<Customer> GetByEmailAsync(string email);
        Task<IEnumerable<Customer>> GetAllRequestsAsync();
        Task AddRequestAsync(Customer request);
        Task UpdateRequestAsync(Customer request);
        Task DeleteRequestAsync(int id);
        Task<CustomerAddress> GetAddressByIdAsync(int addressId);
        Task<IEnumerable<Customer>> BulkInsertCustomersAsync(IEnumerable<Customer> customers);
    }
}