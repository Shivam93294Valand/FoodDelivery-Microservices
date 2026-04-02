using FluentValidation;
using FoodDelivery.PaymentService.DTOs;

namespace FoodDelivery.PaymentService.Validaters
{
    public class ProcessPaymentDtoValidator : AbstractValidator<ProcessPaymentDto>
    {
        public ProcessPaymentDtoValidator()
        {
            RuleFor(x => x.OrderId)
                .GreaterThan(0)
                .WithMessage("OrderId must be greater than 0");

            RuleFor(x => x.Amount)
                .GreaterThan(0)
                .WithMessage("Amount must be greater than 0")
                .LessThanOrEqualTo(100000)
                .WithMessage("Amount cannot exceed 100,000");

            RuleFor(x => x.PaymentMethod)
                .NotEmpty()
                .WithMessage("Payment method is required")
                .Must(pm => new[] { "Cash", "Card", "UPI" }.Contains(pm))
                .WithMessage("Payment method must be Cash, Card, or UPI");
        }
    }

    public class InitiateRefundDtoValidator : AbstractValidator<InitiateRefundDto>
    {
        public InitiateRefundDtoValidator()
        {
            RuleFor(x => x.PaymentId)
                .GreaterThan(0)
                .WithMessage("PaymentId must be greater than 0");

            RuleFor(x => x.RefundAmount)
                .GreaterThan(0)
                .WithMessage("Refund amount must be greater than 0");

            RuleFor(x => x.Reason)
                .NotEmpty()
                .WithMessage("Refund reason is required")
                .MaximumLength(500)
                .WithMessage("Reason cannot exceed 500 characters");
        }
    }

    public class VerifyPaymentDtoValidator : AbstractValidator<VerifyPaymentDto>
    {
        public VerifyPaymentDtoValidator()
        {
            RuleFor(x => x.TransactionId)
                .NotEmpty()
                .WithMessage("Transaction ID is required");

            RuleFor(x => x.OrderId)
                .GreaterThan(0)
                .WithMessage("OrderId must be greater than 0");
        }
    }
}
