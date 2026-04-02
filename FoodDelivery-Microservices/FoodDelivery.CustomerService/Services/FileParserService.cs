using ClosedXML.Excel;
using FoodDelivery.CustomerService.DTOs;
using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;

namespace FoodDelivery.CustomerService.Services
{
    public class FileParserService : IFileParserService
    {
        public async Task<List<BulkCreateCustomerDto>> ParseCustomerFileAsync(Stream fileStream, string fileExtension)
        {
            return fileExtension.ToLower() switch
            {
                ".xlsx" or ".xls" => await ParseExcelFileAsync(fileStream),
                ".csv" => await ParseCsvFileAsync(fileStream),
                _ => throw new NotSupportedException($"File extension '{fileExtension}' is not supported. Only .xlsx, .xls, and .csv are allowed.")
            };
        }

        private async Task<List<BulkCreateCustomerDto>> ParseExcelFileAsync(Stream fileStream)
        {
            var customers = new List<BulkCreateCustomerDto>();

            await Task.Run(() =>
            {
                using var workbook = new XLWorkbook(fileStream);
                var worksheet = workbook.Worksheet(1);
                var rows = worksheet.RangeUsed().RowsUsed().Skip(1); // Skip header row

                foreach (var row in rows)
                {
                    try
                    {
                        var customer = new BulkCreateCustomerDto
                        {
                            FirstName = row.Cell(1).GetValue<string>(),
                            LastName = row.Cell(2).GetValue<string>(),
                            Email = row.Cell(3).GetValue<string>(),
                            PhoneNumber = row.Cell(4).GetValue<string>(),
                            Password = row.Cell(5).GetValue<string>()
                        };

                        if (!string.IsNullOrWhiteSpace(customer.Email))
                        {
                            customers.Add(customer);
                        }
                    }
                    catch (Exception)
                    {
                        continue;
                    }
                }
            });

            return customers;
        }

        private async Task<List<BulkCreateCustomerDto>> ParseCsvFileAsync(Stream fileStream)
        {
            var customers = new List<BulkCreateCustomerDto>();

            using var reader = new StreamReader(fileStream);
            var config = new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                HasHeaderRecord = true,
                MissingFieldFound = null,
                BadDataFound = null
            };

            using var csv = new CsvReader(reader, config);

            await Task.Run(() =>
            {
                csv.Context.RegisterClassMap<BulkCreateCustomerDtoMap>();
                customers = csv.GetRecords<BulkCreateCustomerDto>()
                              .Where(c => !string.IsNullOrWhiteSpace(c.Email))
                              .ToList();
            });

            return customers;
        }
    }

    public class BulkCreateCustomerDtoMap : ClassMap<BulkCreateCustomerDto>
    {
        public BulkCreateCustomerDtoMap()
        {
            Map(m => m.FirstName).Name("FirstName", "First Name", "first_name");
            Map(m => m.LastName).Name("LastName", "Last Name", "last_name");
            Map(m => m.Email).Name("Email", "email", "Email Address");
            Map(m => m.PhoneNumber).Name("PhoneNumber", "Phone Number", "phone_number", "Phone");
            Map(m => m.Password).Name("Password", "password");
        }
    }
}