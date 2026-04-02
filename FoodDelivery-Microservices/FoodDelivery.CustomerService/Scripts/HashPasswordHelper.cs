// Run this to generate new password hashes for your users (uses PasswordHasher.Hash)

using System;
using FoodDelivery.CustomerService.Services;

namespace FoodDelivery.CustomerService.Scripts
{
    public class HashPasswordHelper
    {
        public static void Main(string[] args)
        {
            Console.WriteLine("Password Hash Generator (PBKDF2)");
            Console.WriteLine("================================\n");
            
            // Example: Generate hash for common passwords
            var passwords = new[] { "Admin@123", "User@123", "Test@123" };
            
            foreach (var password in passwords)
            {
                var hash = PasswordHasher.Hash(password);
                Console.WriteLine($"Password: {password}");
                Console.WriteLine($"Hash: {hash}");
                Console.WriteLine($"Length: {hash.Length} characters\n");
                
                // Verify it works
                var isValid = PasswordHasher.Verify(password, hash);
                Console.WriteLine($"Verification test: {(isValid ? "PASSED" : "FAILED")}\n");
                Console.WriteLine("---\n");
            }
            
            Console.WriteLine("\nTo use these hashes:");
            Console.WriteLine("1. Copy the hash for your desired password");
            Console.WriteLine("2. Run SQL: UPDATE Customers SET Password = '<hash>' WHERE Email = 'user@example.com'");
            Console.WriteLine("3. The user can now login with the password shown above");
        }
    }
}
