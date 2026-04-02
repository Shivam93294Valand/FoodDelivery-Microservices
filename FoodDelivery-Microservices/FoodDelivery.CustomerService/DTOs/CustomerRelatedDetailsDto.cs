namespace FoodDelivery.CustomerService.DTOs
{
    public class CustomerRelatedDetailsDto
    {
        public CustomerInfoDto Customer { get; set; } = null!;
        public IEnumerable<CustomerOrderDto> Orders { get; set; } = [];
        public CustomerStatsDto Stats { get; set; } = null!;
    }

    public class CustomerInfoDto
    {
        public int CustomerId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName => $"{FirstName} {LastName}";
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public bool IsActive { get; set; }
        public IEnumerable<CustomerAddressDto> Addresses { get; set; } = [];
    }

    public class CustomerOrderDto
    {
        public int OrderId { get; set; }
        public string OrderStatus { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public string PaymentStatus { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public DateTime? DeliveryTime { get; set; }
        public string SpecialInstructions { get; set; } = string.Empty;
        public CustomerOrderRestaurantDto? Restaurant { get; set; }
        public IEnumerable<CustomerOrderItemDto> Items { get; set; } = [];
        public CustomerOrderDeliveryDto? Delivery { get; set; }
        public CustomerOrderPaymentDto? Payment { get; set; }
    }

    public class CustomerOrderRestaurantDto
    {
        public int RestaurantId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public decimal Rating { get; set; }
    }

    public class CustomerOrderItemDto
    {
        public int MenuItemId { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
    }

    public class CustomerOrderDeliveryDto
    {
        public int DeliveryId { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? AssignedAt { get; set; }
        public DateTime? PickedUpAt { get; set; }
        public DateTime? DeliveredAt { get; set; }
        public string? DeliveryPartnerName { get; set; }
        public string? DeliveryPartnerPhone { get; set; }
        public string? VehicleType { get; set; }
        public string? VehicleNumber { get; set; }
    }

    public class CustomerOrderPaymentDto
    {
        public int PaymentId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string TransactionId { get; set; } = string.Empty;
        public DateTime PaymentDate { get; set; }
        public DateTime? CompletedAt { get; set; }
    }

    public class CustomerStatsDto
    {
        public int TotalOrders { get; set; }
        public decimal TotalSpent { get; set; }
        public int CompletedOrders { get; set; }
        public int PendingOrders { get; set; }
        public int CancelledOrders { get; set; }
        public string? FavoriteRestaurant { get; set; }
        public DateTime? LastOrderDate { get; set; }
    }
}
