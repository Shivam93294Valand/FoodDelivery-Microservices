namespace FoodDelivery.DeliveryService.DTOs
{
    public class LoginDto
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class AuthResponseDto
    {
        public string Token { get; set; }
        public DeliveryPersonAuthDto DeliveryPerson { get; set; }
    }

    public class DeliveryPersonAuthDto
    {
        public int DeliveryPersonId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public bool IsAvailable { get; set; }
    }
} 