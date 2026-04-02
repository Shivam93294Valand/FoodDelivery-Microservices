using FoodDelivery.CustomerService.Models;
using Microsoft.EntityFrameworkCore;

namespace FoodDelivery.CustomerService.Data
{
    public class CustomerDbContext : DbContext
    {
        public CustomerDbContext(DbContextOptions<CustomerDbContext> options)
            : base(options)
        {
        }

        public DbSet<Customer> Customers { get; set; }
        public DbSet<CustomerAddress> CustomerAddresses { get; set; }
        public DbSet<PasswordResetOtp> PasswordResetOtps { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<CustomerAddress>()
                .HasKey(a => a.AddressId);

            modelBuilder.Entity<CustomerAddress>()
                .HasOne(a => a.Customer)
                .WithMany(c => c.Addresses)
                .HasForeignKey(a => a.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

        }
    }
}