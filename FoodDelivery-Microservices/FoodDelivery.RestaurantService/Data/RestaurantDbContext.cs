using FoodDelivery.RestaurantService.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using System.Text.Json;

namespace FoodDelivery.RestaurantService.Data
{
    public class RestaurantDbContext : DbContext
    {
        public RestaurantDbContext(DbContextOptions<RestaurantDbContext> options)
            : base(options)
        {
        }

        public DbSet<Restaurant> Restaurants { get; set; }
        public DbSet<MenuItem> MenuItems { get; set; }
        
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<MenuItem>()
                .HasOne(m => m.Restaurant)
                .WithMany(r => r.MenuItems)
                .HasForeignKey(m => m.RestaurantId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<Restaurant>()
                .Property(r => r.Rating)
                .HasPrecision(3, 2);

            modelBuilder.Entity<MenuItem>()
                .Property(m => m.Price)
                .HasPrecision(10, 2);

            modelBuilder.Entity<MenuItem>()
                .Property(m => m.Rating)
                .HasPrecision(3, 2);
            modelBuilder.Entity<MenuItem>()
                .Property(m => m.Ingredients)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                    v => string.IsNullOrEmpty(v) ? new List<string>() : JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions)null) ?? new List<string>()
                )
                .Metadata.SetValueComparer(new ValueComparer<List<string>>(
                    (c1, c2) => c1.SequenceEqual(c2),
                    c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
                    c => c.ToList()
                ));

            modelBuilder.Entity<MenuItem>()
                .Property(m => m.Allergens)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                    v => string.IsNullOrEmpty(v) ? new List<string>() : JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions)null) ?? new List<string>()
                )
                .Metadata.SetValueComparer(new ValueComparer<List<string>>(
                    (c1, c2) => c1.SequenceEqual(c2),
                    c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
                    c => c.ToList()
                ));
        }
    }
}