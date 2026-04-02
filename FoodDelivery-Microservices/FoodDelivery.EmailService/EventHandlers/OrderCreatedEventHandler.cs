using FoodDelivery.Common._Messaging;
using FoodDelivery.EmailService.Events;
using FoodDelivery.EmailService.Services;

namespace FoodDelivery.EmailService.EventHandlers
{
    public class OrderCreatedEventHandler : IIntegrationEventHandler<OrderCreatedEvent>
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<OrderCreatedEventHandler> _logger;

        public OrderCreatedEventHandler(IServiceProvider serviceProvider, ILogger<OrderCreatedEventHandler> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        public async Task Handle(OrderCreatedEvent @event)
        {
            _logger.LogInformation("Processing order confirmation email for Order {OrderId}, Customer {CustomerEmail}",
                @event.OrderId,
                @event.CustomerEmail
            );

            using var scope = _serviceProvider.CreateScope();
            var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

            try
            {
                var emailSent = await emailService.SendOrderConfirmationEmailAsync(
                    recipientEmail: @event.CustomerEmail,
                    recipientName: @event.CustomerName,
                    orderId: @event.OrderId,
                    restaurantName: @event.RestaurantName,
                    orderAmount: @event.TotalAmount,
                    orderDate: @event.OrderDate
                );

                if (emailSent)
                {
                    _logger.LogInformation(
                        "Order confirmation email sent successfully for Order {OrderId} to {Email}",
                        @event.OrderId,
                        @event.CustomerEmail
                    );
                }
                else
                {
                    _logger.LogWarning(
                        "Failed to send order confirmation email for Order {OrderId} to {Email}",
                        @event.OrderId,
                        @event.CustomerEmail
                    );
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error sending order confirmation email for Order {OrderId}",
                    @event.OrderId
                );
            }
        }
    }
}
