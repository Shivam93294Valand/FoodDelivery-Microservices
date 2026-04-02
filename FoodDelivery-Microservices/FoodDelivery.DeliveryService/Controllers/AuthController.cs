using FoodDelivery.DeliveryService.Repositories;
using FoodDelivery.DeliveryService.DTOs;
using FoodDelivery.DeliveryService.Models;
using FoodDelivery.DeliveryService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FoodDelivery.DeliveryService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _auth;
        private readonly IDeliveryRequestRepository _repo;
        private readonly IPasswordResetService _passwordResetService;

        public AuthController(IAuthService auth, IDeliveryRequestRepository repo, IPasswordResetService passwordResetService)
        {
            _auth = auth;
            _repo = repo;
            _passwordResetService = passwordResetService;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            try
            {
                var result = await _auth.LoginAsync(dto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        [HttpPost("register")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Register([FromBody] DeliveryPerson person)
        {
            if (string.IsNullOrWhiteSpace(person.Password))
            {
                return BadRequest(new { message = "Password is required." });
            }

            person.Email = (person.Email ?? string.Empty).Trim().ToLowerInvariant();
            person.Password = BCrypt.Net.BCrypt.HashPassword((person.Password ?? string.Empty).Trim());
            person.JoinedDate = DateTime.UtcNow;
            await _repo.AddAsync(person);
            return Ok(person);
        }

        [AllowAnonymous]
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto forgotPasswordDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _passwordResetService.SendPasswordResetOtpAsync(forgotPasswordDto.Email);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [AllowAnonymous]
        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto verifyOtpDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _passwordResetService.VerifyOtpAsync(verifyOtpDto.Email, verifyOtpDto.Otp);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [AllowAnonymous]
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto resetPasswordDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _passwordResetService.ResetPasswordAsync(resetPasswordDto);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
    }
}