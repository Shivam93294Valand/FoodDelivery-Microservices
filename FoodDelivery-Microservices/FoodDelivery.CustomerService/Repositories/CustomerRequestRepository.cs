using Dapper;
using FoodDelivery.CustomerService.Data;
using FoodDelivery.CustomerService.Models;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Data;
using System.Data.Common;

namespace FoodDelivery.CustomerService.Repositories
{
    public class CustomerRequestRepository : ICustomerRequestRepository
    {
        private readonly CustomerDbContext _context;
        private readonly ILogger<CustomerRequestRepository> _logger;
        private readonly IConfiguration _configuration;

        public CustomerRequestRepository(CustomerDbContext context, ILogger<CustomerRequestRepository> logger, IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
        }

        public async Task<IEnumerable<Customer>> GetAllRequestsAsync()
        {
            //return await _context.Customers.ToListAsync();
            string sql = "Select * from Customers;" + "Select * from CustomerAddresses;";
            using var connection = _context.Database.GetDbConnection();

            await connection.OpenAsync();

            using (var multi = await connection.QueryMultipleAsync(sql))
            {
                var customers = (await multi.ReadAsync<Customer>()).ToList();
                var addresses = (await multi.ReadAsync<CustomerAddress>()).ToList();
                
                foreach (var customer in customers)
                {
                    customer.Addresses = addresses.Where(a => a.CustomerId == customer.CustomerId).ToList();
                }
                
                return customers;
            }
        }

        public async Task<Customer> GetRequestByIdAsync(int id)
        {
            //var customer = await _context.Customers
            //    .Include(c => c.Addresses)
            //    .FirstOrDefaultAsync(c => c.CustomerId == id);
            string sql = "Select * from Customers where CustomerId = @CustomerId; " +
                         "Select * from CustomerAddresses where CustomerId = @CustomerId;";

            using var connection = _context.Database.GetDbConnection();
            await connection.OpenAsync();

            using (var multi = await connection.QueryMultipleAsync(sql, new { CustomerId = id }))
            {
                var customer = await multi.ReadFirstOrDefaultAsync<Customer>();
                if (customer != null)
                {
                    var addresses = await multi.ReadAsync<CustomerAddress>();
                    customer.Addresses = addresses.ToList();
                }

                if (customer == null)
                {
                    throw new InvalidOperationException($"Customer with id {id} not found.");
                }

                return customer;
            }
        }

        public async Task<Customer> GetByEmailAsync(string email)
        {
            var normalizedEmail = (email ?? string.Empty).Trim().ToLower();

            var customer = await _context.Customers
                .Include(c => c.Addresses)
                .FirstOrDefaultAsync(c => c.Email.Trim().ToLower() == normalizedEmail);

            return customer;
        }

        public async Task AddRequestAsync(Customer request)
        {
            string sql = "Insert into Customers (FirstName, LastName, Email, PhoneNumber, Password, CreatedAt, IsActive) " +
                         "Values (@FirstName, @LastName, @Email, @PhoneNumber, @Password, @CreatedAt, @IsActive); " +
                         "SELECT CAST(SCOPE_IDENTITY() as int);";

            var dbConn = _context.Database.GetDbConnection();

            _logger?.LogInformation("Configured DefaultConnection: {cfg}", _configuration?.GetConnectionString("DefaultConnection") ?? "<null>");
            _logger?.LogInformation("DbConnection.ConnectionString: {conn}", dbConn?.ConnectionString ?? "<null>");

            DbConnection connectionToUse = dbConn;
            SqlConnection tempSqlConn = null;

            if (string.IsNullOrWhiteSpace(dbConn?.ConnectionString))
            {
                var cfg = _configuration?.GetConnectionString("DefaultConnection");
                if (string.IsNullOrWhiteSpace(cfg))
                {
                    _logger?.LogError("No configured connection string found in IConfiguration.");
                    throw new InvalidOperationException("Database connection string is not configured. Please ensure 'ConnectionStrings:DefaultConnection' is set.");
                }

                _logger?.LogWarning("DbContext returned empty ConnectionString; falling back to direct SqlConnection using configuration.");
                tempSqlConn = new SqlConnection(cfg);
                connectionToUse = tempSqlConn;
            }

            try
            {
                await connectionToUse.  OpenAsync();

                var customerId = await connectionToUse.QuerySingleAsync<int>(sql, new
                {
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    Email = request.Email,
                    PhoneNumber = request.PhoneNumber,
                    Password = request.Password,
                    CreatedAt = request.CreatedAt,
                    IsActive = request.IsActive
                });
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Error inserting customer via Dapper.");
                throw;
            }
            finally
            {
                if (tempSqlConn != null)
                {
                    await tempSqlConn.DisposeAsync();
                }
            }
        }

        public async Task DeleteRequestAsync(int id)
        {
            //var request = await _context.Customers.FindAsync(id);
            //if (request != null)
            //{
            //    _context.Customers.Remove(request);
            //    await _context.SaveChangesAsync();
            //}
            string sql = "Delete from Customers where CustomerId = @CustomerId;";
            using var connection = _context.Database.GetDbConnection();
            await connection.OpenAsync();

            await connection.ExecuteAsync(sql, new { CustomerId = id });
        }

        public async Task UpdateRequestAsync(Customer request)
        {
            //_context.Customers.Update(request);
            //await _context.SaveChangesAsync();
            string sql = "Update Customers set FirstName = @FirstName, LastName = @LastName, " +
                         "Email = @Email, PhoneNumber = @PhoneNumber, Password = @Password, " +
                         "CreatedAt = @CreatedAt, IsActive = @IsActive where CustomerId = @CustomerId;";

            var dbConn = _context.Database.GetDbConnection();

            _logger?.LogInformation("Configured DefaultConnection: {cfg}", _configuration?.GetConnectionString("DefaultConnection") ?? "<null>");
            _logger?.LogInformation("DbConnection.ConnectionString: {conn}", dbConn?.ConnectionString ?? "<null>");

            DbConnection connectionToUse = dbConn;
            SqlConnection tempSqlConn = null;

            if (string.IsNullOrWhiteSpace(dbConn?.ConnectionString))
            {
                var cfg = _configuration?.GetConnectionString("DefaultConnection");
                if (string.IsNullOrWhiteSpace(cfg))
                {
                    _logger?.LogError("No configured connection string found in IConfiguration.");
                    throw new InvalidOperationException("Database connection string is not configured. Please ensure 'ConnectionStrings:DefaultConnection' is set.");
                }

                _logger?.LogWarning("DbContext returned empty ConnectionString; falling back to direct SqlConnection using configuration.");
                tempSqlConn = new SqlConnection(cfg);
                connectionToUse = tempSqlConn;
            }

            try
            {
                await connectionToUse.OpenAsync();

                await connectionToUse.ExecuteAsync(sql, new
                {
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    Email = request.Email,
                    PhoneNumber = request.PhoneNumber,
                    Password = request.Password,
                    CreatedAt = request.CreatedAt,
                    IsActive = request.IsActive,
                    CustomerId = request.CustomerId
                });
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Error updating customer via Dapper.");
                throw;
            }
            finally
            {
                if (tempSqlConn != null)
                {
                    await tempSqlConn.DisposeAsync();
                }
            }
        }

        public async Task<CustomerAddress?> GetAddressByIdAsync(int addressId)
        {
            //var address = await _context.CustomerAddresses
            //    .FirstOrDefaultAsync(a => a.AddressId == addressId);
            //return address;
            string sql = "Select * from CustomerAddresses where AddressId = @AddressId;";
            using var connection = _context.Database.GetDbConnection();
            await connection.OpenAsync();

            var address = await connection.QuerySingleOrDefaultAsync<CustomerAddress>(sql, new { AddressId = addressId });
            return address;
        }

        public async Task<IEnumerable<Customer>> BulkInsertCustomersAsync(IEnumerable<Customer> customers)
        {
            using (var connection = _context.Database.GetDbConnection())
            {
                await connection.OpenAsync();
                var dataTable = new DataTable();
                dataTable.Columns.Add("FirstName", typeof(string));
                dataTable.Columns.Add("LastName", typeof(string));
                dataTable.Columns.Add("Email", typeof(string));
                dataTable.Columns.Add("PhoneNumber", typeof(string));
                dataTable.Columns.Add("Password", typeof(string));
                dataTable.Columns.Add("CreatedAt", typeof(DateTime));
                dataTable.Columns.Add("IsActive", typeof(bool));

                // Populate DataTable with customer data
                foreach (var customer in customers)
                {
                    dataTable.Rows.Add(
                        customer.FirstName,
                        customer.LastName,
                        customer.Email,
                        customer.PhoneNumber,
                        customer.Password,
                        customer.CreatedAt,
                        customer.IsActive
                    );
                }
                var parameter = new SqlParameter
                {
                    ParameterName = "@Customers",
                    SqlDbType = SqlDbType.Structured,
                    TypeName = "dbo.CustomerTableType",
                    Value = dataTable
                };

                // Execute stored procedure using Dapper
                var insertedCustomers = await connection.QueryAsync<Customer>("dbo.BulkInsertCustomers",
                    new { Customers = dataTable.AsTableValuedParameter("dbo.CustomerTableType") },
                    commandType: CommandType.StoredProcedure
                );
                return insertedCustomers;
            }
        }
    }
}