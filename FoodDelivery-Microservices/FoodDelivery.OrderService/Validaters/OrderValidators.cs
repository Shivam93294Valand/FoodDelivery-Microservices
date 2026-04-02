using FluentValidation;
using FoodDelivery.OrderService.DTOs;

namespace FoodDelivery.OrderService.Validaters
{
    public class CreateOrderDtoValidator : AbstractValidator<CreateOrderDto>
    {
        public CreateOrderDtoValidator()
        {
            RuleFor(x => x.CustomerId)
                .GreaterThan(0)
                .WithMessage("Customer ID must be greater than 0");

            RuleFor(x => x.RestaurantId)
                .GreaterThan(0)
                .WithMessage("Restaurant ID must be greater than 0");

            RuleFor(x => x.DeliveryAddressId)
                .GreaterThan(0)
                .WithMessage("Delivery address ID must be greater than 0");

            RuleFor(x => x.PaymentMethod)
                .NotEmpty()
                .WithMessage("Payment method is required")
                .Must(pm => new[] { "Cash", "Card", "UPI" }.Contains(pm))
                .WithMessage("Payment method must be Cash, Card, or UPI");

            RuleFor(x => x.SpecialInstructions)
                .MaximumLength(500)
                .When(x => !string.IsNullOrEmpty(x.SpecialInstructions))
                .WithMessage("Special instructions cannot exceed 500 characters");

            RuleFor(x => x.Items)
                .NotEmpty()
                .WithMessage("Order must contain at least one item")
                .Must(items => items != null && items.Count > 0)
                .WithMessage("Order must contain at least one item");

            RuleForEach(x => x.Items)
                .SetValidator(new CreateOrderItemDtoValidator());
        }
    }

    public class CreateOrderItemDtoValidator : AbstractValidator<CreateOrderItemDto>
    {
        public CreateOrderItemDtoValidator()
        {
            RuleFor(x => x.MenuItemId)
                .GreaterThan(0)
                .WithMessage("Menu item ID must be greater than 0");

            RuleFor(x => x.Quantity)
                .GreaterThan(0)
                .WithMessage("Quantity must be greater than 0")
                .LessThanOrEqualTo(100)
                .WithMessage("Quantity cannot exceed 100");

            RuleFor(x => x.SpecialInstructions)
                .MaximumLength(200)
                .When(x => !string.IsNullOrEmpty(x.SpecialInstructions))
                .WithMessage("Special instructions cannot exceed 200 characters");
        }
    }

    public class CreateRatingDtoValidator : AbstractValidator<CreateRatingDto>
    {
        public CreateRatingDtoValidator()
        {
            RuleFor(x => x.OrderId)
                .GreaterThan(0)
                .WithMessage("Order ID must be greater than 0");

            RuleFor(x => x.FoodRating)
                .InclusiveBetween(1, 5)
                .WithMessage("Food rating must be between 1 and 5");

            RuleFor(x => x.DeliveryRating)
                .InclusiveBetween(1, 5)
                .WithMessage("Delivery rating must be between 1 and 5");

            RuleFor(x => x.OverallRating)
                .InclusiveBetween(1, 5)
                .WithMessage("Overall rating must be between 1 and 5");

            RuleFor(x => x.FoodReview)
                .MaximumLength(1000)
                .When(x => !string.IsNullOrEmpty(x.FoodReview))
                .WithMessage("Food review cannot exceed 1000 characters");

            RuleFor(x => x.DeliveryReview)
                .MaximumLength(1000)
                .When(x => !string.IsNullOrEmpty(x.DeliveryReview))
                .WithMessage("Delivery review cannot exceed 1000 characters");

            RuleFor(x => x.OverallReview)
                .MaximumLength(1000)
                .When(x => !string.IsNullOrEmpty(x.OverallReview))
                .WithMessage("Overall review cannot exceed 1000 characters");
        }
    }
}
