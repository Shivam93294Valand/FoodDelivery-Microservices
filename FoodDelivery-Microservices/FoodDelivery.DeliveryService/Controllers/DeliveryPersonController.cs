using FoodDelivery.DeliveryService.Repositories;
using FoodDelivery.DeliveryService.Models;
using FoodDelivery.DeliveryService.DTOs;
using FoodDelivery.DeliveryService.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace FoodDelivery.DeliveryService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DeliveryPersonController : ControllerBase
    {
        private readonly IDeliveryRequestRepository _deliveryRequestRepository;
        private readonly DeliveryDbContext _dbContext;

        public DeliveryPersonController(IDeliveryRequestRepository deliveryRequestRepository, DeliveryDbContext dbContext)
        {
            _deliveryRequestRepository = deliveryRequestRepository;
            _dbContext = dbContext;
        }

        // GET: api/DeliveryPerson/5
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<DeliveryPerson>> GetDeliveryPerson(int id)
        {
            var deliveryPerson = await _deliveryRequestRepository.GetDeliveryPersonByIdAsync(id);

            if (deliveryPerson == null)
            {
                return NotFound();
            }

            return deliveryPerson;
        }

        // GET: api/DeliveryPerson
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<DeliveryPerson>>> GetAllDeliveryPersons()
        {
            var persons = await _deliveryRequestRepository.GetAllDeliveryPersonsAsync();
            return Ok(persons);
        }

        // POST: api/DeliveryPerson (Admin only)
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<DeliveryPerson>> CreateDeliveryPerson([FromBody] DeliveryPerson person)
        {
            person.Email = (person.Email ?? string.Empty).Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(person.Password))
            {
                return BadRequest(new { message = "Password is required for delivery person account." });
            }

            person.Password = BCrypt.Net.BCrypt.HashPassword(person.Password.Trim());
            person.JoinedDate = DateTime.UtcNow;
            person.IsAvailable = person.IsAvailable; // keep specified or default false
            await _deliveryRequestRepository.AddAsync(person);
            return CreatedAtAction(nameof(GetDeliveryPerson), new { id = person.DeliveryPersonId }, person);
        }

        // GET: api/DeliveryPerson/me
        [HttpGet("me")]
        [Authorize(Roles = "DeliveryPerson,Admin")]
        public async Task<ActionResult<DeliveryPerson>> GetCurrentDeliveryPerson()
        {
            var idClaim = User.FindFirst("DeliveryPersonId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(idClaim) || !int.TryParse(idClaim, out var id)) return Unauthorized();
            var person = await _deliveryRequestRepository.GetDeliveryPersonByIdAsync(id);
            if (person == null) return NotFound();
            return Ok(person);
        }

        // PATCH: api/DeliveryPerson/{id}/availability
        [HttpPatch("{id}/availability")]
        [Authorize(Roles = "DeliveryPerson,Admin")]
        public async Task<IActionResult> UpdateAvailability(int id, [FromBody] bool isAvailable)
        {
            var resolvedId = id;
            if (resolvedId <= 0)
            {
                var idClaim = User.FindFirst("DeliveryPersonId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrWhiteSpace(idClaim) && int.TryParse(idClaim, out var claimId))
                {
                    resolvedId = claimId;
                }
            }

            var person = await _deliveryRequestRepository.GetDeliveryPersonByIdAsync(resolvedId);
            if (person == null) return NotFound();

            var now = DateTime.UtcNow;
            person.IsAvailable = isAvailable;

            if (isAvailable)
            {
                person.ShiftStatus = ShiftStatus.OnShift;
                person.ShiftStartTime ??= now;
                person.ShiftEndTime = null;
            }
            else
            {
                person.ShiftStatus = ShiftStatus.OffShift;
                person.ShiftEndTime = now;
            }

            person.LastStatusChange = now;

            await _deliveryRequestRepository.UpdateAsync(person);
            return NoContent();
        }

        // PATCH: api/DeliveryPerson/{id}/location
        [HttpPatch("{id}/location")]
        [Authorize(Roles = "DeliveryPerson,Admin")]
        public async Task<IActionResult> UpdateLocation(int id, [FromBody] DeliveryPerson location)
        {
            var person = await _deliveryRequestRepository.GetDeliveryPersonByIdAsync(id);
            if (person == null) return NotFound();
            person.CurrentLatitude = location.CurrentLatitude;
            person.CurrentLongitude = location.CurrentLongitude;
            await _deliveryRequestRepository.UpdateAsync(person);
            return NoContent();
        }

        // GET: api/DeliveryPerson/{id}/stats
        [HttpGet("{id}/stats")]
        [Authorize(Roles = "Admin,DeliveryPerson")]
        public async Task<IActionResult> GetDeliveryPersonStats(int id, [FromQuery] string period = "all")
        {
            if (period.ToLower() == "today")
            {
                var todayCount = await _deliveryRequestRepository.GetTodayDeliveriesCountAsync(id);
                var todayEarnings = await _deliveryRequestRepository.GetTodayEarningsAsync(id);
                return Ok(new { deliveries = todayCount, earnings = todayEarnings, period = "today" });
            }
            else if (period.ToLower() == "week")
            {
                var weekCount = await _deliveryRequestRepository.GetWeekDeliveriesCountAsync(id);
                var weekEarnings = await _deliveryRequestRepository.GetWeekEarningsAsync(id);
                return Ok(new { deliveries = weekCount, earnings = weekEarnings, period = "week" });
            }
            else if (period.ToLower() == "month")
            {
                var monthCount = await _deliveryRequestRepository.GetMonthDeliveriesCountAsync(id);
                var monthEarnings = await _deliveryRequestRepository.GetMonthEarningsAsync(id);
                return Ok(new { deliveries = monthCount, earnings = monthEarnings, period = "month" });
            }
            else if (period.ToLower() == "year")
            {
                var yearCount = await _deliveryRequestRepository.GetYearDeliveriesCountAsync(id);
                var yearEarnings = await _deliveryRequestRepository.GetYearEarningsAsync(id);
                return Ok(new { deliveries = yearCount, earnings = yearEarnings, period = "year" });
            }
            else
            {
                // Return all stats
                var total = await _deliveryRequestRepository.GetTotalDeliveriesCountAsync(id);
                var today = await _deliveryRequestRepository.GetTodayDeliveriesCountAsync(id);
                var week = await _deliveryRequestRepository.GetWeekDeliveriesCountAsync(id);
                var month = await _deliveryRequestRepository.GetMonthDeliveriesCountAsync(id);
                var year = await _deliveryRequestRepository.GetYearDeliveriesCountAsync(id);
                
                var todayEarnings = await _deliveryRequestRepository.GetTodayEarningsAsync(id);
                var weekEarnings = await _deliveryRequestRepository.GetWeekEarningsAsync(id);
                var monthEarnings = await _deliveryRequestRepository.GetMonthEarningsAsync(id);
                var yearEarnings = await _deliveryRequestRepository.GetYearEarningsAsync(id);

                return Ok(new
                {
                    totalDeliveries = total,
                    today = new { deliveries = today, earnings = todayEarnings },
                    week = new { deliveries = week, earnings = weekEarnings },
                    month = new { deliveries = month, earnings = monthEarnings },
                    year = new { deliveries = year, earnings = yearEarnings }
                });
            }
        }

        // GET: api/DeliveryPerson/{id}/deliveries
        [HttpGet("{id}/deliveries")]
        [Authorize(Roles = "Admin,DeliveryPerson")]
        public async Task<IActionResult> GetDeliveriesForPerson(int id)
        {
            var deliveries = await _deliveryRequestRepository.GetDeliveriesByPersonAsync(id);
            return Ok(deliveries);
        }
        // PUT: api/DeliveryPerson/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDeliveryPerson(int id, [FromBody] DeliveryPerson update)
        {
            var existing = await _deliveryRequestRepository.GetDeliveryPersonByIdAsync(id);
            if (existing == null) return NotFound();

            existing.FirstName = update.FirstName;
            existing.LastName = update.LastName;
            existing.Email = (update.Email ?? string.Empty).Trim().ToLowerInvariant();
            existing.PhoneNumber = update.PhoneNumber;
            existing.VehicleType = update.VehicleType ?? existing.VehicleType;
            existing.VehicleNumber = update.VehicleNumber ?? existing.VehicleNumber;
            existing.IsAvailable = update.IsAvailable;

            if (!string.IsNullOrWhiteSpace(update.Password))
            {
                existing.Password = BCrypt.Net.BCrypt.HashPassword(update.Password.Trim());
            }

            await _deliveryRequestRepository.UpdateAsync(existing);
            return NoContent();
        }

        // DELETE: api/DeliveryPerson/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDeliveryPerson(int id)
        {
            var existing = await _deliveryRequestRepository.GetDeliveryPersonByIdAsync(id);
            if (existing == null) return NotFound();
            await _deliveryRequestRepository.DeleteDeliveryPersonAsync(id);
            return NoContent();
        }

        // POST: api/DeliveryPerson/{id}/shift/start
        [HttpPost("{id}/shift/start")]
        [Authorize(Roles = "DeliveryPerson,Admin")]
        public async Task<ActionResult<ShiftStatusResponseDto>> StartShift(int id)
        {
            var person = await _deliveryRequestRepository.GetDeliveryPersonByIdAsync(id);
            if (person == null) return NotFound();

            if (person.ShiftStatus == ShiftStatus.OnShift)
                return BadRequest(new { message = "Shift already started" });

            person.ShiftStatus = ShiftStatus.OnShift;
            person.ShiftStartTime = DateTime.UtcNow;
            person.LastStatusChange = DateTime.UtcNow;
            person.IsAvailable = true;
            
            await _deliveryRequestRepository.UpdateAsync(person);

            return Ok(new ShiftStatusResponseDto
            {
                DeliveryPersonId = person.DeliveryPersonId,
                ShiftStatus = person.ShiftStatus,
                ShiftStartTime = person.ShiftStartTime,
                ShiftEndTime = person.ShiftEndTime,
                LastStatusChange = person.LastStatusChange
            });
        }

        // POST: api/DeliveryPerson/{id}/shift/end
        [HttpPost("{id}/shift/end")]
        [Authorize(Roles = "DeliveryPerson,Admin")]
        public async Task<ActionResult<ShiftStatusResponseDto>> EndShift(int id)
        {
            var person = await _deliveryRequestRepository.GetDeliveryPersonByIdAsync(id);
            if (person == null) return NotFound();

            if (person.ShiftStatus == ShiftStatus.OffShift)
                return BadRequest(new { message = "No active shift to end" });

            person.ShiftStatus = ShiftStatus.OffShift;
            person.ShiftEndTime = DateTime.UtcNow;
            person.LastStatusChange = DateTime.UtcNow;
            person.IsAvailable = false;
            
            await _deliveryRequestRepository.UpdateAsync(person);

            var totalDuration = person.ShiftStartTime.HasValue && person.ShiftEndTime.HasValue
                ? person.ShiftEndTime.Value - person.ShiftStartTime.Value
                : (TimeSpan?)null;

            return Ok(new ShiftStatusResponseDto
            {
                DeliveryPersonId = person.DeliveryPersonId,
                ShiftStatus = person.ShiftStatus,
                ShiftStartTime = person.ShiftStartTime,
                ShiftEndTime = person.ShiftEndTime,
                LastStatusChange = person.LastStatusChange,
                TotalShiftDuration = totalDuration
            });
        }

        // POST: api/DeliveryPerson/{id}/shift/break
        [HttpPost("{id}/shift/break")]
        [Authorize(Roles = "DeliveryPerson,Admin")]
        public async Task<ActionResult<ShiftStatusResponseDto>> ToggleBreak(int id)
        {
            var person = await _deliveryRequestRepository.GetDeliveryPersonByIdAsync(id);
            if (person == null) return NotFound();

            if (person.ShiftStatus == ShiftStatus.OffShift)
                return BadRequest(new { message = "Cannot take break while off shift" });

            // Toggle between OnShift and Break
            person.ShiftStatus = person.ShiftStatus == ShiftStatus.Break 
                ? ShiftStatus.OnShift 
                : ShiftStatus.Break;
            person.LastStatusChange = DateTime.UtcNow;
            person.IsAvailable = person.ShiftStatus == ShiftStatus.OnShift;
            
            await _deliveryRequestRepository.UpdateAsync(person);

            return Ok(new ShiftStatusResponseDto
            {
                DeliveryPersonId = person.DeliveryPersonId,
                ShiftStatus = person.ShiftStatus,
                ShiftStartTime = person.ShiftStartTime,
                ShiftEndTime = person.ShiftEndTime,
                LastStatusChange = person.LastStatusChange
            });
        }

        // GET: api/DeliveryPerson/{id}/shift/status
        [HttpGet("{id}/shift/status")]
        [Authorize(Roles = "DeliveryPerson,Admin")]
        public async Task<ActionResult<ShiftStatusResponseDto>> GetShiftStatus(int id)
        {
            var person = await _deliveryRequestRepository.GetDeliveryPersonByIdAsync(id);
            if (person == null) return NotFound();

            TimeSpan? duration = null;
            if (person.ShiftStatus != ShiftStatus.OffShift && person.ShiftStartTime.HasValue)
            {
                var endTime = person.ShiftEndTime ?? DateTime.UtcNow;
                duration = endTime - person.ShiftStartTime.Value;
            }

            return Ok(new ShiftStatusResponseDto
            {
                DeliveryPersonId = person.DeliveryPersonId,
                ShiftStatus = person.ShiftStatus,
                ShiftStartTime = person.ShiftStartTime,
                ShiftEndTime = person.ShiftEndTime,
                LastStatusChange = person.LastStatusChange,
                TotalShiftDuration = duration
            });
        }

        // POST: api/DeliveryPerson/{id}/emergency
        [HttpPost("{id}/emergency")]
        [Authorize(Roles = "DeliveryPerson,Admin")]
        public async Task<ActionResult<EmergencyAlertResponseDto>> RaiseEmergencyAlert(int id, [FromBody] EmergencyAlertRequestDto request)
        {
            var person = await _deliveryRequestRepository.GetDeliveryPersonByIdAsync(id);
            if (person == null)
            {
                return NotFound(new { message = "Delivery person not found" });
            }

            var alert = new DeliveryEmergencyAlert
            {
                DeliveryPersonId = id,
                Message = string.IsNullOrWhiteSpace(request.Message) ? "Emergency alert raised" : request.Message.Trim(),
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                Severity = string.IsNullOrWhiteSpace(request.Severity) ? "Medium" : request.Severity.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.DeliveryEmergencyAlerts.Add(alert);
            await _dbContext.SaveChangesAsync();

            return Ok(new EmergencyAlertResponseDto
            {
                AlertId = alert.Id,
                DeliveryPersonId = alert.DeliveryPersonId,
                Message = alert.Message,
                Severity = alert.Severity,
                CreatedAt = alert.CreatedAt
            });
        }

        // GET: api/DeliveryPerson/{id}/emergency
        [HttpGet("{id}/emergency")]
        [Authorize(Roles = "DeliveryPerson,Admin")]
        public ActionResult<IEnumerable<EmergencyAlertResponseDto>> GetEmergencyAlerts(int id)
        {
            var alerts = _dbContext.DeliveryEmergencyAlerts
                .Where(x => x.DeliveryPersonId == id)
                .OrderByDescending(x => x.CreatedAt)
                .Take(20)
                .Select(x => new EmergencyAlertResponseDto
                {
                    AlertId = x.Id,
                    DeliveryPersonId = x.DeliveryPersonId,
                    Message = x.Message,
                    Severity = x.Severity,
                    CreatedAt = x.CreatedAt
                })
                .ToList();

            return Ok(alerts);
        }
    }
}