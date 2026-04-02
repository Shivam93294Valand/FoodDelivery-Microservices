namespace FoodDelivery.OrderService.DTOs
{
    public class OrderListDto
    {
        public int OrderId { get; set; }
        public int CustomerId { get; set; }
        public int RestaurantId { get; set; }
        public string RestaurantName { get; set; }
        public string OrderStatus { get; set; }
        public decimal TotalAmount { get; set; }
        public string PaymentStatus { get; set; }
        public DateTime OrderDate { get; set; }
        public DateTime? DeliveryTime { get; set; }
        public int ItemCount { get; set; }
    }

    public class OrderDetailDto
    {
        public int OrderId { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; }
        public int RestaurantId { get; set; }
        public string RestaurantName { get; set; }
        public int? DeliveryPersonId { get; set; }
        public string DeliveryPersonName { get; set; }
        public int DeliveryAddressId { get; set; }
        public string DeliveryAddress { get; set; }
        public string OrderStatus { get; set; }
        public decimal SubTotal { get; set; }
        public decimal DeliveryCharge { get; set; }
        public decimal Tax { get; set; }
        public decimal TotalAmount { get; set; }
        public string PaymentStatus { get; set; }
        public string PaymentMethod { get; set; }
        public DateTime OrderDate { get; set; }
        public DateTime? DeliveryTime { get; set; }
        public string SpecialInstructions { get; set; }
        public IEnumerable<OrderItemDto> OrderItems { get; set; }
    }

    public class OrderDto
    {
        public int OrderId { get; set; }
        public int CustomerId { get; set; }
        public int RestaurantId { get; set; }
        public int? DeliveryPersonId { get; set; }
        public int DeliveryAddressId { get; set; }
        public string OrderStatus { get; set; }
        public decimal SubTotal { get; set; }
        public decimal DeliveryCharge { get; set; }
        public decimal Tax { get; set; }
        public decimal TotalAmount { get; set; }
        public string PaymentStatus { get; set; }
        public string PaymentMethod { get; set; }
        public DateTime OrderDate { get; set; }
        public DateTime? DeliveryTime { get; set; }
        public string SpecialInstructions { get; set; }
        public IEnumerable<OrderItemDto> OrderItems { get; set; }
    }

    public class OrderItemDto
    {
        public int OrderItemId { get; set; }
        public int OrderId { get; set; }
        public int MenuItemId { get; set; }
        public string ItemName { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public string SpecialInstructions { get; set; }
    }

    public class UpdateOrderStatusDto
    {
        public string Status { get; set; }
    }

    public class OrderTrackingDto
    {
        public int OrderId { get; set; }
        public string OrderStatus { get; set; }
        public DateTime OrderDate { get; set; }
        public DateTime? EstimatedDeliveryTime { get; set; }
        public DateTime? DeliveryTime { get; set; }
        public string RestaurantName { get; set; }
        public string RestaurantAddress { get; set; }
        public string DeliveryAddress { get; set; }
        public DeliveryPersonTrackingDto DeliveryPerson { get; set; }
    }

    public class DeliveryPersonTrackingDto
    {
        public int DeliveryPersonId { get; set; }
        public string Name { get; set; }
        public string PhoneNumber { get; set; }
        public string VehicleType { get; set; }
        public string VehicleNumber { get; set; }
        public decimal Rating { get; set; }
    }
}