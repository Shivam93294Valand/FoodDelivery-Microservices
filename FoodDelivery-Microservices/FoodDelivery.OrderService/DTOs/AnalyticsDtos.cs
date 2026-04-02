namespace FoodDelivery.OrderService.DTOs
{
    public class OrderStatsDto
    {
        public string Period { get; set; } // "Jan", "Feb" or "2024", "2025"
        public int Count { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    public class TopCustomerDto
    {
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } // Might need to fetch from Gateway
        public int OrderCount { get; set; }
        public decimal TotalSpent { get; set; }
    }

    public class FrequentItemDto
    {
        public int MenuItemId { get; set; }
        public string ItemName { get; set; }
        public int Count { get; set; }
    }
}
