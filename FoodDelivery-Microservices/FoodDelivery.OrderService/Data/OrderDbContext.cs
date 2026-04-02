using FoodDelivery.OrderService.Models;
using Microsoft.EntityFrameworkCore;

namespace FoodDelivery.OrderService.Data
{
    public class OrderDbContext : DbContext
    {
        public OrderDbContext(DbContextOptions<OrderDbContext> options)
            : base(options)
        {
        }

        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<OrderRating> OrderRatings { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Map DeliveryPersonId to existing column name in database
            modelBuilder.Entity<Order>()
                .Property(o => o.DeliveryPersonId)
                .HasColumnName("DeliveryPartnerId");

            modelBuilder.Entity<OrderItem>()
                .HasOne(oi => oi.Order)
                .WithMany(o => o.OrderItems)
                .HasForeignKey(oi => oi.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<Order>()
                .Property(o => o.SubTotal)
                .HasPrecision(10, 2);

            modelBuilder.Entity<Order>()
                .Property(o => o.DeliveryCharge)
                .HasPrecision(10, 2);

            modelBuilder.Entity<Order>()
                .Property(o => o.Tax)
                .HasPrecision(10, 2);

            modelBuilder.Entity<Order>()
                .Property(o => o.TotalAmount)
                .HasPrecision(10, 2);

            modelBuilder.Entity<OrderItem>()
                .Property(oi => oi.UnitPrice)
                .HasPrecision(10, 2);

            modelBuilder.Entity<OrderItem>()
                .Property(oi => oi.TotalPrice)
                .HasPrecision(10, 2);
            modelBuilder.Entity<OrderRating>()
                .HasKey(r => r.RatingId);

            modelBuilder.Entity<OrderRating>()
                .HasOne(r => r.Order)
                .WithMany()
                .HasForeignKey(r => r.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}