using FoodDelivery.CustomerService.DTOs;
using FoodDelivery.CustomerService.Models;
using FoodDelivery.CustomerService.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace FoodDelivery.CustomerService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CustomerController : ControllerBase
    {
        private readonly ICustomerRequestRepository _customerRequestRepository;
        private readonly ICustomerRelatedDetailsService _relatedDetailsService;
        private readonly IFileParserService _fileParserService;

        public CustomerController(
            ICustomerRequestRepository customerRequestRepository,
            ICustomerRelatedDetailsService relatedDetailsService,
            IFileParserService fileParserService)
        {
            _customerRequestRepository = customerRequestRepository;
            _relatedDetailsService = relatedDetailsService;
            _fileParserService = fileParserService; 
        }

        // GET: api/Customer/{id}/relatedDetails
        [HttpGet("{id}/relatedDetails")]
        public async Task<ActionResult<CustomerRelatedDetailsDto>> GetCustomerRelatedDetails(int id)
        {
            var relatedDetails = await _relatedDetailsService.GetCustomerRelatedDetailsAsync(id);

            if (relatedDetails == null)
            {
                return NotFound($"Customer with ID {id} not found.");
            }

            return Ok(relatedDetails);
        }

        // GET: api/Customer
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CustomerListDto>>> GetCustomers()
        {
            var customers = await _customerRequestRepository.GetAllRequestsAsync();

            var customerDtos = customers.Select(c => new CustomerListDto
            {
                CustomerId = c.CustomerId,
                FirstName = c.FirstName,
                LastName = c.LastName,
                Email = c.Email,
                PhoneNumber = c.PhoneNumber,
                IsActive = c.IsActive
            }).ToList();

            return Ok(customerDtos);
        }

        // GET: api/Customer/5
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<CustomerDetailDto>> GetCustomer(int id)
        {
            var customer = await _customerRequestRepository.GetRequestByIdAsync(id);

            if (customer == null)
            {
                return NotFound();
            }

            var customerDto = new CustomerDetailDto
            {
                CustomerId = customer.CustomerId,
                FirstName = customer.FirstName,
                LastName = customer.LastName,
                Email = customer.Email,
                PhoneNumber = customer.PhoneNumber,
                CreatedAt = customer.CreatedAt,
                IsActive = customer.IsActive,
                Addresses = customer.Addresses.Select(a => new CustomerAddressDto
                {
                    AddressId = a.AddressId,
                    CustomerId = a.CustomerId,
                    AddressLine1 = a.AddressLine1,
                    AddressLine2 = a.AddressLine2,
                    City = a.City,
                    State = a.State,
                    ZipCode = a.ZipCode,
                    Landmark = a.Landmark,
                    AddressType = a.AddressType,
                    IsDefault = a.IsDefault,
                    Latitude = a.Latitude,
                    Longitude = a.Longitude
                })
            };

            return customerDto;
        }

        // POST: api/Customer
        [HttpPost]
        public async Task<ActionResult<CustomerDetailDto>> CreateCustomer(CreateCustomerDto createDto)
        {
            var customer = new Customer
            {
                FirstName = createDto.FirstName,
                LastName = createDto.LastName,
                Email = createDto.Email,
                PhoneNumber = createDto.PhoneNumber,
                Password = createDto.Password,
                CreatedAt = DateTime.UtcNow,
                IsActive = true,
                Addresses = createDto.Addresses?.Select(a => new CustomerAddress
                {
                    AddressLine1 = a.AddressLine1,
                    AddressLine2 = a.AddressLine2,
                    City = a.City,
                    State = a.State,
                    ZipCode = a.ZipCode,
                    Landmark = a.Landmark,
                    AddressType = a.AddressType,
                    IsDefault = a.IsDefault,
                    Latitude = a.Latitude,
                    Longitude = a.Longitude
                }).ToList() ?? new List<CustomerAddress>()
            };

            await _customerRequestRepository.AddRequestAsync(customer);

            var customerDto = new CustomerDetailDto
            {
                CustomerId = customer.CustomerId,
                FirstName = customer.FirstName,
                LastName = customer.LastName,
                Email = customer.Email,
                PhoneNumber = customer.PhoneNumber,
                CreatedAt = customer.CreatedAt,
                IsActive = customer.IsActive,
                Addresses = customer.Addresses.Select(a => new CustomerAddressDto
                {
                    AddressId = a.AddressId,
                    CustomerId = a.CustomerId,
                    AddressLine1 = a.AddressLine1,
                    AddressLine2 = a.AddressLine2,
                    City = a.City,
                    State = a.State,
                    ZipCode = a.ZipCode,
                    Landmark = a.Landmark,
                    AddressType = a.AddressType,
                    IsDefault = a.IsDefault,
                    Latitude = a.Latitude,
                    Longitude = a.Longitude
                })
            };

            return CreatedAtAction(nameof(GetCustomer), new { id = customer.CustomerId }, customerDto);
        }

        // PUT: api/Customer/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCustomer(int id, UpdateCustomerDto updateDto)
        {
            var customer = await _customerRequestRepository.GetRequestByIdAsync(id);
            if (customer == null)
            {
                return NotFound();
            }

            customer.FirstName = updateDto.FirstName;
            customer.LastName = updateDto.LastName;
            customer.Email = updateDto.Email;
            customer.PhoneNumber = updateDto.PhoneNumber;

            try
            {
                await _customerRequestRepository.UpdateRequestAsync(customer);
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CustomerExists(id))
                {
                    return NotFound();
                }
                throw;
            }

            return NoContent();
        }

        // GET: api/Customer/5/Addresses
        [HttpGet("{id}/Addresses")]
        public async Task<ActionResult<IEnumerable<CustomerAddressListDto>>> GetCustomerAddresses(int id)
        {
            var customer = await _customerRequestRepository.GetRequestByIdAsync(id);
            if (customer == null)
            {
                return NotFound();
            }

            var addresses = customer.Addresses.Select(a => new CustomerAddressListDto
            {
                AddressId = a.AddressId,
                AddressLine1 = a.AddressLine1,
                City = a.City,
                State = a.State,
                AddressType = a.AddressType,
                IsDefault = a.IsDefault
            });

            return Ok(addresses);
        }

        // POST: api/Customer/bulk
        [HttpPost("bulk")]
        public async Task<ActionResult<BulkInsertResultDto>> BulkCreateCustomers(
            [FromBody] List<BulkCreateCustomerDto> bulkCustomerDtos)
        {
            if (bulkCustomerDtos == null || !bulkCustomerDtos.Any())
            {
                return BadRequest("Customer list cannot be empty.");
            }

            try
            {
                // Map DTOs to Customer entities
                var customers = bulkCustomerDtos.Select(dto => new Customer
                {
                    FirstName = dto.FirstName,
                    LastName = dto.LastName,
                    Email = dto.Email,
                    PhoneNumber = dto.PhoneNumber,
                    Password = dto.Password,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                }).ToList();

                // Bulk insert using Stored Procedure + TVP with Dapper
                var insertedCustomers = await _customerRequestRepository.BulkInsertCustomersAsync(customers);

                var result = new BulkInsertResultDto
                {
                    TotalInserted = insertedCustomers.Count(),
                    InsertedCustomers = insertedCustomers.Select(c => new CustomerListDto
                    {
                        CustomerId = c.CustomerId,
                        FirstName = c.FirstName,
                        LastName = c.LastName,
                        Email = c.Email,
                        PhoneNumber = c.PhoneNumber,
                        IsActive = c.IsActive
                    }).ToList(),
                    Message = $"Successfully inserted {insertedCustomers.Count()} customers using SP + TVP."
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost("bulk/upload")]
        public async Task<ActionResult<BulkInsertResultDto>> BulkUploadCustomers(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("Please upload a valid file.");
            }

            var allowedExtensions = new[] { ".xlsx", ".xls", ".csv" };
            var fileExtension = Path.GetExtension(file.FileName).ToLower();

            if (!allowedExtensions.Contains(fileExtension))
            {
                return BadRequest("Only Excel (.xlsx, .xls) and CSV (.csv) files are supported.");
            }
            try
            {
                List<BulkCreateCustomerDto> bulkCustomerDtos;

                using (var stream = file.OpenReadStream())
                {
                    bulkCustomerDtos = await _fileParserService.ParseCustomerFileAsync(stream, fileExtension);
                }

                if (!bulkCustomerDtos.Any())
                {
                    return BadRequest("No valid customer data found in the uploaded file.");
                }

                // Map DTOs to Customer entities
                var customers = bulkCustomerDtos.Select(dto => new Customer
                {
                    FirstName = dto.FirstName,
                    LastName = dto.LastName,
                    Email = dto.Email,
                    PhoneNumber = dto.PhoneNumber,
                    Password = dto.Password,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                }).ToList();

                // Bulk insert using Stored Procedure + TVP with Dapper
                var insertedCustomers = await _customerRequestRepository.BulkInsertCustomersAsync(customers);

                var result = new BulkInsertResultDto
                {
                    TotalInserted = insertedCustomers.Count(),
                    InsertedCustomers = insertedCustomers.Select(c => new CustomerListDto
                    {
                        CustomerId = c.CustomerId,
                        FirstName = c.FirstName,
                        LastName = c.LastName,
                        Email = c.Email,
                        PhoneNumber = c.PhoneNumber,
                        IsActive = c.IsActive
                    }).ToList(),
                    Message = $"Successfully uploaded and inserted {insertedCustomers.Count()} customers from {fileExtension} file."
                };
                return Ok(result);
            }
            catch (NotSupportedException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error processing file: {ex.Message}");
            }
        }

        private bool CustomerExists(int id)
        {
            return _customerRequestRepository.GetRequestByIdAsync(id) != null;
        }
    }
}