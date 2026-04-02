using FoodDelivery.Common._Messaging;
using FoodDelivery.EmailService.Events;
using FoodDelivery.EmailService.Services;

namespace FoodDelivery.EmailService.EventHandlers
{
    public class DeliveryAssignedEventHandler : IIntegrationEventHandler<DeliveryAssignedEvent>
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<DeliveryAssignedEventHandler> _logger;

        public DeliveryAssignedEventHandler(IServiceProvider serviceProvider, ILogger<DeliveryAssignedEventHandler> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        public async Task Handle(DeliveryAssignedEvent @event)
        {
            _logger.LogInformation("Processing delivery assignment email for Order {OrderId}, Delivery Person {DeliveryPersonEmail}",
                @event.OrderId,
                @event.DeliveryPersonEmail
            );

            using var scope = _serviceProvider.CreateScope();
            var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

            try
            {
                var deliveryPersonName = $"{@event.DeliveryPersonFirstName} {@event.DeliveryPersonLastName}";

                var emailSent = await emailService.SendDeliveryAssignmentEmailAsync(
                    recipientEmail: @event.DeliveryPersonEmail,
                    recipientName: deliveryPersonName,
                    orderId: @event.OrderId,
                    restaurantName: @event.RestaurantName,
                    restaurantAddress: @event.RestaurantAddress,
                    deliveryAddress: @event.DeliveryAddress,
                    estimatedDeliveryTime: @event.EstimatedDeliveryTime ?? DateTime.UtcNow.AddMinutes(30),
                    orderAmount: @event.OrderTotalAmount
                );

                if (emailSent)
                {
                    _logger.LogInformation(
                        "Email sent successfully for Order {OrderId} to {Email}",
                        @event.OrderId,
                        @event.DeliveryPersonEmail
                    );
                }
                else
                {
                    _logger.LogWarning(
                        "Failed to send email for Order {OrderId} to {Email}",
                        @event.OrderId,
                        @event.DeliveryPersonEmail
                    );
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error sending email for Order {OrderId}",
                    @event.OrderId
                );
            }
        }
    }
}