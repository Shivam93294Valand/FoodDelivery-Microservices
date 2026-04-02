using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace FoodDelivery.Common._Messaging
{
    // Role-based authorization attributes
    public class RoleRequirement : IAuthorizationRequirement
    {
        public string[] Roles { get; }

        public RoleRequirement(params string[] roles)
        {
            Roles = roles;
        }
    }

    public class RoleAuthorizationHandler : AuthorizationHandler<RoleRequirement>
    {
        protected override Task HandleRequirementAsync(
            AuthorizationHandlerContext context,
            RoleRequirement requirement)
        {
            var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;
            
            if (userRole != null && requirement.Roles.Contains(userRole))
            {
                context.Succeed(requirement);
            }

            return Task.CompletedTask;
        }
    }

    // Permission-based authorization
    public class PermissionRequirement : IAuthorizationRequirement
    {
        public string Permission { get; }

        public PermissionRequirement(string permission)
        {
            Permission = permission;
        }
    }

    public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
    {
        protected override Task HandleRequirementAsync(
            AuthorizationHandlerContext context,
            PermissionRequirement requirement)
        {
            var permissions = context.User.FindAll("permission").Select(c => c.Value);
            
            if (permissions.Contains(requirement.Permission))
            {
                context.Succeed(requirement);
            }

            return Task.CompletedTask;
        }
    }

    // Resource-based authorization (e.g., can user edit their own profile)
    public class ResourceOwnerRequirement : IAuthorizationRequirement { }

    public class ResourceOwnerAuthorizationHandler : AuthorizationHandler<ResourceOwnerRequirement, int>
    {
        protected override Task HandleRequirementAsync(
            AuthorizationHandlerContext context,
            ResourceOwnerRequirement requirement,
            int resourceOwnerId)
        {
            var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
                             context.User.FindFirst("CustomerId")?.Value ??
                             context.User.FindFirst("RestaurantId")?.Value ??
                             context.User.FindFirst("DeliveryPersonId")?.Value;

            if (int.TryParse(userIdClaim, out var userId) && userId == resourceOwnerId)
            {
                context.Succeed(requirement);
            }

            // Admins can access any resource
            var role = context.User.FindFirst(ClaimTypes.Role)?.Value;
            if (role == "Admin")
            {
                context.Succeed(requirement);
            }

            return Task.CompletedTask;
        }
    }
}
