using FluentValidation;
using FoodDelivery.CustomerService.DTOs;

namespace FoodDelivery.CustomerService.Validaters
{
    public class CreateAddressDtoValidator : AbstractValidator<CreateAddressDto>
    {
        public CreateAddressDtoValidator()
        {
            RuleFor(x => x.AddressLine1)
                .NotEmpty()
                .WithMessage("Address line 1 is required")
                .MaximumLength(200)
                .WithMessage("Address line 1 cannot exceed 200 characters");

            RuleFor(x => x.City)
                .NotEmpty()
                .WithMessage("City is required")
                .MaximumLength(100)
                .WithMessage("City cannot exceed 100 characters");

            RuleFor(x => x.State)
                .NotEmpty()
                .WithMessage("State is required")
                .MaximumLength(100)
                .WithMessage("State cannot exceed 100 characters");

            RuleFor(x => x.PostalCode)
                .NotEmpty()
                .WithMessage("Postal code is required")
                .MaximumLength(20)
                .WithMessage("Postal code cannot exceed 20 characters");

            RuleFor(x => x.Country)
                .NotEmpty()
                .WithMessage("Country is required")
                .MaximumLength(100)
                .WithMessage("Country cannot exceed 100 characters");

            RuleFor(x => x.Latitude)
                .InclusiveBetween(-90, 90)
                .WithMessage("Latitude must be between -90 and 90");

            RuleFor(x => x.Longitude)
                .InclusiveBetween(-180, 180)
                .WithMessage("Longitude must be between -180 and 180");

            RuleFor(x => x.AddressType)
                .NotEmpty()
                .WithMessage("Address type is required")
                .Must(type => new[] { "Home", "Work", "Other" }.Contains(type))
                .WithMessage("Address type must be Home, Work, or Other");
        }
    }

    public class UpdateAddressDtoValidator : AbstractValidator<UpdateAddressDto>
    {
        public UpdateAddressDtoValidator()
        {
            RuleFor(x => x.AddressLine1)
                .MaximumLength(200)
                .When(x => x.AddressLine1 != null)
                .WithMessage("Address line 1 cannot exceed 200 characters");

            RuleFor(x => x.City)
                .MaximumLength(100)
                .When(x => x.City != null)
                .WithMessage("City cannot exceed 100 characters");

            RuleFor(x => x.State)
                .MaximumLength(100)
                .When(x => x.State != null)
                .WithMessage("State cannot exceed 100 characters");

            RuleFor(x => x.PostalCode)
                .MaximumLength(20)
                .When(x => x.PostalCode != null)
                .WithMessage("Postal code cannot exceed 20 characters");

            RuleFor(x => x.Country)
                .MaximumLength(100)
                .When(x => x.Country != null)
                .WithMessage("Country cannot exceed 100 characters");

            RuleFor(x => x.Latitude)
                .InclusiveBetween(-90, 90)
                .When(x => x.Latitude.HasValue)
                .WithMessage("Latitude must be between -90 and 90");

            RuleFor(x => x.Longitude)
                .InclusiveBetween(-180, 180)
                .When(x => x.Longitude.HasValue)
                .WithMessage("Longitude must be between -180 and 180");

            RuleFor(x => x.AddressType)
                .Must(type => new[] { "Home", "Work", "Other" }.Contains(type))
                .When(x => x.AddressType != null)
                .WithMessage("Address type must be Home, Work, or Other");
        }
    }
}
