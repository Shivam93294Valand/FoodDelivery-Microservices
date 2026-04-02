using RabbitMQ.Client;

namespace FoodDelivery.Common._Messaging
{
    public interface IMessageBus
    {
        Task Publish<T>(T message, string exchangeName, string eventName);
        IChannel? GetChannel();
    }
}