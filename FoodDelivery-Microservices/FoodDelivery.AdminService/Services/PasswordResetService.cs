using FoodDelivery.AdminService.Data;
using FoodDelivery.AdminService.DTOs;
using FoodDelivery.AdminService.Models;
using FoodDelivery.AdminService.Repositories;
using Hangfire;
using Microsoft.EntityFrameworkCore;

namespace FoodDelivery.AdminService.Services
{
    public class PasswordResetService : IPasswordResetService
    {
        private readonly AdminDbContext _context;
        private readonly IUserRepository _userRepository;
        private readonly IBackgroundJobClient _backgroundJobClient;
        private readonly ILogger<PasswordResetService> _logger;
        private readonly IConfiguration _configuration;

        public PasswordResetService(
            AdminDbContext context,
            IUserRepository userRepository,
            IBackgroundJobClient backgroundJobClient,
            ILogger<PasswordResetService> logger,
            IConfiguration configuration)
        {
            _context = context;
            _userRepository = userRepository;
            _backgroundJobClient = backgroundJobClient;
            _logger = logger;
            _configuration = configuration;
        }

        private void EnsureConnectionStringConfigured()
        {
            var connection = _context.Database.GetDbConnection();
            if (!string.IsNullOrWhiteSpace(connection.ConnectionString))
            {
                return;
            }

            var fallbackConnection = _configuration.GetConnectionString("DefaultConnection");

            if (string.IsNullOrWhiteSpace(fallbackConnection))
            {
                fallbackConnection = "Server=(localdb)\\MSSQLLocalDB;Database=FoodDelivery_AdminDB;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True";
            }

            if (connection.State != System.Data.ConnectionState.Closed)
            {
                connection.Close();
            }

            connection.ConnectionString = fallbackConnection;
            _context.Database.SetConnectionString(fallbackConnection);
            _logger.LogWarning("AdminService DbContext connection string was empty. Applied fallback DefaultConnection.");
        }

        public async Task<ApiResponse> SendPasswordResetOtpAsync(string email)
        {
            EnsureConnectionStringConfigured();

            var normalizedEmail = (email ?? string.Empty).Trim().ToLower();
            var user = await _userRepository.GetByEmailAsync(normalizedEmail);
            if (user == null)
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

            await _context.PasswordResetOtps.AddAsync(passwordResetOtp);
            await _context.SaveChangesAsync();

            // Send OTP via email using Hangfire (Fire and Forget)
            _backgroundJobClient.Enqueue<IEmailBackgroundService>(x => 
                x.SendPasswordResetOtpEmailAsync(normalizedEmail, user.FirstName, otp));

            _logger.LogInformation($"Password reset OTP generated for {normalizedEmail}");

            return new ApiResponse
            {
                Success = true,
                Message = "OTP has been sent to your email address."
            };
        }

        public async Task<ApiResponse> VerifyOtpAsync(string email, string otp)
        {
            EnsureConnectionStringConfigured();

            var normalizedEmail = (email ?? string.Empty).Trim().ToLower();
            var otpRecord = await _context.PasswordResetOtps
                .Where(o => o.Email == normalizedEmail && o.Otp == otp && !o.IsUsed)
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefaultAsync();

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
            EnsureConnectionStringConfigured();

            var normalizedEmail = (resetPasswordDto.Email ?? string.Empty).Trim().ToLower();

            // Verify OTP first
            var verifyResult = await VerifyOtpAsync(normalizedEmail, resetPasswordDto.Otp);
            if (!verifyResult.Success)
            {
                return verifyResult;
            }

            // Get user
            var user = await _userRepository.GetByEmailAsync(normalizedEmail);
            if (user == null)
            {
                return new ApiResponse
                {
                    Success = false,
                    Message = "User not found."
                };
            }
            user.PasswordHash = PasswordHasher.Hash(resetPasswordDto.NewPassword);
            await _userRepository.UpdateAsync(user);

            // Mark OTP as used
            var otpRecord = await _context.PasswordResetOtps
                .Where(o => o.Email == normalizedEmail && o.Otp == resetPasswordDto.Otp && !o.IsUsed)
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefaultAsync();

            if (otpRecord != null)
            {
                otpRecord.IsUsed = true;
                await _context.SaveChangesAsync();
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
