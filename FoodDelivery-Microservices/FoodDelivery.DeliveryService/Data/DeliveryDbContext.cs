using FoodDelivery.DeliveryService.Models;
using Microsoft.EntityFrameworkCore;

namespace FoodDelivery.DeliveryService.Data
{
    public class DeliveryDbContext : DbContext
    {
        public DeliveryDbContext(DbContextOptions<DeliveryDbContext> options)
            : base(options)
        {
        }

        public DbSet<DeliveryPerson> DeliveryPersons { get; set; }
        public DbSet<Delivery> Deliveries { get; set; }
        public DbSet<PasswordResetOtp> PasswordResetOtps { get; set; }
        public DbSet<DeliveryEmergencyAlert> DeliveryEmergencyAlerts { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Map to existing table name in database
            modelBuilder.Entity<DeliveryPerson>()
                .ToTable("DeliveryPartners");

            // Map DeliveryPersonId to existing column name in database
            modelBuilder.Entity<DeliveryPerson>()
                .Property(dp => dp.DeliveryPersonId)
                .HasColumnName("DeliveryPartnerId");

            modelBuilder.Entity<Delivery>()
                .Property(d => d.DeliveryPersonId)
                .HasColumnName("DeliveryPartnerId");

            modelBuilder.Entity<Delivery>()
                .HasOne(d => d.DeliveryPerson)
                .WithMany()
                .HasForeignKey(d => d.DeliveryPersonId);

            modelBuilder.Entity<DeliveryPerson>()
                .Property(dp => dp.Rating)
                .HasPrecision(3, 2);

            modelBuilder.Entity<PasswordResetOtp>()
                .HasIndex(x => x.Email);

            modelBuilder.Entity<PasswordResetOtp>()
                .HasIndex(x => x.ExpiresAt);

            modelBuilder.Entity<DeliveryEmergencyAlert>()
                .HasIndex(x => x.DeliveryPersonId);

            modelBuilder.Entity<DeliveryEmergencyAlert>()
                .Property(x => x.Message)
                .HasMaxLength(500);
        }
    }
}