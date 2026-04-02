using Hangfire.Dashboard;

namespace FoodDelivery.CustomerService
{
    public class HangfireAuthorizationFilter : IDashboardAuthorizationFilter
    {
        public bool Authorize(DashboardContext context)
        {
            // Allow all for development. In production, add proper authorization
            return true;
        }
    }
}
