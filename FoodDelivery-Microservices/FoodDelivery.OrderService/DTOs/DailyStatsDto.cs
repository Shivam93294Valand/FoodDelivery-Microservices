namespace FoodDelivery.OrderService.DTOs
{
    public class DailyStatsDto
    {
        public DateTime Date { get; set; }
        public int TotalOrders { get; set; }
        public decimal TotalRevenue { get; set; }
        // Can add more like "PendingOrders", "CompletedOrders"
    }
}
