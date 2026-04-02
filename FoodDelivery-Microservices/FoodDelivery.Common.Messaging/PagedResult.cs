using System.Linq;

namespace FoodDelivery.Common._Messaging
{
    public class PagedResult<T>
    {
        public IEnumerable<T> Items { get; set; } = new List<T>();
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
        public bool HasPrevious => Page > 1;
        public bool HasNext => Page < TotalPages;
    }

    public static class PaginationExtensions
    {
        public static IQueryable<T> Paginate<T>(this IQueryable<T> query, int page, int pageSize)
        {
            return query.Skip((page - 1) * pageSize).Take(pageSize);
        }

        // Removed EF-specific extension to avoid dependency
    }
}
