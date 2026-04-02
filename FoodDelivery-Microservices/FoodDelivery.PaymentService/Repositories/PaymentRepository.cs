using FoodDelivery.PaymentService.Data;
using FoodDelivery.PaymentService.Models;
using Microsoft.EntityFrameworkCore;

namespace FoodDelivery.PaymentService.Repositories
{
    public class PaymentRepository : IPaymentRepository
    {
        private readonly PaymentDbContext _context;

        public PaymentRepository(PaymentDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Payment>> GetAllAsync()
        {
            return await _context.Payments.AsNoTracking().ToListAsync();
        }

        public async Task AddPaymentAsync(Payment payment)
        {
            await _context.Payments.AddAsync(payment);
            await _context.SaveChangesAsync();
            return;
        }

        public async Task<Payment?> GetPaymentByIdAsync(int paymentId)
        {
            return await _context.Payments.FindAsync(paymentId);
        }

        public Task<Payment?> GetPaymentByOrderIdAsync(int orderId)
        {
            return _context.Payments
                .Where(p => p.OrderId == orderId)
                .OrderByDescending(p => p.PaymentId)
                .FirstOrDefaultAsync();
        }

        public async Task UpdatePaymentAsync(Payment payment)
        {
            _context.Payments.Update(payment);
            await _context.SaveChangesAsync();
        }
    }
}
