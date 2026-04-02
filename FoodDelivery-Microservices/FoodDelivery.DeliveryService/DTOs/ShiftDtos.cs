using FoodDelivery.DeliveryService.Models;

namespace FoodDelivery.DeliveryService.DTOs
{
    public class EmergencyAlertRequestDto
    {
        public string Message { get; set; } = string.Empty;
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string Severity { get; set; } = "Medium";
    }

    public class EmergencyAlertResponseDto
    {
        public int AlertId { get; set; }
        public int DeliveryPersonId { get; set; }
        public string Message { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class UpdateShiftStatusDto
    {
        public ShiftStatus ShiftStatus { get; set; }
    }

    public class ShiftStatusResponseDto
    {
        public int DeliveryPersonId { get; set; }
        public ShiftStatus ShiftStatus { get; set; }
        public DateTime? ShiftStartTime { get; set; }
        public DateTime? ShiftEndTime { get; set; }
        public DateTime? LastStatusChange { get; set; }
        public TimeSpan? TotalShiftDuration { get; set; }
    }

    public class ShiftHistoryDto
    {
        public DateTime Date { get; set; }
        public int TotalShifts { get; set; }
        public TimeSpan TotalHours { get; set; }
        public int DeliveriesCompleted { get; set; }
    }
}
