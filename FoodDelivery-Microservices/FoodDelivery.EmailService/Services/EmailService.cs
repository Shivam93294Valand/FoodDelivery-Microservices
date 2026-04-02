using MailKit.Net.Smtp;
using MimeKit;
using FoodDelivery.EmailService.Models;
using FoodDelivery.EmailService.Data;
using FoodDelivery.EmailService.Templates;

namespace FoodDelivery.EmailService.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly EmailDbContext _dbContext;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, EmailDbContext dbContext, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _dbContext = dbContext;
            _logger = logger;
        }

        public async Task<bool> SendDeliveryAssignmentEmailAsync(string recipientEmail, string recipientName, int orderId, string restaurantName, string restaurantAddress, string deliveryAddress, DateTime estimatedDeliveryTime, decimal orderAmount)
        {
            var subject = $"New Delivery Assignment - Order #{orderId}";
            var htmlBody = EmailTemplates.GetDeliveryAssignmentTemplate(
                recipientName,
                orderId,
                restaurantName,
                restaurantAddress,
                deliveryAddress,
                estimatedDeliveryTime,
                orderAmount
            );

            return await SendEmailAsync(recipientEmail, recipientName, subject, htmlBody);
        }

        public async Task<bool> SendOrderConfirmationEmailAsync(string recipientEmail, string recipientName, int orderId, string restaurantName, decimal orderAmount, DateTime orderDate)
        {
            var subject = $"Order Confirmation - Order #{orderId}";
            var htmlBody = EmailTemplates.GetOrderConfirmationTemplate(
                recipientName,
                orderId,
                restaurantName,
                orderAmount,
                orderDate
            );

            // Temporarily set EmailType to OrderConfirmation inside SendEmailAsync logic or parameterize it
            // For now, I will modify SendEmailAsync to accept EmailType or just default it
            return await SendEmailAsync(recipientEmail, recipientName, subject, htmlBody);
        }

        public async Task<bool> SendOrderDeliveredEmailAsync(string recipientEmail, int orderId, string customerName)
        {
            var subject = $"Order Delivered - Order #{orderId}";
            var htmlBody = EmailTemplates.GetOrderDeliveredTemplate(
                customerName,
                orderId
            );

            return await SendEmailAsync(recipientEmail, customerName, subject, htmlBody);
        }

        public async Task<bool> SendEmailAsync(string recipientEmail, string recipientName, string subject, string htmlBody)
        {
            var emailLog = new EmailLog
            {
                RecipientEmail = recipientEmail,
                RecipientName = recipientName,
                Subject = subject,
                Body = htmlBody,
                IsSent = false,
                SentAt = DateTime.UtcNow,
                EmailType = "DeliveryAssignment"
            };

            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(_configuration["EmailSettings:SenderName"], _configuration["EmailSettings:SenderEmail"]));
                message.To.Add(new MailboxAddress(recipientName, recipientEmail));
                message.Subject = subject;

                var bodyBuilder = new BodyBuilder
                {
                    HtmlBody = htmlBody
                };
                message.Body = bodyBuilder.ToMessageBody();

                using (var client = new SmtpClient())
                {
                    // Connect to SMTP server
                    await client.ConnectAsync(
                        _configuration["EmailSettings:SmtpServer"], 
                        int.Parse(_configuration["EmailSettings:SmtpPort"]!),
                        MailKit.Security.SecureSocketOptions.StartTls
                    );

                    // Authenticate
                    await client.AuthenticateAsync(
                        _configuration["EmailSettings:Username"],
                        _configuration["EmailSettings:Password"]
                    );

                    // Send email
                    await client.SendAsync(message);
                    await client.DisconnectAsync(true);
                }

                emailLog.IsSent = true;
                _logger.LogInformation($"Email sent successfully to {recipientEmail}");
            }
            catch (Exception ex)
            {
                emailLog.IsSent = false;
                emailLog.ErrorMessage = ex.Message;
                _logger.LogError($"Failed to send email to {recipientEmail}: {ex.Message}");
            }

            // Log email to database
            await _dbContext.EmailLogs.AddAsync(emailLog);
            await _dbContext.SaveChangesAsync();

            return emailLog.IsSent;
        }
    }
}