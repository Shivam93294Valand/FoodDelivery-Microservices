using FoodDelivery.CustomerService;
using FoodDelivery.CustomerService.Models;
using FoodDelivery.CustomerService.Repositories;

namespace FoodDelivery.Customer_IntegrationTesting.Helpers
{
    public class InMemoryCustomerRepository : ICustomerRequestRepository
    {
        private readonly List<Customer> _customers = new();
        private int _nextCustomerId = 1;
        private int _nextAddressId  = 100;

        public Task<Customer> GetRequestByIdAsync(int id)
        {
            var customer = _customers.FirstOrDefault(c => c.CustomerId == id)
                           ?? throw new InvalidOperationException($"Customer with id {id} not found.");
            return Task.FromResult(customer);
        }

        public Task<Customer> GetByEmailAsync(string email)
        {
            var customer = _customers
                .FirstOrDefault(c => c.Email.Equals(email.Trim().ToLower(), StringComparison.OrdinalIgnoreCase));
            return Task.FromResult(customer!);
        }

        public Task<IEnumerable<Customer>> GetAllRequestsAsync()
            => Task.FromResult(_customers.AsEnumerable());

        public Task AddRequestAsync(Customer request)
        {
            request.CustomerId = _nextCustomerId++;
            foreach (var addr in request.Addresses)
                addr.AddressId = _nextAddressId++;
            _customers.Add(request);
            return Task.CompletedTask;
        }

        public Task UpdateRequestAsync(Customer request)
        {
            var idx = _customers.FindIndex(c => c.CustomerId == request.CustomerId);
            if (idx >= 0) _customers[idx] = request;
            return Task.CompletedTask;
        }

        public Task DeleteRequestAsync(int id)
        {
            _customers.RemoveAll(c => c.CustomerId == id);
            return Task.CompletedTask;
        }

        public Task<CustomerAddress> GetAddressByIdAsync(int addressId)
        {
            var addr = _customers
                .SelectMany(c => c.Addresses)
                .FirstOrDefault(a => a.AddressId == addressId);
            return Task.FromResult(addr!);
        }

        public Task<IEnumerable<Customer>> BulkInsertCustomersAsync(IEnumerable<Customer> customers)
        {
            var list = customers.ToList();
            foreach (var c in list)
            {
                c.CustomerId = _nextCustomerId++;
                _customers.Add(c);
            }
            return Task.FromResult(list.AsEnumerable());
        }

        /// <summary>Seeds the repository with a customer for test setup.</summary>
        public InMemoryCustomerRepository WithCustomer(Customer customer)
        {
            customer.CustomerId = _nextCustomerId++;
            _customers.Add(customer);
            return this;
        }
    }
}
