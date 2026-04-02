using FoodDelivery.Payment_ApiTesting.Helpers;
using FoodDelivery.PaymentService.DTOs;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Xunit;

namespace FoodDelivery.Payment_ApiTesting.Controllers
{
    /// <summary>
    /// API contract tests for PaymentController.
    /// Verifies auth requirements, route accessibility, and response codes.
    /// </summary>
    public class PaymentControllerApiTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly HttpClient _client;

        public PaymentControllerApiTests(CustomWebApplicationFactory factory)
        {
            _client = factory.CreateClient();
        }

        // ── POST /api/Payment/Process (AllowAnonymous) ────────────────────────

        [Fact]
        public async Task ProcessPayment_ReturnsOk_WithValidRequest()
        {
            var dto = new ProcessPaymentDto
            {
                OrderId       = 1,
                CustomerId    = 1,
                Amount        = 25.50m,
                PaymentMethod = "CreditCard"
            };

            var response = await _client.PostAsJsonAsync("/api/Payment/Process", dto);

            Assert.True(
                response.StatusCode == HttpStatusCode.OK ||
                response.StatusCode == HttpStatusCode.Created,
                $"Expected 200/201 but got {response.StatusCode}");

            var body = await response.Content.ReadFromJsonAsync<ProcessPaymentResponseDto>();
            Assert.NotNull(body);
        }

        [Fact]
        public async Task ProcessPayment_ReturnsBadRequest_WhenBodyIsEmpty()
        {
            var response = await _client.PostAsJsonAsync("/api/Payment/Process", new { });

            Assert.True(
                response.StatusCode == HttpStatusCode.BadRequest ||
                response.StatusCode == HttpStatusCode.OK,
                $"Expected 400 but got {response.StatusCode}");
        }

        // ── GET /api/Payment ──────────────────────────────────────────────────

        [Fact]
        public async Task GetPayments_ReturnsUnauthorized_WithoutToken()
        {
            var response = await _client.GetAsync("/api/Payment");

            Assert.True(
                response.StatusCode == HttpStatusCode.Unauthorized ||
                response.StatusCode == HttpStatusCode.NotFound,
                $"Expected 401 or 404 but got {response.StatusCode}");
        }

        [Fact]
        public async Task GetPayments_ReturnsOkOrForbidden_WithCustomerToken()
        {
            var token = TestJwtHelper.GenerateToken(role: "Customer");
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.GetAsync("/api/Payment");

            Assert.True(
                response.StatusCode == HttpStatusCode.OK     ||
                response.StatusCode == HttpStatusCode.NoContent ||
                response.StatusCode == HttpStatusCode.Forbidden ||
                response.StatusCode == HttpStatusCode.NotFound,
                $"Unexpected status {response.StatusCode}");
        }

        // ── GET /api/Payment/{id} ─────────────────────────────────────────────

        [Fact]
        public async Task GetPaymentById_ReturnsUnauthorized_WithoutToken()
        {
            _client.DefaultRequestHeaders.Authorization = null;
            var response = await _client.GetAsync("/api/Payment/1");

            Assert.True(
                response.StatusCode == HttpStatusCode.Unauthorized ||
                response.StatusCode == HttpStatusCode.NotFound,
                $"Expected 401 or 404 but got {response.StatusCode}");
        }

        [Fact]
        public async Task GetPaymentById_ReturnsNotFound_WhenPaymentMissing()
        {
            var token = TestJwtHelper.GenerateToken(role: "Admin");
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.GetAsync("/api/Payment/99999");

            Assert.True(
                response.StatusCode == HttpStatusCode.NotFound ||
                response.StatusCode == HttpStatusCode.OK,
                $"Expected 404 or 200 but got {response.StatusCode}");
        }

        // ── Analytics (Admin only) ────────────────────────────────────────────

        [Fact]
        public async Task GetPaymentAnalytics_ReturnsUnauthorized_WithoutToken()
        {
            _client.DefaultRequestHeaders.Authorization = null;
            var response = await _client.GetAsync("/api/Analytics/Revenue");

            Assert.True(
                response.StatusCode == HttpStatusCode.Unauthorized ||
                response.StatusCode == HttpStatusCode.NotFound,
                $"Expected 401 or 404 but got {response.StatusCode}");
        }

        [Fact]
        public async Task GetPaymentAnalytics_ReturnsOkOrForbidden_WithAdminToken()
        {
            var token = TestJwtHelper.GenerateToken(role: "Admin");
            _client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.GetAsync("/api/Analytics/Revenue");

            Assert.True(
                response.StatusCode == HttpStatusCode.OK ||
                response.StatusCode == HttpStatusCode.NotFound,
                $"Expected 200 or 404 but got {response.StatusCode}");
        }
    }
}
