namespace FoodDelivery.Common._Messaging
{
    public interface IIntegrationEventHandler<T>
    {
        Task Handle(T @event);
    }
}