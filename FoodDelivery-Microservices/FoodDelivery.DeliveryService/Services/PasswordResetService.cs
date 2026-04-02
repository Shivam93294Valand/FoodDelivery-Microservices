using FoodDelivery.DeliveryService.Data;
using FoodDelivery.DeliveryService.DTOs;
using FoodDelivery.DeliveryService.Models;
using FoodDelivery.DeliveryService.Repositories;
using Microsoft.EntityFrameworkCore;
using Hangfire;

namespace FoodDelivery.DeliveryService.Services
{
    public class PasswordResetService : IPasswordResetService
    {
        private readonly IDeliveryRequestRepository _repository;
        private readonly DeliveryDbContext _dbContext;
        private readonly IEmailService _emailService;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly ILogger<PasswordResetService> _logger;

    public PasswordResetService(
        IDeliveryRequestRepository repository,
        DeliveryDbContext dbContext,
        IEmailService emailService,
        IBackgroundJobClient backgroundJobClient,
        ILogger<PasswordResetService> logger)
    {
        _repository = repository;
        _dbContext = dbContext;
        _emailService = emailService;
        _backgroundJobClient = backgroundJobClient;
        }

        public async Task<ApiResponse> SendPasswordResetOtpAsync(string email)
        {
            var normalizedEmail = (email ?? string.Empty).Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(normalizedEmail))
            {
                return new ApiResponse
                {
                    Success = false,
                    Message = "Email is required."
                };
            }

            var deliveryPerson = await _repository.GetByEmailAsync(normalizedEmail)
                ?? await _repository.GetByEmailAsync(email);

            if (deliveryPerson == null)
            {
                return new ApiResponse
                {
                    Success = false,
                    Message = "No account found with this email address."
                };
            }

            var otp = new Random().Next(100000, 999999).ToString();
            var otpEntry = new PasswordResetOtp
            {
                Email = normalizedEmail,
                Otp = otp,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMinutes(10),
                IsUsed = false
            };

            _dbContext.PasswordResetOtps.Add(otpEntry);
            await _dbContext.SaveChangesAsync();

            var fullName = string.Join(' ', new[] { deliveryPerson.FirstName, deliveryPerson.LastName }.Where(x => !string.IsNullOrWhiteSpace(x))).Trim();
            var recipientName = string.IsNullOrWhiteSpace(fullName) ? "Delivery Partner" : fullName;

            // Send OTP via email using Hangfire (Fire and Forget)
            if (_backgroundJobClient != null)
            {
                _backgroundJobClient.Enqueue<IEmailBackgroundService>(x =>
                    x.SendPasswordResetOtpEmailAsync(normalizedEmail, recipientName, otp));
            }
            else
            {
                // best-effort fallback
                try
                {
                    await _emailService.SendPasswordResetOtpEmailAsync(normalizedEmail, recipientName, otp, otpEntry.ExpiresAt);
                }
                catch { /* swallow */ }
            }

            _logger?.LogInformation("Password reset OTP generated for delivery account {Email}", normalizedEmail);

            return new ApiResponse
            {
                Success = true,
                Message = "OTP has been sent to your email address."
            };
        }

        public async Task<ApiResponse> VerifyOtpAsync(string email, string otp)
        {
            var normalizedEmail = (email ?? string.Empty).Trim().ToLowerInvariant();
            var otpValue = (otp ?? string.Empty).Trim();

            var otpRecord = await _dbContext.PasswordResetOtps
                .Where(x => x.Email == normalizedEmail && x.Otp == otpValue && !x.IsUsed)
                .OrderByDescending(x => x.CreatedAt)
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
            var normalizedEmail = (resetPasswordDto.Email ?? string.Empty).Trim().ToLowerInvariant();

            var verifyResult = await VerifyOtpAsync(normalizedEmail, resetPasswordDto.Otp);
            if (!verifyResult.Success)
            {
                return verifyResult;
            }

            var deliveryPerson = await _repository.GetByEmailAsync(normalizedEmail)
                ?? await _repository.GetByEmailAsync(resetPasswordDto.Email);

            if (deliveryPerson == null)
            {
                return new ApiResponse
                {
                    Success = false,
                    Message = "User not found."
                };
            }

            deliveryPerson.Password = BCrypt.Net.BCrypt.HashPassword(resetPasswordDto.NewPassword);
            await _repository.UpdateAsync(deliveryPerson);

            var otpRecord = await _dbContext.PasswordResetOtps
                .Where(x => x.Email == normalizedEmail && x.Otp == resetPasswordDto.Otp && !x.IsUsed)
                .OrderByDescending(x => x.CreatedAt)
                .FirstOrDefaultAsync();

            if (otpRecord != null)
            {
                otpRecord.IsUsed = true;
                await _dbContext.SaveChangesAsync();
            }

            _logger?.LogInformation("Password reset successful for delivery account {Email}", normalizedEmail);

            return new ApiResponse
            {
                Success = true,
                Message = "Password has been reset successfully."
            };
        }
    }
}