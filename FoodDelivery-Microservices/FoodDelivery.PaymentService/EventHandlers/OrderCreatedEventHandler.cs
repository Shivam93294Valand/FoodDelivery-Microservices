using FoodDelivery.Common._Messaging;
using FoodDelivery.PaymentService.Events;
using FoodDelivery.PaymentService.Models;
using FoodDelivery.PaymentService.Repositories;

namespace FoodDelivery.PaymentService.EventHandlers
{
    public class OrderCreatedEventHandler : IIntegrationEventHandler<OrderCreatedEvent>
    {
        private readonly IServiceProvider _serviceProvider;

        public OrderCreatedEventHandler(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        public async Task Handle(OrderCreatedEvent @event)
        {
            using (var scope = _serviceProvider.CreateScope())
            {
                var paymentRepo = scope.ServiceProvider
                    .GetRequiredService<IPaymentRepository>();

                var existingPayment = await paymentRepo.GetPaymentByOrderIdAsync(@event.OrderId);
                if (existingPayment != null)
                {
                    return;
                }

                var payment = new Payment
                {
                    OrderId = @event.OrderId,
                    CustomerId = @event.CustomerId,
                    Amount = @event.TotalAmount,
                    PaymentMethod = @event.PaymentMethod,
                    Status = "Pending",
                    PaymentDate = DateTime.UtcNow,
                    TransactionId = Guid.NewGuid().ToString()
                };

                await paymentRepo.AddPaymentAsync(payment);
            }
        }
    }
}