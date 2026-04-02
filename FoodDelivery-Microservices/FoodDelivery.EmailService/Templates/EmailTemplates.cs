namespace FoodDelivery.EmailService.Templates
{
    public static class EmailTemplates
    {
        public static string GetDeliveryAssignmentTemplate(
            string deliveryPersonName,
            int orderId,
            string restaurantName,
            string restaurantAddress,
            string deliveryAddress,
            DateTime estimatedDeliveryTime,
            decimal orderAmount)
        {
            return $@"
<! DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family:  Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
        .content {{ background-color: #f9f9f9; padding: 20px; border:  1px solid #ddd; }}
        .order-details {{ background-color: white; padding: 15px; margin: 15px 0; border-radius:  5px; }}
        . detail-row {{ margin: 10px 0; padding: 10px; border-bottom: 1px solid #eee; }}
        .label {{ font-weight: bold; color: #555; }}
        . value {{ color: #333; }}
        .button {{ display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        . footer {{ text-align: center; margin-top: 20px; color: #777; font-size: 12px; }}
        .highlight {{ background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 15px 0; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🚀 New Delivery Assignment</h1>
        </div>
        <div class='content'>
            <h2>Hi {deliveryPersonName},</h2>
            <p>You have been assigned a new delivery order.  Please review the details below:</p>
            
            <div class='order-details'>
                <h3>📦 Order Details</h3>
                <div class='detail-row'>
                    <span class='label'>Order ID:</span>
                    <span class='value'>#{orderId}</span>
                </div>
                <div class='detail-row'>
                    <span class='label'>Order Amount:</span>
                    <span class='value'>₹{orderAmount:F2}</span>
                </div>
                <div class='detail-row'>
                    <span class='label'>Estimated Delivery Time:</span>
                    <span class='value'>{estimatedDeliveryTime: dd MMM yyyy hh:mm tt}</span>
                </div>
            </div>

            <div class='order-details'>
                <h3>🏪 Pickup Location</h3>
                <div class='detail-row'>
                    <span class='label'>Restaurant:</span>
                    <span class='value'>{restaurantName}</span>
                </div>
                <div class='detail-row'>
                    <span class='label'>Address:</span>
                    <span class='value'>{restaurantAddress}</span>
                </div>
            </div>

            <div class='order-details'>
                <h3>📍 Delivery Location</h3>
                <div class='detail-row'>
                    <span class='value'>{deliveryAddress}</span>
                </div>
            </div>

            <div class='highlight'>
                <strong>⚡ Action Required:</strong> Please proceed to the restaurant to pick up the order.
            </div>

            <center>
                <a href='#' class='button'>View Delivery Details</a>
            </center>

            <p>Thank you for being a valued delivery partner!</p>
            <p>Best regards,<br><strong>FoodDelivery Team</strong></p>
        </div>
        <div class='footer'>
            <p>This is an automated email.  Please do not reply.</p>
            <p>&copy; 2026 FoodDelivery. All rights reserved.</p>
        </div>
    </div>
</body>
</html>";
        }

        public static string GetOrderConfirmationTemplate(
            string customerName,
            int orderId,
            string restaurantName,
            decimal orderAmount,
            DateTime orderDate)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #FF5722; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
        .content {{ background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }}
        .order-details {{ background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }}
        .detail-row {{ margin: 10px 0; padding: 10px; border-bottom: 1px solid #eee; }}
        .label {{ font-weight: bold; color: #555; }}
        .value {{ color: #333; }}
        .button {{ display: inline-block; padding: 12px 24px; background-color: #FF5722; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 20px; color: #777; font-size: 12px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>😋 Order Confirmed!</h1>
        </div>
        <div class='content'>
            <h2>Hi {customerName},</h2>
            <p>Your order has been successfully placed! We are getting it ready for you.</p>
            
            <div class='order-details'>
                <h3>🧾 Order Details</h3>
                <div class='detail-row'>
                    <span class='label'>Order ID:</span>
                    <span class='value'>#{orderId}</span>
                </div>
                <div class='detail-row'>
                    <span class='label'>Restaurant:</span>
                    <span class='value'>{restaurantName}</span>
                </div>
                <div class='detail-row'>
                    <span class='label'>Total Amount:</span>
                    <span class='value'>₹{orderAmount:F2}</span>
                </div>
                <div class='detail-row'>
                    <span class='label'>Order Date:</span>
                    <span class='value'>{orderDate:dd MMM yyyy hh:mm tt}</span>
                </div>
            </div>

            <p>Sit back and relax. We'll notify you when your food is on the way!</p>

            <center>
                <a href='#' class='button'>Track Your Order</a>
            </center>

            <p>Best regards,<br><strong>FoodDelivery Team</strong></p>
        </div>
        <div class='footer'>
            <p>This is an automated email. Please do not reply.</p>
            <p>&copy; 2026 FoodDelivery. All rights reserved.</p>
        </div>
    </div>
</body>
</html>";
        }

        public static string GetOrderDeliveredTemplate(
            string customerName,
            int orderId)
        {
            return $@"
<! DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family:  Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
        .content {{ background-color: white; padding: 20px; border:  1px solid #ddd; }}
        .success-icon {{ font-size: 48px; display: block; margin: 0 auto 20px; text-align: center; }}
        .button {{ display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 20px; color: #777; font-size: 12px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>✅ Order Delivered</h1>
        </div>
        <div class='content'>
            <div class='success-icon'>🥳</div>
            <h2 style='text-align: center;'>Enjoy your meal, {customerName}!</h2>
            <p>Your order <strong>#{orderId}</strong> has been successfully delivered. We hope you enjoy the food!</p>
            
            <p style='text-align: center;'>
                How was your experience?<br>
                Please take a moment to rate the restaurant and delivery partner.
            </p>

            <center>
                <a href='#' class='button'>Rate Your Order</a>
            </center>

            <p>Thank you for choosing FoodDelivery!</p>
            <p>Best regards,<br><strong>FoodDelivery Team</strong></p>
        </div>
        <div class='footer'>
            <p>&copy; 2026 FoodDelivery. All rights reserved.</p>
        </div>
    </div>
</body>
</html>";
        }
    }
}