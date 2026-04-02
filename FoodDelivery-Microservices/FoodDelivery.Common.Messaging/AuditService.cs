using System.ComponentModel.DataAnnotations.Schema;

namespace FoodDelivery.Common._Messaging
{
    public class AuditLog
    {
        public int AuditId { get; set; }
        public string EntityName { get; set; } = string.Empty;
        public int EntityId { get; set; }
        public string Action { get; set; } = string.Empty; // Created, Updated, Deleted
        public string? OldValues { get; set; }
        public string? NewValues { get; set; }
        public int? UserId { get; set; }
        public string? UserName { get; set; }
        public DateTime Timestamp { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
    }

    public interface IAuditService
    {
        Task LogAsync(string entityName, int entityId, string action, object? oldValues, object? newValues, int? userId, string? userName);
    }

    public class AuditService : IAuditService
    {
        private readonly List<AuditLog> _logs = new(); // In-memory for demo

        public Task LogAsync(string entityName, int entityId, string action, object? oldValues, object? newValues, int? userId, string? userName)
        {
            var log = new AuditLog
            {
                EntityName = entityName,
                EntityId = entityId,
                Action = action,
                OldValues = oldValues != null ? System.Text.Json.JsonSerializer.Serialize(oldValues) : null,
                NewValues = newValues != null ? System.Text.Json.JsonSerializer.Serialize(newValues) : null,
                UserId = userId,
                UserName = userName,
                Timestamp = DateTime.UtcNow
            };

            _logs.Add(log);
            Console.WriteLine($"[AUDIT] {action} {entityName} #{entityId} by {userName ?? "System"} at {log.Timestamp}");
            
            return Task.CompletedTask;
        }

        public Task<List<AuditLog>> GetLogsAsync(string? entityName = null, int? entityId = null, int page = 1, int pageSize = 50)
        {
            var query = _logs.AsEnumerable();

            if (!string.IsNullOrEmpty(entityName))
                query = query.Where(l => l.EntityName == entityName);

            if (entityId.HasValue)
                query = query.Where(l => l.EntityId == entityId);

            var result = query
                .OrderByDescending(l => l.Timestamp)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return Task.FromResult(result);
        }
    }
}
