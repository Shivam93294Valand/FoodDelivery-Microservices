using FoodDelivery.OrderService.DTOs;
using System.Net.Http.Json;

namespace FoodDelivery.OrderService.Services
{
    public class MicroserviceGateway
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _config;
        private readonly ILogger<MicroserviceGateway> _logger;

        public MicroserviceGateway(HttpClient httpClient, IConfiguration config, ILogger<MicroserviceGateway> logger)
        {
            _httpClient = httpClient;
            _config = config;
            _logger = logger;
        }

        // Get Customer Details
        public async Task<CustomerDto?> GetCustomer(int customerId)
        {
            try
            {
                var url = $"{_config["MicroserviceUrls:CustomerServiceBaseUrl"]}/api/Customer/{customerId}";
                var response = await _httpClient.GetAsync(url);
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Customer validation failed for ID {CustomerId}. Status Code: {StatusCode}", customerId, response.StatusCode);
                    return null;
                }
                
                return await response.Content.ReadFromJsonAsync<CustomerDto>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Could not connect to CustomerService");
                return null;
            }
        }

        public string GetCustomerServiceUrl(int customerId)
        {
            return $"{_config["MicroserviceUrls:CustomerServiceBaseUrl"]}/api/Customer/{customerId}";
        }

        // Get Customer Address Details
        public async Task<CustomerAddressDto?> GetCustomerAddress(int addressId)
        {
            try
            {
                var url = $"{_config["MicroserviceUrls:CustomerServiceBaseUrl"]}/api/CustomerAddress/{addressId}";
                var response = await _httpClient.GetAsync(url);
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Customer address fetch failed for ID {AddressId}. Status Code: {StatusCode}", addressId, response.StatusCode);
                    return null;
                }
                
                return await response.Content.ReadFromJsonAsync<CustomerAddressDto>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Could not connect to CustomerService (Address)");
                return null;
            }
        }

        // Get Restaurant Details
        public async Task<RestaurantDto> GetRestaurant(int restaurantId)
        {
            try
            {
                var url = $"{_config["MicroserviceUrls:RestaurantServiceBaseUrl"]}/api/Restaurant/{restaurantId}";
                var response = await _httpClient.GetAsync(url);
                
                if (!response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    throw new Exception($"Restaurant validation failed. Status: {response.StatusCode}. URL: {url}. Response: {content}");
                }
                
                return await response.Content.ReadFromJsonAsync<RestaurantDto>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Could not connect to RestaurantService");
                throw new Exception($"Error connecting to RestaurantService: {ex.Message}");
            }
        }

        // Validate Delivery Person exists
        public async Task<bool> DeliveryPersonExists(int deliveryPersonId)
        {
            try 
            {
                var url = $"{_config["MicroserviceUrls:DeliveryServiceBaseUrl"]}/api/DeliveryPerson/{deliveryPersonId}";
                var response = await _httpClient.GetAsync(url);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Could not connect to DeliveryService");
                return false;
            }
        }

        // Get Menu Item details
        public async Task<MenuItemResponseDto?> GetMenuItem(int menuItemId)
        {
            try
            {
                var url = $"{_config["MicroserviceUrls:RestaurantServiceBaseUrl"]}/api/Menu/{menuItemId}";
                var response = await _httpClient.GetAsync(url);
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Menu item validation failed for ID {MenuItemId}", menuItemId);
                    return null;
                }
                
                return await response.Content.ReadFromJsonAsync<MenuItemResponseDto>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Could not connect to RestaurantService for menu item {MenuItemId}", menuItemId);
                return null;
            }
        }

        // Assign Delivery Person
        public async Task<int?> AssignDeliveryPerson(int orderId, int restaurantId, int deliveryAddressId)
        {
            try
            {
                var url = $"{_config["MicroserviceUrls:DeliveryServiceBaseUrl"]}/api/Delivery/AssignPerson";
                var payload = new
                {
                    OrderId = orderId,
                    RestaurantId = restaurantId,
                    DeliveryAddressId = deliveryAddressId
                };

                var response = await _httpClient.PostAsJsonAsync(url, payload);

                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<AssignDeliveryPersonResponseDto>();
                    return result?.DeliveryPersonId;
                }
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error assigning delivery person");
                return null;
            }
        }

        // Process Payment
        public async Task<bool> ProcessPayment(int orderId, int customerId, decimal amount, string paymentMethod)
        {
            try
            {
                var url = $"{_config["MicroserviceUrls:PaymentServiceBaseUrl"]}/api/Payment/Process";
                var payload = new
                {
                    OrderId = orderId,
                    CustomerId = customerId,
                    Amount = amount,
                    PaymentMethod = paymentMethod
                };

                var response = await _httpClient.PostAsJsonAsync(url, payload);
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Payment processing failed for order {OrderId}. Status: {StatusCode}", orderId, response.StatusCode);
                    return false;
                }
                
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Could not connect to PaymentService");
                return false;
            }
        }

        // Process Refund
        public async Task<bool> ProcessRefund(int orderId, decimal amount)
        {
            try
            {
                // First get the payment by order ID
                var getUrl = $"{_config["MicroserviceUrls:PaymentServiceBaseUrl"]}/api/Payment/Order/{orderId}";
                var getResponse = await _httpClient.GetAsync(getUrl);
                
                if (!getResponse.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Could not fetch payment for order {OrderId}", orderId);
                    return false;
                }
                
                var payment = await getResponse.Content.ReadFromJsonAsync<PaymentDetailDto>();
                if (payment == null)
                {
                    return false;
                }

                var url = $"{_config["MicroserviceUrls:PaymentServiceBaseUrl"]}/api/Payment/Refund";
                var payload = new
                {
                    PaymentId = payment.PaymentId,
                    RefundAmount = amount
                };

                var response = await _httpClient.PostAsJsonAsync(url, payload);
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Refund processing failed for order {OrderId}. Status: {StatusCode}", orderId, response.StatusCode);
                    return false;
                }
                
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Could not connect to PaymentService for refund");
                return false;
            }
        }
    }

    public class AssignDeliveryPersonResponseDto
    {
        public int DeliveryPersonId { get; set; }
    }

    public class PaymentDetailDto
    {
        public int PaymentId { get; set; }
        public int OrderId { get; set; }
        public int CustomerId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }
}