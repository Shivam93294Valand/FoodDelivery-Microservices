using FoodDelivery.PaymentService.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodDelivery.PaymentService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AnalyticsController : ControllerBase
    {
        private readonly IPaymentRepository _paymentRepository;

        public AnalyticsController(IPaymentRepository paymentRepository)
        {
            _paymentRepository = paymentRepository;
        }

        // GET: api/Analytics/Stats
        [HttpGet("Stats")]
        public async Task<ActionResult<object>> GetPaymentStats()
        {
            var payments = await _paymentRepository.GetAllAsync();
            
            var totalRevenue = payments.Where(p => p.Status == "Completed").Sum(p => p.Amount);
            var totalPayments = payments.Count();
            var completedPayments = payments.Count(p => p.Status == "Completed");
            var failedPayments = payments.Count(p => p.Status == "Failed");
            var refundedPayments = payments.Count(p => p.Status == "Refunded");
            var pendingPayments = payments.Count(p => p.Status == "Pending");

            // Calculate today's stats
            var today = DateTime.UtcNow.Date;
            var todayPayments = payments.Where(p => p.PaymentDate.Date == today);
            var todayRevenue = todayPayments.Where(p => p.Status == "Completed").Sum(p => p.Amount);
            var todayTransactions = todayPayments.Count();

            // Calculate this month's stats
            var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            var monthPayments = payments.Where(p => p.PaymentDate >= startOfMonth);
            var monthRevenue = monthPayments.Where(p => p.Status == "Completed").Sum(p => p.Amount);
            var monthTransactions = monthPayments.Count();
            var paymentMethodStats = payments
                .GroupBy(p => p.PaymentMethod)
                .Select(g => new
                {
                    Method = g.Key,
                    Count = g.Count(),
                    TotalAmount = g.Where(p => p.Status == "Completed").Sum(p => p.Amount)
                })
                .ToList();

            // Average transaction value
            var avgTransactionValue = completedPayments > 0 
                ? payments.Where(p => p.Status == "Completed").Average(p => p.Amount) 
                : 0;

            var stats = new
            {
                Overview = new
                {
                    TotalRevenue = totalRevenue,
                    TotalPayments = totalPayments,
                    CompletedPayments = completedPayments,
                    FailedPayments = failedPayments,
                    RefundedPayments = refundedPayments,
                    PendingPayments = pendingPayments,
                    SuccessRate = totalPayments > 0 ? (decimal)completedPayments / totalPayments * 100 : 0,
                    AvgTransactionValue = avgTransactionValue
                },
                Today = new
                {
                    Revenue = todayRevenue,
                    Transactions = todayTransactions
                },
                ThisMonth = new
                {
                    Revenue = monthRevenue,
                    Transactions = monthTransactions
                },
                PaymentMethods = paymentMethodStats
            };

            return Ok(stats);
        }

        // GET: api/Analytics/Revenue?period=month&year=2024
        [HttpGet("Revenue")]
        public async Task<ActionResult<Dictionary<string, decimal>>> GetRevenueStats([FromQuery] string period = "month", [FromQuery] int year = 0)
        {
            if (year == 0) year = DateTime.UtcNow.Year;

            var payments = await _paymentRepository.GetAllAsync();
            var completedPayments = payments.Where(p => p.Status == "Completed" && p.PaymentDate.Year == year);

            Dictionary<string, decimal> revenueData;

            switch (period.ToLower())
            {
                case "day":
                    // Last 30 days
                    var endDate = DateTime.UtcNow.Date;
                    var startDate = endDate.AddDays(-29);
                    revenueData = Enumerable.Range(0, 30)
                        .Select(i => startDate.AddDays(i))
                        .ToDictionary(
                            date => date.ToString("MMM dd"),
                            date => completedPayments
                                .Where(p => p.PaymentDate.Date == date)
                                .Sum(p => p.Amount)
                        );
                    break;

                case "week":
                    // Last 12 weeks
                    revenueData = Enumerable.Range(0, 12)
                        .Select(i => DateTime.UtcNow.AddDays(-i * 7))
                        .Reverse()
                        .ToDictionary(
                            date => $"Week {date:MMM dd}",
                            date => completedPayments
                                .Where(p => p.PaymentDate >= date && p.PaymentDate < date.AddDays(7))
                                .Sum(p => p.Amount)
                        );
                    break;

                case "year":
                    // Last 5 years
                    revenueData = Enumerable.Range(0, 5)
                        .Select(i => year - i)
                        .Reverse()
                        .ToDictionary(
                            y => y.ToString(),
                            y => payments
                                .Where(p => p.Status == "Completed" && p.PaymentDate.Year == y)
                                .Sum(p => p.Amount)
                        );
                    break;

                case "month":
                default:
                    // Monthly data for the year
                    revenueData = Enumerable.Range(1, 12)
                        .ToDictionary(
                            month => new DateTime(year, month, 1).ToString("MMM"),
                            month => completedPayments
                                .Where(p => p.PaymentDate.Month == month)
                                .Sum(p => p.Amount)
                        );
                    break;
            }

            return Ok(revenueData);
        }

        // GET: api/Analytics/TopSpenders?count=10
        [HttpGet("TopSpenders")]
        public async Task<ActionResult<IEnumerable<object>>> GetTopSpenders([FromQuery] int count = 10)
        {
            var payments = await _paymentRepository.GetAllAsync();
            
            var topSpenders = payments
                .Where(p => p.Status == "Completed" && p.CustomerId > 0)
                .GroupBy(p => p.CustomerId)
                .Select(g => new
                {
                    CustomerId = g.Key,
                    TotalSpent = g.Sum(p => p.Amount),
                    TransactionCount = g.Count(),
                    AverageOrderValue = g.Average(p => p.Amount)
                })
                .OrderByDescending(x => x.TotalSpent)
                .Take(count)
                .ToList();

            return Ok(topSpenders);
        }
    }
}