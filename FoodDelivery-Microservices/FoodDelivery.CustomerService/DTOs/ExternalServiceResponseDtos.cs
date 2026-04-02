namespace FoodDelivery.CustomerService.DTOs
{
    internal class OrderResponseDto
    {
        public int OrderId { get; set; }
        public int CustomerId { get; set; }
        public int RestaurantId { get; set; }
        public string OrderStatus { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public string PaymentStatus { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public DateTime? DeliveryTime { get; set; }
        public string SpecialInstructions { get; set; } = string.Empty;
        public List<OrderItemResponseDto>? OrderItems { get; set; }
    }

    internal class OrderItemResponseDto
    {
        public int MenuItemId { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
    }

    internal class RestaurantResponseDto
    {
        public int RestaurantId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public decimal Rating { get; set; }
    }

    internal class RestaurantDetailsDto
    {
        public int RestaurantId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Cuisine { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public double Rating { get; set; }
        public bool IsActive { get; set; }
    }

    internal class MenuItemDetailsDto
    {
        public int MenuItemId { get; set; }
        public int RestaurantId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Category { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public bool IsAvailable { get; set; }
        public string RestaurantName { get; set; } = string.Empty;
    }

    internal class DeliveryResponseDto
    {
        public int DeliveryId { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime AssignedAt { get; set; }
        public DateTime? PickedUpAt { get; set; }
        public DateTime? DeliveredAt { get; set; }
        public DeliveryPartnerResponseDto? DeliveryPartner { get; set; }
    }

    internal class DeliveryPartnerResponseDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName => $"{FirstName} {LastName}";
        public string PhoneNumber { get; set; } = string.Empty;
        public string VehicleType { get; set; } = string.Empty;
        public string VehicleNumber { get; set; } = string.Empty;
    }

    internal class PaymentResponseDto
    {
        public int PaymentId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string TransactionId { get; set; } = string.Empty;
        public DateTime PaymentDate { get; set; }
        public DateTime? CompletedAt { get; set; }
    }
}
