namespace FoodDelivery.DeliveryService.DTOs
{
    public class DeliveryListDto
    {
        public int DeliveryId { get; set; }
        public int OrderId { get; set; }
        public int DeliveryPersonId { get; set; }
        public string DeliveryPersonName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime AssignedAt { get; set; }
        public DateTime? DeliveredAt { get; set; }
    }

    public class DeliveryDetailDto
    {
        public int DeliveryId { get; set; }
        public int OrderId { get; set; }
        public int DeliveryPersonId { get; set; }        public int CustomerId { get; set; }        public string Status { get; set; } = string.Empty;
        public DateTime AssignedAt { get; set; }
        public DateTime? PickedUpAt { get; set; }
        public DateTime? DeliveredAt { get; set; }
        public double RestaurantLatitude { get; set; }
        public double RestaurantLongitude { get; set; }
        public double DeliveryLatitude { get; set; }
        public double DeliveryLongitude { get; set; }
        public DeliveryPersonDetailDto? DeliveryPerson { get; set; }
        public string EstimatedDeliveryTime { get; set; } = string.Empty;
        public double DistanceInKm { get; set; }
    }

    public class DeliveryDto
    {
        public int DeliveryId { get; set; }
        public int OrderId { get; set; }
        public int DeliveryPersonId { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime AssignedAt { get; set; }
        public DateTime? PickedUpAt { get; set; }
        public DateTime? DeliveredAt { get; set; }
        public double RestaurantLatitude { get; set; }
        public double RestaurantLongitude { get; set; }
        public double DeliveryLatitude { get; set; }
        public double DeliveryLongitude { get; set; }
        public DeliveryPersonDto? DeliveryPerson { get; set; }
    }

    public class DeliveryPersonListDto
    {
        public int DeliveryPersonId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string VehicleType { get; set; } = string.Empty;
        public decimal Rating { get; set; }
        public bool IsAvailable { get; set; }
    }

    public class DeliveryPersonDetailDto
    {
        public int DeliveryPersonId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string VehicleType { get; set; } = string.Empty;
        public string VehicleNumber { get; set; } = string.Empty;
        public decimal Rating { get; set; }
        public bool IsAvailable { get; set; }
        public DateTime JoinedDate { get; set; }
        public int TotalDeliveries { get; set; }
        public decimal EarningsToday { get; set; }
    }

    public class DeliveryPersonDto
    {
        public int DeliveryPersonId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string VehicleType { get; set; } = string.Empty;
        public string VehicleNumber { get; set; } = string.Empty;
        public decimal Rating { get; set; }
        public bool IsAvailable { get; set; }
        public DateTime JoinedDate { get; set; }
    }

    public class AssignDeliveryPersonDto
    {
        public int OrderId { get; set; }
        public int CustomerId { get; set; }
        public int RestaurantId { get; set; }
        public int DeliveryAddressId { get; set; }
        public double RestaurantLatitude { get; set; }
        public double RestaurantLongitude { get; set; }
        public double DeliveryLatitude { get; set; }
        public double DeliveryLongitude { get; set; }
    }

    public class CreateDeliveryPersonDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string VehicleType { get; set; } = string.Empty;
        public string VehicleNumber { get; set; } = string.Empty;
    }

    public class UpdateDeliveryPersonDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string VehicleType { get; set; } = string.Empty;
        public string VehicleNumber { get; set; } = string.Empty;
    }

    public class UpdateDeliveryStatusDto
    {
        public string Status { get; set; } = string.Empty;
        public double? CurrentLatitude { get; set; }
        public double? CurrentLongitude { get; set; }
    }

    public class UpdateDeliveryPersonAvailabilityDto
    {
        public bool IsAvailable { get; set; }
    }

    public class AssignDeliveryPersonResponseDto
    {
        public int DeliveryPersonId { get; set; }
        public string DeliveryPersonName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string VehicleType { get; set; } = string.Empty;
        public string EstimatedPickupTime { get; set; } = string.Empty;
    }
}