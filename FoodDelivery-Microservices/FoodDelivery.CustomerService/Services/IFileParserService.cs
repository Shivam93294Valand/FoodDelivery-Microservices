using FoodDelivery.CustomerService.DTOs;

namespace FoodDelivery.CustomerService.Services
{
    public interface IFileParserService
    {
        Task<List<BulkCreateCustomerDto>> ParseCustomerFileAsync(Stream fileStream, string fileExtension);   
    }
}