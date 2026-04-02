namespace FoodDelivery.OrderService.DTOs
{
    public class MenuItemResponseDto
    {
        public int MenuItemId { get; set; }
        public string Name { get; set; }
        public decimal Price { get; set; }
        public bool IsAvailable { get; set; }
    }
}