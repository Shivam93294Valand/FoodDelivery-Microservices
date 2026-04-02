using FoodDelivery.CustomerService.Data;
using FoodDelivery.CustomerService.DTOs;
using FoodDelivery.CustomerService.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FoodDelivery.CustomerService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CustomerAddressController : ControllerBase
    {
        private readonly ICustomerRequestRepository _customerRequestRepository;
        private readonly CustomerDbContext _context;

        public CustomerAddressController(ICustomerRequestRepository customerRequestRepository, CustomerDbContext context)
        {
            _customerRequestRepository = customerRequestRepository;
            _context = context;
        }

        // GET: api/CustomerAddress/5
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<CustomerAddressDto>> GetCustomerAddress(int id)
        {
            var address = await _customerRequestRepository.GetAddressByIdAsync(id);

            if (address == null)
            {
                return NotFound();
            }

            var addressDto = new CustomerAddressDto
            {
                AddressId = address.AddressId,
                CustomerId = address.CustomerId,
                AddressLine1 = address.AddressLine1,
                AddressLine2 = address.AddressLine2,
                City = address.City,
                State = address.State,
                ZipCode = address.ZipCode,
                Landmark = address.Landmark,
                AddressType = address.AddressType,
                IsDefault = address.IsDefault,
                Latitude = address.Latitude,
                Longitude = address.Longitude
            };

            return Ok(addressDto);
        }

        // GET: api/CustomerAddress/Customer/5
        [HttpGet("Customer/{customerId}")]
        public async Task<ActionResult<IEnumerable<CustomerAddressDto>>> GetCustomerAddresses(int customerId)
        {
            var addresses = await _context.CustomerAddresses
                .Where(a => a.CustomerId == customerId)
                .ToListAsync();

            return addresses.Select(address => new CustomerAddressDto
            {
                AddressId = address.AddressId,
                CustomerId = address.CustomerId,
                AddressLine1 = address.AddressLine1,
                AddressLine2 = address.AddressLine2,
                City = address.City,
                State = address.State,
                ZipCode = address.ZipCode,
                Landmark = address.Landmark,
                AddressType = address.AddressType,
                IsDefault = address.IsDefault,
                Latitude = address.Latitude,
                Longitude = address.Longitude
            }).ToList();
        }

        // POST: api/CustomerAddress
        [HttpPost]
        public async Task<ActionResult<CustomerAddressDto>> CreateAddress([FromBody] CustomerAddressDto addressDto)
        {
            var address = new CustomerAddress
            {
                CustomerId = addressDto.CustomerId,
                AddressLine1 = addressDto.AddressLine1,
                AddressLine2 = addressDto.AddressLine2,
                City = addressDto.City,
                State = addressDto.State,
                ZipCode = addressDto.ZipCode,
                Landmark = addressDto.Landmark,
                AddressType = addressDto.AddressType,
                IsDefault = addressDto.IsDefault,
                Latitude = addressDto.Latitude,
                Longitude = addressDto.Longitude
            };

            // If this is set as default, unset other default addresses
            if (address.IsDefault)
            {
                var existingAddresses = await _context.CustomerAddresses
                    .Where(a => a.CustomerId == address.CustomerId && a.IsDefault)
                    .ToListAsync();

                foreach (var existing in existingAddresses)
                {
                    existing.IsDefault = false;
                }
            }

            _context.CustomerAddresses.Add(address);
            await _context.SaveChangesAsync();

            addressDto.AddressId = address.AddressId;
            return CreatedAtAction(nameof(GetCustomerAddress), new { id = address.AddressId }, addressDto);
        }

        // PUT: api/CustomerAddress/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAddress(int id, [FromBody] CustomerAddressDto addressDto)
        {
            if (id != addressDto.AddressId)
            {
                return BadRequest();
            }

            var address = await _context.CustomerAddresses.FindAsync(id);
            if (address == null)
            {
                return NotFound();
            }

            address.AddressLine1 = addressDto.AddressLine1;
            address.AddressLine2 = addressDto.AddressLine2;
            address.City = addressDto.City;
            address.State = addressDto.State;
            address.ZipCode = addressDto.ZipCode;
            address.Landmark = addressDto.Landmark;
            address.AddressType = addressDto.AddressType;
            address.IsDefault = addressDto.IsDefault;
            address.Latitude = addressDto.Latitude;
            address.Longitude = addressDto.Longitude;

            // If this is set as default, unset other default addresses
            if (address.IsDefault)
            {
                var existingAddresses = await _context.CustomerAddresses
                    .Where(a => a.CustomerId == address.CustomerId && a.AddressId != id && a.IsDefault)
                    .ToListAsync();

                foreach (var existing in existingAddresses)
                {
                    existing.IsDefault = false;
                }
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/CustomerAddress/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAddress(int id)
        {
            var address = await _context.CustomerAddresses.FindAsync(id);
            if (address == null)
            {
                return NotFound();
            }

            _context.CustomerAddresses.Remove(address);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
