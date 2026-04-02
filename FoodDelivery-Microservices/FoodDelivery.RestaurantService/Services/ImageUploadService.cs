using Microsoft.AspNetCore.Http;

namespace FoodDelivery.RestaurantService.Services
{
    public interface IImageUploadService
    {
        Task<string> UploadMenuImageAsync(IFormFile file, int restaurantId);
        Task<bool> DeleteImageAsync(string imagePath);
        string GetImageUrl(string imagePath);
    }

    public class LocalImageUploadService : IImageUploadService
    {
        private readonly string _uploadFolder;
        private readonly IWebHostEnvironment _environment;
        private readonly IConfiguration _configuration;

        public LocalImageUploadService(IWebHostEnvironment environment, IConfiguration configuration)
        {
            _environment = environment;
            _configuration = configuration;
            _uploadFolder = Path.Combine(_environment.ContentRootPath, "uploads", "menu-items");
            if (!Directory.Exists(_uploadFolder))
            {
                Directory.CreateDirectory(_uploadFolder);
            }
        }

        public async Task<string> UploadMenuImageAsync(IFormFile file, int restaurantId)
        {
            if (file == null || file.Length == 0)
            {
                throw new ArgumentException("File is empty or null");
            }

            // Validate file type
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            
            if (!allowedExtensions.Contains(extension))
            {
                throw new ArgumentException("Invalid file type. Only images are allowed.");
            }

            // Validate file size (max 5MB)
            if (file.Length > 5 * 1024 * 1024)
            {
                throw new ArgumentException("File size exceeds 5MB limit");
            }

            // Generate unique filename
            var fileName = $"{restaurantId}_{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(_uploadFolder, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return fileName;
        }

        public Task<bool> DeleteImageAsync(string imagePath)
        {
            try
            {
                var filePath = Path.Combine(_uploadFolder, imagePath);
                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                    return Task.FromResult(true);
                }
                return Task.FromResult(false);
            }
            catch
            {
                return Task.FromResult(false);
            }
        }

        public string GetImageUrl(string imagePath)
        {
            var baseUrl = _configuration["AppSettings:BaseUrl"] ?? "https://localhost:7001";
            return $"{baseUrl}/uploads/menu-items/{imagePath}";
        }
    }
}
