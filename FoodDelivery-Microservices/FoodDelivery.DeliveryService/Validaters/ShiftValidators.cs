using FluentValidation;
using FoodDelivery.DeliveryService.DTOs;
using FoodDelivery.DeliveryService.Models;

namespace FoodDelivery.DeliveryService.Validaters
{
    public class UpdateShiftStatusDtoValidator : AbstractValidator<UpdateShiftStatusDto>
    {
        public UpdateShiftStatusDtoValidator()
        {
            RuleFor(x => x.ShiftStatus)
                .IsInEnum()
                .WithMessage("Invalid shift status");
        }
    }
}
