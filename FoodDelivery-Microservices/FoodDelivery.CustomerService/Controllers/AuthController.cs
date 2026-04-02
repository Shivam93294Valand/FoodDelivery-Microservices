using FoodDelivery.CustomerService.DTOs;
using FoodDelivery.CustomerService.Services;
using FoodDelivery.CustomerService.Repositories;
using FoodDelivery.Common.Messaging;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;

namespace FoodDelivery.CustomerService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [EnableRateLimiting("auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IOtpService _otpService;
        private readonly ICustomerRequestRepository _customerRepository;
        private readonly IPasswordResetService _passwordResetService;

        public AuthController(IAuthService authService, IOtpService otpService, ICustomerRequestRepository customerRepository, IPasswordResetService passwordResetService)
        {
            _authService = authService;
            _otpService = otpService;
            _customerRepository = customerRepository;
            _passwordResetService = passwordResetService;
        }

        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto registerDto)
        {
            try
            {
                var result = await _authService.RegisterAsync(registerDto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto loginDto)
        {
            try
            {
                var result = await _authService.LoginAsync(loginDto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
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
