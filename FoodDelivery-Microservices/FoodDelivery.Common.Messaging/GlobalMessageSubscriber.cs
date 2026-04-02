using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Text.Json;

namespace FoodDelivery.Common._Messaging
{
    public class GlobalMessageSubscriber<T, THandler> : BackgroundService
        where THandler : IIntegrationEventHandler<T>
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly IConfiguration _configuration;
        private readonly string _exchangeName;
        private IConnection? _connection;
        private IChannel? _channel;

        public GlobalMessageSubscriber(
            IServiceProvider serviceProvider,
            IConfiguration configuration,
            string exchangeName)
        {
            _serviceProvider = serviceProvider;
            _configuration = configuration;
            _exchangeName = exchangeName;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            try
            {
                // Connect to RabbitMQ - support both config formats
                var host = _configuration["RabbitMQ:Host"] ?? _configuration["RabbitMQHost"] ?? "localhost";
                var portString = _configuration["RabbitMQ:Port"] ?? _configuration["RabbitMQPort"] ?? "5672";
                var port = int.Parse(portString);

                var factory = new ConnectionFactory()
                {
                    HostName = host,
                    Port = port
                };

                _connection = await factory.CreateConnectionAsync(stoppingToken);
                _channel = await _connection.CreateChannelAsync(cancellationToken: stoppingToken);

                // Setup exchange and queue
                await _channel.ExchangeDeclareAsync(
                    exchange: _exchangeName,
                    type: ExchangeType.Fanout,
                    cancellationToken: stoppingToken
                );

                var queueDeclareResponse = await _channel.QueueDeclareAsync(cancellationToken: stoppingToken);
                string queueName = queueDeclareResponse.QueueName;

                await _channel.QueueBindAsync(
                    queue: queueName,
                    exchange: _exchangeName,
                    routingKey: string.Empty,
                    cancellationToken: stoppingToken
                );

                // Listen for messages
                var consumer = new AsyncEventingBasicConsumer(_channel);

                consumer.ReceivedAsync += async (model, ea) =>
                {
                    var body = ea.Body.ToArray();
                    var message = Encoding.UTF8.GetString(body);
                    var @event = JsonSerializer.Deserialize<T>(message);

                    if (@event != null)
                    {
                        using (var scope = _serviceProvider.CreateScope())
                        {
                            var handler = scope.ServiceProvider.GetRequiredService<THandler>();
                            await handler.Handle(@event);
                        }
                    }
                };

                await _channel.BasicConsumeAsync(
                    queue: queueName,
                    autoAck: true,
                    consumer: consumer,
                    cancellationToken: stoppingToken
                );

                Console.WriteLine($"Listening to {_exchangeName}...");

                await Task.Delay(Timeout.Infinite, stoppingToken);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"RabbitMQ connection failed: {ex.Message}. Service will continue without messaging.");
            }
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            if (_channel != null) await _channel.CloseAsync(cancellationToken);
            if (_connection != null) await _connection.CloseAsync(cancellationToken);
            await base.StopAsync(cancellationToken);
        }
    }
}