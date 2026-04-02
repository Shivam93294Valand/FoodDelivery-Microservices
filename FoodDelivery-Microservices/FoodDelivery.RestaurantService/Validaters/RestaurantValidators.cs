using FluentValidation;
using FoodDelivery.RestaurantService.DTOs;

namespace FoodDelivery.RestaurantService.Validaters
{
    public class CreateRestaurantDtoValidator : AbstractValidator<CreateRestaurantDto>
    {
        public CreateRestaurantDtoValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty()
                .WithMessage("Restaurant name is required")
                .MaximumLength(200)
                .WithMessage("Restaurant name cannot exceed 200 characters");

            RuleFor(x => x.Description)
                .NotEmpty()
                .WithMessage("Description is required")
                .MaximumLength(1000)
                .WithMessage("Description cannot exceed 1000 characters");

            RuleFor(x => x.Address)
                .NotEmpty()
                .WithMessage("Address is required")
                .MaximumLength(500)
                .WithMessage("Address cannot exceed 500 characters");

            RuleFor(x => x.PhoneNumber)
                .NotEmpty()
                .WithMessage("Phone number is required")
                .Matches(@"^\+?[1-9]\d{1,14}$")
                .WithMessage("Invalid phone number format");

            RuleFor(x => x.Email)
                .NotEmpty()
                .WithMessage("Email is required")
                .EmailAddress()
                .WithMessage("Invalid email format");

            RuleFor(x => x.Cuisine)
                .NotEmpty()
                .WithMessage("Cuisine is required")
                .MaximumLength(100)
                .WithMessage("Cuisine cannot exceed 100 characters");

            RuleFor(x => x.Latitude)
                .InclusiveBetween(-90, 90)
                .WithMessage("Latitude must be between -90 and 90");

            RuleFor(x => x.Longitude)
                .InclusiveBetween(-180, 180)
                .WithMessage("Longitude must be between -180 and 180");
        }
    }

    public class UpdateRestaurantDtoValidator : AbstractValidator<UpdateRestaurantDto>
    {
        public UpdateRestaurantDtoValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty()
                .WithMessage("Restaurant name is required")
                .MaximumLength(200)
                .WithMessage("Restaurant name cannot exceed 200 characters");

            RuleFor(x => x.Description)
                .NotEmpty()
                .WithMessage("Description is required")
                .MaximumLength(1000)
                .WithMessage("Description cannot exceed 1000 characters");

            RuleFor(x => x.Address)
                .NotEmpty()
                .WithMessage("Address is required")
                .MaximumLength(500)
                .WithMessage("Address cannot exceed 500 characters");

            RuleFor(x => x.PhoneNumber)
                .NotEmpty()
                .WithMessage("Phone number is required")
                .Matches(@"^\+?[1-9]\d{1,14}$")
                .WithMessage("Invalid phone number format");

            RuleFor(x => x.Email)
                .NotEmpty()
                .WithMessage("Email is required")
                .EmailAddress()
                .WithMessage("Invalid email format");

            RuleFor(x => x.Cuisine)
                .NotEmpty()
                .WithMessage("Cuisine is required")
                .MaximumLength(100)
                .WithMessage("Cuisine cannot exceed 100 characters");

            RuleFor(x => x.Latitude)
                .InclusiveBetween(-90, 90)
                .WithMessage("Latitude must be between -90 and 90");

            RuleFor(x => x.Longitude)
                .InclusiveBetween(-180, 180)
                .WithMessage("Longitude must be between -180 and 180");
        }
    }

    public class CreateMenuItemDtoValidator : AbstractValidator<CreateMenuItemDto>
    {
        public CreateMenuItemDtoValidator()
        {
            RuleFor(x => x.RestaurantId)
                .GreaterThan(0)
                .WithMessage("Restaurant ID must be greater than 0");

            RuleFor(x => x.Name)
                .NotEmpty()
                .WithMessage("Menu item name is required")
                .MaximumLength(200)
                .WithMessage("Menu item name cannot exceed 200 characters");

            RuleFor(x => x.Description)
                .NotEmpty()
                .WithMessage("Description is required")
                .MaximumLength(1000)
                .WithMessage("Description cannot exceed 1000 characters");

            RuleFor(x => x.Price)
                .GreaterThan(0)
                .WithMessage("Price must be greater than 0")
                .LessThanOrEqualTo(100000)
                .WithMessage("Price cannot exceed 100,000");

            RuleFor(x => x.Category)
                .NotEmpty()
                .WithMessage("Category is required")
                .MaximumLength(100)
                .WithMessage("Category cannot exceed 100 characters");

            RuleFor(x => x.PreparationTime)
                .GreaterThan(0)
                .When(x => x.PreparationTime.HasValue)
                .WithMessage("Preparation time must be greater than 0");
        }
    }

    public class UpdateMenuItemDtoValidator : AbstractValidator<UpdateMenuItemDto>
    {
        public UpdateMenuItemDtoValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty()
                .WithMessage("Menu item name is required")
                .MaximumLength(200)
                .WithMessage("Menu item name cannot exceed 200 characters");

            RuleFor(x => x.Description)
                .NotEmpty()
                .WithMessage("Description is required")
                .MaximumLength(1000)
                .WithMessage("Description cannot exceed 1000 characters");

            RuleFor(x => x.Price)
                .GreaterThan(0)
                .WithMessage("Price must be greater than 0")
                .LessThanOrEqualTo(100000)
                .WithMessage("Price cannot exceed 100,000");

            RuleFor(x => x.Category)
                .NotEmpty()
                .WithMessage("Category is required")
                .MaximumLength(100)
                .WithMessage("Category cannot exceed 100 characters");

            RuleFor(x => x.PreparationTime)
                .GreaterThan(0)
                .When(x => x.PreparationTime.HasValue)
                .WithMessage("Preparation time must be greater than 0");
        }
    }
}
