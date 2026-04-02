using MailKit.Net.Smtp;
using MimeKit;

namespace FoodDelivery.DeliveryService.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;
        private readonly IHostEnvironment _hostEnvironment;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger, IHostEnvironment hostEnvironment)
        {
            _configuration = configuration;
            _logger = logger;
            _hostEnvironment = hostEnvironment;
        }

        public async Task SendOrderDeliveredEmailAsync(string customerEmail, int orderId, string customerName)
        {
            try
            {
                var enableEmails = bool.Parse(_configuration["Email:EnableEmails"] ?? "true");
                
                if (!enableEmails)
                {
                    _logger?.LogInformation($"[EMAIL DISABLED] Would send delivery confirmation to {customerEmail} for order {orderId}");
                    // Simulate the email with a console log
                    Console.WriteLine($"\n========== EMAIL (Disabled in Dev) ==========");
                    Console.WriteLine($"To: {customerEmail} ({customerName})");
                    Console.WriteLine($"Subject: Order #{orderId} Delivered Successfully!");
                    Console.WriteLine($"Body: Your order #{orderId} has been successfully delivered.");
                    Console.WriteLine($"=============================================\n");
                    return;
                }

                var message = new MimeMessage();
                message.From.Add(new MailboxAddress("Food Delivery Service", _configuration["Email:From"] ?? "noreply@fooddelivery.com"));
                message.To.Add(new MailboxAddress(customerName, customerEmail));
                message.Subject = $"Order #{orderId} Delivered Successfully!";

                var bodyBuilder = new BodyBuilder
                {
                    HtmlBody = $@"
                        <html>
                        <body style='font-family: Arial, sans-serif;'>
                            <h2 style='color: #4CAF50;'>Order Delivered!</h2>
                            <p>Dear {customerName},</p>
                            <p>Your order <strong>#{orderId}</strong> has been successfully delivered.</p>
                            <p>We hope you enjoy your meal!</p>
                            <br/>
                            <p>Thank you for choosing our service.</p>
                            <p style='color: #666;'>- Food Delivery Team</p>
                        </body>
                        </html>
                    ",
                    TextBody = $"Dear {customerName},\n\nYour order #{orderId} has been successfully delivered.\n\nWe hope you enjoy your meal!\n\nThank you for choosing our service.\n\n- Food Delivery Team"
                };

                message.Body = bodyBuilder.ToMessageBody();

                using var client = new SmtpClient();
                
                // For development, you can use a fake SMTP server like Papercut or configure real SMTP
                var smtpHost = _configuration["Email:SmtpHost"] ?? "localhost";
                var smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "25");
                var smtpUser = _configuration["Email:SmtpUser"];
                var smtpPass = _configuration["Email:SmtpPassword"];

                await client.ConnectAsync(smtpHost, smtpPort, MailKit.Security.SecureSocketOptions.Auto);

                if (!string.IsNullOrEmpty(smtpUser) && !string.IsNullOrEmpty(smtpPass))
                {
                    await client.AuthenticateAsync(smtpUser, smtpPass);
                }

                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                _logger?.LogInformation($"Email sent successfully to {customerEmail} for order {orderId}");
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, $"Failed to send email to {customerEmail} for order {orderId}");
                // Don't throw - email failure shouldn't break delivery flow
            }
        }

        public async Task<bool> SendDeliveryOtpEmailAsync(string customerEmail, string customerName, int orderId, int deliveryId, string otp, DateTime expiresAt)
        {
            var allowDevFallback = bool.Parse(_configuration["Email:AllowDevFallback"] ?? "false");

            try
            {
                var enableEmails = bool.Parse(_configuration["Email:EnableEmails"] ?? "true");

                if (!enableEmails)
                {
                    _logger?.LogInformation("[EMAIL DISABLED] OTP for delivery {DeliveryId}, order {OrderId}, customer {Email}: {Otp} (expires {ExpiresAt:u})",
                        deliveryId, orderId, customerEmail, otp, expiresAt);
                    Console.WriteLine("\n========== OTP EMAIL (Disabled in Dev) ==========");
                    Console.WriteLine($"To: {customerEmail} ({customerName})");
                    Console.WriteLine($"Subject: Delivery OTP for Order #{orderId}");
                    Console.WriteLine($"OTP: {otp} (expires at {expiresAt:u})");
                    Console.WriteLine("=================================================\n");
                    return true;
                }

                var message = new MimeMessage();
                message.From.Add(new MailboxAddress("Food Delivery Service", _configuration["Email:From"] ?? "noreply@fooddelivery.com"));
                message.To.Add(new MailboxAddress(customerName, customerEmail));
                message.Subject = $"Delivery OTP for Order #{orderId}";

                var bodyBuilder = new BodyBuilder
                {
                    HtmlBody = $@"
                        <html>
                        <body style='font-family: Arial, sans-serif;'>
                            <h2 style='color: #2563eb;'>Delivery OTP Verification</h2>
                            <p>Dear {customerName},</p>
                            <p>Your order <strong>#{orderId}</strong> is ready to be handed over.</p>
                            <p>Please share this OTP with the delivery partner to complete delivery:</p>
                            <p style='font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #111827;'>{otp}</p>
                            <p>This OTP expires at <strong>{expiresAt:u}</strong>.</p>
                            <p>If you did not request this, please contact support.</p>
                            <br/>
                            <p style='color: #666;'>- Food Delivery Team</p>
                        </body>
                        </html>
                    ",
                    TextBody = $"Dear {customerName},\n\nPlease share this OTP with the delivery partner for order #{orderId}: {otp}\n\nThis OTP expires at {expiresAt:u}.\n\n- Food Delivery Team"
                };

                message.Body = bodyBuilder.ToMessageBody();

                using var client = new SmtpClient();
                var smtpHost = (_configuration["Email:SmtpHost"] ?? "localhost").Trim();
                var smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "25");
                var smtpUser = _configuration["Email:SmtpUser"]?.Trim();
                var smtpPass = _configuration["Email:SmtpPassword"]?.Trim();

                var socketOptions = smtpPort == 587
                    ? MailKit.Security.SecureSocketOptions.StartTls
                    : MailKit.Security.SecureSocketOptions.Auto;

                await client.ConnectAsync(smtpHost, smtpPort, socketOptions);

                if (!string.IsNullOrEmpty(smtpUser) && !string.IsNullOrEmpty(smtpPass))
                {
                    await client.AuthenticateAsync(smtpUser, smtpPass);
                }

                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                _logger?.LogInformation("OTP email sent successfully to {Email} for delivery {DeliveryId}", customerEmail, deliveryId);
                return true;
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Failed to send OTP email to {Email} for delivery {DeliveryId}", customerEmail, deliveryId);

                if (_hostEnvironment.IsDevelopment() && allowDevFallback)
                {
                    _logger?.LogWarning("SMTP failed in development. Falling back to dev OTP output for delivery {DeliveryId}", deliveryId);
                    Console.WriteLine("\n========== OTP EMAIL FALLBACK (Development) ==========");
                    Console.WriteLine($"To: {customerEmail} ({customerName})");
                    Console.WriteLine($"Order: #{orderId} | Delivery: #{deliveryId}");
                    Console.WriteLine($"OTP: {otp} (expires at {expiresAt:u})");
                    Console.WriteLine("=====================================================\n");
                    return true;
                }

                return false;
            }
        }

        public async Task<bool> SendPasswordResetOtpEmailAsync(string email, string recipientName, string otp, DateTime expiresAt)
        {
            var allowDevFallback = bool.Parse(_configuration["Email:AllowDevFallback"] ?? "false");

            try
            {
                var enableEmails = bool.Parse(_configuration["Email:EnableEmails"] ?? "true");

                if (!enableEmails)
                {
                    _logger?.LogInformation("[EMAIL DISABLED] Password reset OTP for {Email}: {Otp} (expires {ExpiresAt:u})",
                        email, otp, expiresAt);
                    Console.WriteLine("\n========== PASSWORD RESET OTP (Disabled in Dev) ==========");
                    Console.WriteLine($"To: {email} ({recipientName})");
                    Console.WriteLine($"OTP: {otp} (expires at {expiresAt:u})");
                    Console.WriteLine("=========================================================");
                    return true;
                }

                var message = new MimeMessage();
                message.From.Add(new MailboxAddress("Food Delivery Service", _configuration["Email:From"] ?? "noreply@fooddelivery.com"));
                message.To.Add(new MailboxAddress(recipientName, email));
                message.Subject = "Password Reset OTP";

                var bodyBuilder = new BodyBuilder
                {
                    HtmlBody = $@"
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                            .header {{ background: linear-gradient(135deg, #f43f5e 0%, #fb923c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                            .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                            .otp-box {{ background: white; border: 2px dashed #f43f5e; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }}
                            .otp {{ font-size: 32px; font-weight: bold; color: #f43f5e; letter-spacing: 5px; }}
                            .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }}
                        </style>
                    </head>
                    <body>
                        <div class='container'>
                            <div class='header'>
                                <h1>Password Reset Request</h1>
                            </div>
                            <div class='content'>
                                <p>Hi {recipientName},</p>
                                <p>We received a request to reset your password. Use the OTP below to proceed:</p>
                                <div class='otp-box'>
                                    <div class='otp'>{otp}</div>
                                </div>
                                <p><strong>This OTP will expire in 10 minutes.</strong></p>
                                <p>If you didn't request this password reset, please ignore this email.</p>
                                <p>Best regards,<br>Food Delivery Team</p>
                            </div>
                            <div class='footer'>
                                <p>This is an automated email. Please do not reply.</p>
                            </div>
                        </div>
                    </body>
                    </html>",
                    TextBody = $"Hi {recipientName},\n\nYour OTP to reset password is: {otp}\nThis OTP expires at {expiresAt:u}.\n\n- Food Delivery Team"
                }; 

                message.Body = bodyBuilder.ToMessageBody();

                using var client = new SmtpClient();
                var smtpHost = (_configuration["Email:SmtpHost"] ?? "localhost").Trim();
                var smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "25");
                var smtpUser = _configuration["Email:SmtpUser"]?.Trim();
                var smtpPass = _configuration["Email:SmtpPassword"]?.Trim();

                var socketOptions = smtpPort == 587
                    ? MailKit.Security.SecureSocketOptions.StartTls
                    : MailKit.Security.SecureSocketOptions.Auto;

                await client.ConnectAsync(smtpHost, smtpPort, socketOptions);

                if (!string.IsNullOrEmpty(smtpUser) && !string.IsNullOrEmpty(smtpPass))
                {
                    await client.AuthenticateAsync(smtpUser, smtpPass);
                }

                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                _logger?.LogInformation("Password reset OTP email sent successfully to {Email}", email);
                return true;
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Failed to send password reset OTP email to {Email}", email);

                if (_hostEnvironment.IsDevelopment() && allowDevFallback)
                {
                    Console.WriteLine("\n========== PASSWORD RESET OTP FALLBACK (Development) ==========");
                    Console.WriteLine($"To: {email} ({recipientName})");
                    Console.WriteLine($"OTP: {otp} (expires at {expiresAt:u})");
                    Console.WriteLine("===============================================================\n");
                    return true;
                }

                return false;
            }
        }
    }
}
