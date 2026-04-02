using FoodDelivery.CustomerService.Data;
using FoodDelivery.CustomerService.Models;
using Microsoft.EntityFrameworkCore;

namespace FoodDelivery.CustomerService.Repositories
{
    public interface IAddressRepository
    {
        Task<IEnumerable<CustomerAddress>> GetAddressesByCustomerIdAsync(int customerId);
        Task<CustomerAddress?> GetAddressByIdAsync(int addressId);
        Task<CustomerAddress> AddAddressAsync(CustomerAddress address);
        Task UpdateAddressAsync(CustomerAddress address);
        Task DeleteAddressAsync(int addressId);
        Task<CustomerAddress?> GetDefaultAddressAsync(int customerId);
    }

    public class AddressRepository : IAddressRepository
    {
        private readonly CustomerDbContext _context;

        public AddressRepository(CustomerDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<CustomerAddress>> GetAddressesByCustomerIdAsync(int customerId)
        {
            return await _context.CustomerAddresses
                .Where(a => a.CustomerId == customerId)
                .OrderByDescending(a => a.IsDefault)
                .ToListAsync();
        }

        public async Task<CustomerAddress?> GetAddressByIdAsync(int addressId)
        {
            return await _context.CustomerAddresses.FindAsync(addressId);
        }

        public async Task<CustomerAddress> AddAddressAsync(CustomerAddress address)
        {
            // If this is set as default, unset other defaults for this customer
            if (address.IsDefault)
            {
                var existingDefaults = await _context.CustomerAddresses
                    .Where(a => a.CustomerId == address.CustomerId && a.IsDefault)
                    .ToListAsync();
                
                foreach (var addr in existingDefaults)
                {
                    addr.IsDefault = false;
                }
            }

            _context.CustomerAddresses.Add(address);
            await _context.SaveChangesAsync();
            return address;
        }

        public async Task UpdateAddressAsync(CustomerAddress address)
        {
            // If this is set as default, unset other defaults for this customer
            if (address.IsDefault)
            {
                var existingDefaults = await _context.CustomerAddresses
                    .Where(a => a.CustomerId == address.CustomerId && a.IsDefault && a.AddressId != address.AddressId)
                    .ToListAsync();
                
                foreach (var addr in existingDefaults)
                {
                    addr.IsDefault = false;
                }
            }

            _context.Entry(address).State = EntityState.Modified;
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAddressAsync(int addressId)
        {
            var address = await _context.CustomerAddresses.FindAsync(addressId);
            if (address != null)
            {
                _context.CustomerAddresses.Remove(address);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<CustomerAddress?> GetDefaultAddressAsync(int customerId)
        {
            return await _context.CustomerAddresses
                .FirstOrDefaultAsync(a => a.CustomerId == customerId && a.IsDefault);
        }
    }
}