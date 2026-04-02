namespace FoodDelivery.PaymentService.DTOs
{
    public class PaymentListDto
    {
        public int PaymentId { get; set; }
        public int OrderId { get; set; }
        public int CustomerId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime PaymentDate { get; set; }
    }

    public class PaymentDetailDto
    {
        public int PaymentId { get; set; }
        public int OrderId { get; set; }
        public int CustomerId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime PaymentDate { get; set; }
        public string TransactionId { get; set; } = string.Empty;
        public DateTime? CompletedAt { get; set; }
        public string? CustomerName { get; set; }
        public string? RestaurantName { get; set; }
    }

    public class PaymentDto
    {
        public int PaymentId { get; set; }
        public int OrderId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime PaymentDate { get; set; }
        public string TransactionId { get; set; } = string.Empty;
        public DateTime? CompletedAt { get; set; }
    }

    public class ProcessPaymentDto
    {
        public int OrderId { get; set; }
        public int CustomerId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
    }

    public class ProcessPaymentResponseDto
    {
        public int PaymentId { get; set; }
        public string TransactionId { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public DateTime? CompletedAt { get; set; }
    }

    public class InitiateRefundDto
    {
        public int PaymentId { get; set; }
        public decimal RefundAmount { get; set; }
        public string Reason { get; set; } = string.Empty;
    }

    public class RefundResponseDto
    {
        public int PaymentId { get; set; }
        public string RefundTransactionId { get; set; } = string.Empty;
        public decimal RefundAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public DateTime? RefundedAt { get; set; }
    }

    public class VerifyPaymentDto
    {
        public string TransactionId { get; set; } = string.Empty;
        public int OrderId { get; set; }
    }

    public class VerifyPaymentResponseDto
    {
        public bool IsValid { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal Amount { get; set; }
    }
}