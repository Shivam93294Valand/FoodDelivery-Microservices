namespace FoodDelivery.Common.Messaging
{
    public interface IOtpService
    {
        Task<string> GenerateOtpAsync(string identifier, string purpose);
        Task<bool> ValidateOtpAsync(string identifier, string otp, string purpose);
        Task InvalidateOtpAsync(string identifier, string purpose);
    }

    public class InMemoryOtpService : IOtpService
    {
        private readonly Dictionary<string, (string Otp, DateTime Expiry)> _otpStore = new();
        private readonly TimeSpan _otpExpiry = TimeSpan.FromMinutes(10);
        private readonly Random _random = new();

        public Task<string> GenerateOtpAsync(string identifier, string purpose)
        {
            var key = $"{identifier}:{purpose}";
            var otp = _random.Next(100000, 999999).ToString();
            var expiry = DateTime.UtcNow.Add(_otpExpiry);

            lock (_otpStore)
            {
                _otpStore[key] = (otp, expiry);
            }

            return Task.FromResult(otp);
        }

        public Task<bool> ValidateOtpAsync(string identifier, string otp, string purpose)
        {
            var key = $"{identifier}:{purpose}";
            
            lock (_otpStore)
            {
                if (_otpStore.TryGetValue(key, out var stored))
                {
                    if (stored.Expiry > DateTime.UtcNow && stored.Otp == otp)
                    {
                        _otpStore.Remove(key); // One-time use
                        return Task.FromResult(true);
                    }
                    if (stored.Expiry <= DateTime.UtcNow)
                    {
                        _otpStore.Remove(key);
                    }
                }
            }

            return Task.FromResult(false);
        }

        public Task InvalidateOtpAsync(string identifier, string purpose)
        {
            var key = $"{identifier}:{purpose}";
            
            lock (_otpStore)
            {
                _otpStore.Remove(key);
            }

            return Task.CompletedTask;
        }
    }
}
