namespace FoodDelivery.OrderService.DTOs
{
    public class CreateOrderDto
    {
        public int CustomerId { get; set; }
        public int RestaurantId { get; set; }
        public int DeliveryAddressId { get; set; }
        public int? DeliveryPersonId { get; set; }
        public string PaymentMethod { get; set; }
        public string SpecialInstructions { get; set; }
        public List<CreateOrderItemDto> Items { get; set; }
    }

    public class CreateOrderItemDto
    {
        public int MenuItemId { get; set; }
        public int Quantity { get; set; }
        public string SpecialInstructions { get; set; }
    }
}
