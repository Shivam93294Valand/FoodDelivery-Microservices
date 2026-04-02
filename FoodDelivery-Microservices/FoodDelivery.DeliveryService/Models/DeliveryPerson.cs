namespace FoodDelivery.DeliveryService.Models
{
    public enum ShiftStatus
    {
        OffShift,
        OnShift,
        Break
    }

    public class DeliveryPerson
    {
        public int DeliveryPersonId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string VehicleType { get; set; } = string.Empty;
        public string VehicleNumber { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public bool IsAvailable { get; set; }
        public double CurrentLatitude { get; set; }
        public double CurrentLongitude { get; set; }
        public decimal Rating { get; set; }
        public DateTime JoinedDate { get; set; }
        public int? UserId { get; set; } // Link to Auth User
        
        // Shift Management
        public ShiftStatus ShiftStatus { get; set; } = ShiftStatus.OffShift;
        public DateTime? ShiftStartTime { get; set; }
        public DateTime? ShiftEndTime { get; set; }
        public DateTime? LastStatusChange { get; set; }
    }
}
