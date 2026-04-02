using FoodDelivery.RestaurantService.DTOs;
using FoodDelivery.RestaurantService.Models;
using FoodDelivery.RestaurantService.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FoodDelivery.RestaurantService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MenuController : ControllerBase
    {
        private readonly IMenuItemRequestRepository _menuItemService;
        private readonly IRestaurantRequestRepository _restaurantService;

        public MenuController(IMenuItemRequestRepository menuItemService, IRestaurantRequestRepository restaurantService)
        {
            _menuItemService = menuItemService;
            _restaurantService = restaurantService;
        }

        // GET: api/Menu/Restaurant/5 - Public access for browsing menu
        [HttpGet("Restaurant/{restaurantId}")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<MenuItemListDto>>> GetMenuByRestaurant(int restaurantId)
        {
            var menuItems = await _menuItemService.GetByRestaurantIdAsync(restaurantId);

            var menuItemDtos = menuItems
                .OfType<MenuItem>()
                .Select(m => new MenuItemListDto
                {
                    MenuItemId = m.MenuItemId,
                    Name = m.Name,
                    Description = m.Description,
                    Price = m.Price,
                    Category = m.Category,
                    ImageUrl = m.ImageUrl,
                    IsAvailable = m.IsAvailable,
                    IsVegetarian = m.IsVegetarian,
                    Rating = m.Rating,
                    PreparationTime = m.PreparationTime,
                    Ingredients = m.Ingredients?.ToArray() ?? Array.Empty<string>(),
                    Allergens = m.Allergens?.ToArray() ?? Array.Empty<string>()
                });

            return Ok(menuItemDtos);
        }

        // GET: api/Menu/5 - Public access for viewing menu item details
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<MenuItemDetailDto>> GetMenuItem(int id)
        {
            var menuItem = await _menuItemService.GetIdAsync(id);

            if (menuItem == null)
            {
                return NotFound();
            }

            var menuItemDto = new MenuItemDetailDto
            {
                MenuItemId = menuItem.MenuItemId,
                RestaurantId = menuItem.RestaurantId,
                Name = menuItem.Name,
                Description = menuItem.Description,
                Price = menuItem.Price,
                Category = menuItem.Category,
                ImageUrl = menuItem.ImageUrl,
                IsAvailable = menuItem.IsAvailable,
                IsVegetarian = menuItem.IsVegetarian,
                CreatedAt = menuItem.CreatedAt,
                Rating = menuItem.Rating,
                PreparationTime = menuItem.PreparationTime,
                Ingredients = menuItem.Ingredients?.ToArray() ?? Array.Empty<string>(),
                Allergens = menuItem.Allergens?.ToArray() ?? Array.Empty<string>()
            };

            return menuItemDto;
        }

        // POST: api/Menu - Only Admin can create menu items
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<MenuItemDetailDto>> CreateMenuItem(CreateMenuItemDto createDto)
        {
            var restaurant = await _restaurantService.GetIdAsync(createDto.RestaurantId);
            if (restaurant == null)
            {
                return BadRequest("Restaurant not found.");
            }

            var menuItem = new MenuItem
            {
                RestaurantId = createDto.RestaurantId,
                Name = createDto.Name,
                Description = createDto.Description,
                Price = createDto.Price,
                Category = createDto.Category,
                ImageUrl = createDto.ImageUrl,
                IsVegetarian = createDto.IsVegetarian,
                CreatedAt = DateTime.UtcNow,
                IsAvailable = true,
                PreparationTime = createDto.PreparationTime,
                Ingredients = createDto.Ingredients?.ToList() ?? new List<string>(),
                Allergens = createDto.Allergens?.ToList() ?? new List<string>()
            };

            await _menuItemService.AddAsync(menuItem);

            var menuItemDto = new MenuItemDetailDto
            {
                MenuItemId = menuItem.MenuItemId,
                RestaurantId = menuItem.RestaurantId,
                Name = menuItem.Name,
                Description = menuItem.Description,
                Price = menuItem.Price,
                Category = menuItem.Category,
                ImageUrl = menuItem.ImageUrl,
                IsAvailable = menuItem.IsAvailable,
                IsVegetarian = menuItem.IsVegetarian,
                CreatedAt = menuItem.CreatedAt,
                PreparationTime = menuItem.PreparationTime,
                Ingredients = menuItem.Ingredients?.ToArray() ?? Array.Empty<string>(),
                Allergens = menuItem.Allergens?.ToArray() ?? Array.Empty<string>()
            };

            return CreatedAtAction(nameof(GetMenuItem), new { id = menuItem.MenuItemId }, menuItemDto);
        }

        // PUT: api/Menu/5 - Only Admin can update menu items
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateMenuItem(int id, UpdateMenuItemDto updateDto)
        {
            var menuItem = await _menuItemService.GetIdAsync(id);
            if (menuItem == null)
            {
                return NotFound();
            }

            menuItem.Name = updateDto.Name;
            menuItem.Description = updateDto.Description;
            menuItem.Price = updateDto.Price;
            menuItem.Category = updateDto.Category;
            menuItem.ImageUrl = updateDto.ImageUrl;
            menuItem.IsVegetarian = updateDto.IsVegetarian;
            menuItem.IsAvailable = updateDto.IsAvailable;
            menuItem.PreparationTime = updateDto.PreparationTime;
            menuItem.Ingredients = updateDto.Ingredients?.ToList() ?? new List<string>();
            menuItem.Allergens = updateDto.Allergens?.ToList() ?? new List<string>();

            try
            {
                await _menuItemService.UpdateAsync(menuItem);
            }
            catch (DbUpdateConcurrencyException)
            {
                if (await _menuItemService.GetIdAsync(id) == null)
                {
                    return NotFound();
                }
                throw;
            }

            return NoContent();
        }

        // PATCH: api/Menu/5/Availability - Only Admin can update availability
        [HttpPatch("{id}/Availability")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateMenuItemAvailability(int id, UpdateMenuItemAvailabilityDto updateDto)
        {
            var menuItem = await _menuItemService.GetIdAsync(id);
            if (menuItem == null)
            {
                return NotFound();
            }

            menuItem.IsAvailable = updateDto.IsAvailable;

            try
            {
                await _menuItemService.UpdateAsync(menuItem);
            }
            catch (DbUpdateConcurrencyException)
            {
                if (await _menuItemService.GetIdAsync(id) == null)
                {
                    return NotFound();
                }
                throw;
            }

            return NoContent();
        }

        // DELETE: api/Menu/5 - Only Admin can delete menu items
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteMenuItem(int id)
        {
            var menuItem = await _menuItemService.GetIdAsync(id);
            if (menuItem == null)
            {
                return NotFound();
            }

            await _menuItemService.DeleteAsync(id);
            return NoContent();
        }
    }
}