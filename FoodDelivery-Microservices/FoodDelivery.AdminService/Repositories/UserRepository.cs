using FoodDelivery.AdminService.Data;
using FoodDelivery.AdminService.Models;
using Microsoft.EntityFrameworkCore;

namespace FoodDelivery.AdminService.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly AdminDbContext _context;

        public UserRepository(AdminDbContext context)
        {
            _context = context;
        }

        public async Task<User?> GetByIdAsync(int id)
        {
            return await _context.Users.FindAsync(id);
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            var normalizedEmail = (email ?? string.Empty).Trim().ToLower();
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower().Trim() == normalizedEmail);
        }

        public async Task<IEnumerable<User>> GetAllAsync()
        {
            return await _context.Users.ToListAsync();
        }

        public async Task<User> AddAsync(User user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<User> UpdateAsync(User user)
        {
            user.UpdatedAt = DateTime.UtcNow;
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return false;

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsAsync(string email)
        {
            var normalizedEmail = (email ?? string.Empty).Trim().ToLower();
            return await _context.Users
                .AnyAsync(u => u.Email.ToLower().Trim() == normalizedEmail);
        }
    }
}