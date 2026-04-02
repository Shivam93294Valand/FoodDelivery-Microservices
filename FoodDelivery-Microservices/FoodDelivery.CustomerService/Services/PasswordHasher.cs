using System;
using System.Security.Cryptography;

namespace FoodDelivery.CustomerService.Services
{
    public static class PasswordHasher
    {
        private const int SaltSize = 16; // 128-bit salt
        private const int KeySize = 32;  // 256-bit key
        private const int Iterations = 100_000;

        public static string Hash(string password)
        {
            using var algorithm = new Rfc2898DeriveBytes(password, SaltSize, Iterations, HashAlgorithmName.SHA256);
            var key = algorithm.GetBytes(KeySize);
            var salt = algorithm.Salt;
            return $"{Iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(key)}";
        }

        public static bool Verify(string password, string hash)
        {
            if (string.IsNullOrWhiteSpace(hash)) return false;
            var parts = hash.Split('.');
            if (parts.Length != 3) return false;

            var iterations = int.Parse(parts[0]);
            var salt = Convert.FromBase64String(parts[1]);
            var key = Convert.FromBase64String(parts[2]);

            using var algorithm = new Rfc2898DeriveBytes(password, salt, iterations, HashAlgorithmName.SHA256);
            var keyToCheck = algorithm.GetBytes(key.Length);
            return CryptographicOperations.FixedTimeEquals(keyToCheck, key);
        }
    }
}