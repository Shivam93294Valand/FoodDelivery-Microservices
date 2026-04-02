using FoodDelivery.CustomerService.DTOs;
using FoodDelivery.CustomerService.Models;
using FoodDelivery.CustomerService.Repositories;
using Dapper;
using Hangfire;
using Microsoft.Data.SqlClient;

namespace FoodDelivery.CustomerService.Services
{
    public class PasswordResetService : IPasswordResetService
    {
        private readonly ICustomerRequestRepository _customerRepository;
        private readonly IBackgroundJobClient _backgroundJobClient;
        private readonly ILogger<PasswordResetService> _logger;
        private readonly IConfiguration _configuration;

        public PasswordResetService(
            ICustomerRequestRepository customerRepository,
            IBackgroundJobClient backgroundJobClient,
            ILogger<PasswordResetService> logger,
            IConfiguration configuration)
        {
            _customerRepository = customerRepository;
            _backgroundJobClient = backgroundJobClient;
            _logger = logger;
            _configuration = configuration;
        }

        private string GetEffectiveConnectionString()
        {
            var fallbackConnection = _configuration.GetConnectionString("DefaultConnection")
                ?? _configuration["ConnectionStrings:DefaultConnection"];

            if (string.IsNullOrWhiteSpace(fallbackConnection))
            {
                fallbackConnection = "Server=(localdb)\\MSSQLLocalDB;Database=FoodDelivery_CustomerDB;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True";
            }

            return fallbackConnection;
        }

        public async Task<ApiResponse> SendPasswordResetOtpAsync(string email)
        {
            var normalizedEmail = (email ?? string.Empty).Trim().ToLower();
            var customer = await _customerRepository.GetByEmailAsync(normalizedEmail);
            if (customer == null)
            {
                return new ApiResponse
                {
                    Success = false,
                    Message = "No account found with this email address."
                };
            }

            // Generate 6-digit OTP
            var otp = new Random().Next(100000, 999999).ToString();

            // Save OTP to database
            var passwordResetOtp = new PasswordResetOtp
            {
                Email = normalizedEmail,
                Otp = otp,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMinutes(10),
                IsUsed = false
            };

            var connectionString = GetEffectiveConnectionString();
            using (var connection = new SqlConnection(connectionString))
            {
                await connection.OpenAsync();
                const string insertSql = @"
INSERT INTO PasswordResetOtps (Email, Otp, CreatedAt, ExpiresAt, IsUsed)
VALUES (@Email, @Otp, @CreatedAt, @ExpiresAt, @IsUsed);";

                await connection.ExecuteAsync(insertSql, new
                {
                    passwordResetOtp.Email,
                    passwordResetOtp.Otp,
                    passwordResetOtp.CreatedAt,
                    passwordResetOtp.ExpiresAt,
                    passwordResetOtp.IsUsed
                });
            }

            // Send OTP via email using Hangfire (Fire and Forget)
            _backgroundJobClient.Enqueue<IEmailBackgroundService>(x => 
                x.SendPasswordResetOtpEmailAsync(normalizedEmail, customer.FirstName, otp));

            _logger.LogInformation($"Password reset OTP generated for {normalizedEmail}");

            return new ApiResponse
            {
                Success = true,
                Message = "OTP has been sent to your email address."
            };
        }

        public async Task<ApiResponse> VerifyOtpAsync(string email, string otp)
        {
            var normalizedEmail = (email ?? string.Empty).Trim().ToLower();
            PasswordResetOtp? otpRecord;

            var connectionString = GetEffectiveConnectionString();
            using (var connection = new SqlConnection(connectionString))
            {
                await connection.OpenAsync();
                const string verifySql = @"
SELECT TOP 1 Id, Email, Otp, CreatedAt, ExpiresAt, IsUsed
FROM PasswordResetOtps
WHERE Email = @Email AND Otp = @Otp AND IsUsed = 0
ORDER BY CreatedAt DESC;";

                otpRecord = await connection.QueryFirstOrDefaultAsync<PasswordResetOtp>(verifySql, new
                {
                    Email = normalizedEmail,
                    Otp = otp
                });
            }

            if (otpRecord == null)
            {
                return new ApiResponse
                {
                    Success = false,
                    Message = "Invalid OTP."
                };
            }

            if (otpRecord.ExpiresAt < DateTime.UtcNow)
            {
                return new ApiResponse
                {
                    Success = false,
                    Message = "OTP has expired. Please request a new one."
                };
            }

            return new ApiResponse
            {
                Success = true,
                Message = "OTP verified successfully."
            };
        }

        public async Task<ApiResponse> ResetPasswordAsync(ResetPasswordDto resetPasswordDto)
        {
            var normalizedEmail = (resetPasswordDto.Email ?? string.Empty).Trim().ToLower();

            // Verify OTP first
            var verifyResult = await VerifyOtpAsync(normalizedEmail, resetPasswordDto.Otp);
            if (!verifyResult.Success)
            {
                return verifyResult;
            }

            // Get customer
            var customer = await _customerRepository.GetByEmailAsync(normalizedEmail);
            if (customer == null)
            {
                return new ApiResponse
                {
                    Success = false,
                    Message = "User not found."
                };
            }
            customer.Password = BCrypt.Net.BCrypt.HashPassword(resetPasswordDto.NewPassword);
            await _customerRepository.UpdateRequestAsync(customer);

            // Mark OTP as used
            var connectionString = GetEffectiveConnectionString();
            using (var connection = new SqlConnection(connectionString))
            {
                await connection.OpenAsync();
                const string updateSql = @"
UPDATE PasswordResetOtps
SET IsUsed = 1
WHERE Id = (
    SELECT TOP 1 Id
    FROM PasswordResetOtps
    WHERE Email = @Email AND Otp = @Otp AND IsUsed = 0
    ORDER BY CreatedAt DESC
);";

                await connection.ExecuteAsync(updateSql, new
                {
                    Email = normalizedEmail,
                    Otp = resetPasswordDto.Otp
                });
            }

            _logger.LogInformation($"Password reset successful for {normalizedEmail}");

            return new ApiResponse
            {
                Success = true,
                Message = "Password has been reset successfully."
            };
        }
    }
}
