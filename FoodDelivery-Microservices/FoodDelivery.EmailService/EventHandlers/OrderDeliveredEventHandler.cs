using FoodDelivery.Common._Messaging;
using FoodDelivery.EmailService.Events;
using FoodDelivery.EmailService.Services;

namespace FoodDelivery.EmailService.EventHandlers
{
    public class OrderDeliveredEventHandler : IIntegrationEventHandler<OrderDeliveredEvent>
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<OrderDeliveredEventHandler> _logger;

        public OrderDeliveredEventHandler(IServiceProvider serviceProvider, ILogger<OrderDeliveredEventHandler> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        public async Task Handle(OrderDeliveredEvent @event)
        {
            _logger.LogInformation("Processing order delivered email for Order {OrderId}, Customer {CustomerEmail}",
                @event.OrderId,
                @event.CustomerEmail
            );

            using var scope = _serviceProvider.CreateScope();
            var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

            try
            {
                await emailService.SendOrderDeliveredEmailAsync(
                    @event.CustomerEmail,
                    @event.OrderId,
                    @event.CustomerName
                );

                _logger.LogInformation(
                    "Order delivered email sent successfully for Order {OrderId} to {Email}",
                    @event.OrderId,
                    @event.CustomerEmail
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error sending order delivered email for Order {OrderId}",
                    @event.OrderId
                );
            }
        }
    }
}
