using FluentValidation;
using FoodDelivery.AdminService.DTOs;

namespace FoodDelivery.AdminService.Validaters
{
    public class LoginDtoValidator : AbstractValidator<LoginDto>
    {
        public LoginDtoValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty()
                .WithMessage("Email is required")
                .EmailAddress()
                .WithMessage("Invalid email format");

            RuleFor(x => x.Password)
                .NotEmpty()
                .WithMessage("Password is required");
        }
    }

    public class RegisterDtoValidator : AbstractValidator<RegisterDto>
    {
        public RegisterDtoValidator()
        {
            RuleFor(x => x.FirstName)
                .NotEmpty()
                .WithMessage("First name is required")
                .MaximumLength(100)
                .WithMessage("First name cannot exceed 100 characters");

            RuleFor(x => x.LastName)
                .NotEmpty()
                .WithMessage("Last name is required")
                .MaximumLength(100)
                .WithMessage("Last name cannot exceed 100 characters");

            RuleFor(x => x.Email)
                .NotEmpty()
                .WithMessage("Email is required")
                .EmailAddress()
                .WithMessage("Invalid email format");

            RuleFor(x => x.Password)
                .NotEmpty()
                .WithMessage("Password is required")
                .MinimumLength(6)
                .WithMessage("Password must be at least 6 characters");

            RuleFor(x => x.ConfirmPassword)
                .NotEmpty()
                .WithMessage("Confirm password is required")
                .Equal(x => x.Password)
                .WithMessage("Passwords do not match");

            RuleFor(x => x.PhoneNumber)
                .Matches(@"^\+?[1-9]\d{1,14}$")
                .When(x => !string.IsNullOrEmpty(x.PhoneNumber))
                .WithMessage("Invalid phone number format");

            RuleFor(x => x.Role)
                .NotEmpty()
                .WithMessage("Role is required");
        }
    }

    public class CreateDeliveryPersonDtoValidator : AbstractValidator<CreateDeliveryPersonDto>
    {
        public CreateDeliveryPersonDtoValidator()
        {
            RuleFor(x => x.FirstName)
                .NotEmpty()
                .WithMessage("First name is required");

            RuleFor(x => x.LastName)
                .NotEmpty()
                .WithMessage("Last name is required");

            RuleFor(x => x.Email)
                .NotEmpty()
                .WithMessage("Email is required")
                .EmailAddress()
                .WithMessage("Invalid email format");

            RuleFor(x => x.PhoneNumber)
                .NotEmpty()
                .WithMessage("Phone number is required")
                .Matches(@"^\+?[1-9]\d{1,14}$")
                .WithMessage("Invalid phone number format");
        }
    }
}
