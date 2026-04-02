using System.ComponentModel.DataAnnotations;

namespace FoodDelivery.AdminService.DTOs
{
    public class CreateDeliveryPersonDto
    {
        [Required]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [Phone]
        public string PhoneNumber { get; set; } = string.Empty;

        public string? VehicleType { get; set; }
        public string? VehicleNumber { get; set; }
    }
}
