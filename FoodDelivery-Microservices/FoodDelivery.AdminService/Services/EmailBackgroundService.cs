using MailKit.Net.Smtp;
using MimeKit;

namespace FoodDelivery.AdminService.Services
{
    public class EmailBackgroundService : IEmailBackgroundService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailBackgroundService> _logger;

        public EmailBackgroundService(IConfiguration configuration, ILogger<EmailBackgroundService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendPasswordResetOtpEmailAsync(string email, string userName, string otp)
        {
            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(
                    _configuration["EmailSettings:SenderName"] ?? "Food Delivery",
                    _configuration["EmailSettings:SenderEmail"] ?? "noreply@fooddelivery.com"));
                message.To.Add(new MailboxAddress(userName, email));
                message.Subject = "Password Reset OTP - Food Delivery";

                var htmlBody = $@"
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
                                <p>Hi {userName},</p>
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
                    </html>";

                var bodyBuilder = new BodyBuilder { HtmlBody = htmlBody };
                message.Body = bodyBuilder.ToMessageBody();

                using var client = new SmtpClient();
                await client.ConnectAsync(
                    _configuration["EmailSettings:SmtpServer"] ?? "smtp.gmail.com",
                    int.Parse(_configuration["EmailSettings:SmtpPort"] ?? "587"),
                    MailKit.Security.SecureSocketOptions.StartTls);

                await client.AuthenticateAsync(
                    _configuration["EmailSettings:Username"],
                    _configuration["EmailSettings:Password"]);

                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                _logger.LogInformation($"Password reset OTP email sent successfully to {email}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to send password reset OTP email to {email}: {ex.Message}");
                throw;
            }
        }
    }
}
