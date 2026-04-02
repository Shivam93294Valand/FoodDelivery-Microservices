using System.Net;
using System.Text;
using System.Text.Json;
using FoodDelivery.PaymentService.Data;
using FoodDelivery.PaymentService.Models;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace FoodDelivery.Payment_IntegrationTesting.Controllers
{
    public class PaymentControllerTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly HttpClient _client;
        private readonly CustomWebApplicationFactory _factory;
        private static readonly JsonSerializerOptions _jsonOptions = new() { PropertyNameCaseInsensitive = true };

        public PaymentControllerTests(CustomWebApplicationFactory factory)
        {
            _factory = factory;
            _client = factory.CreateClient();
        }

        private async Task<int> SeedPayment(int orderId = 10, int customerId = 100, decimal amount = 250m, string status = "Completed")
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<PaymentDbContext>();

            var payment = new Payment
            {
                OrderId = orderId,
                CustomerId = customerId,
                Amount = amount,
                PaymentMethod = "UPI",
                Status = status,
                TransactionId = "TXN_" + orderId,
                PaymentDate = DateTime.UtcNow
            };

            db.Payments.Add(payment);
            await db.SaveChangesAsync();
            return payment.PaymentId;
        }

    }
}
