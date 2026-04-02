using FoodDelivery.EmailService.Models;
using Microsoft.EntityFrameworkCore;

namespace FoodDelivery.EmailService.Data
{
    public class EmailDbContext : DbContext
    {
        public EmailDbContext(DbContextOptions<EmailDbContext> options) : base(options)
        {
        }

        public DbSet<EmailLog> EmailLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<EmailLog>()
                .Property(e => e.RecipientEmail)
                .HasMaxLength(256);

            modelBuilder.Entity<EmailLog>()
                .Property(e => e.Subject)
                .HasMaxLength(500);
        }
    }
}