using FoodDelivery.PaymentService.Models;

namespace FoodDelivery.PaymentService.Repositories
{
    public interface IPaymentRepository
    {
        Task<IEnumerable<Payment>> GetAllAsync();
        Task<Payment> GetPaymentByIdAsync(int paymentId);
        Task AddPaymentAsync(Payment payment);
        Task UpdatePaymentAsync(Payment payment);
        Task<Payment?> GetPaymentByOrderIdAsync(int orderId);
    }
}