using Microsoft.AspNetCore.Mvc;
using WebApplication2.Responses;
using WebApplication2.Services.Interfaces;
using WebApplication2.DTOs;

namespace WebApplication2.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PointController : ControllerBase
    {
        private readonly IPointService _pointService;

        public PointController(IPointService pointService)
        {
            _pointService = pointService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllPoints()
        {
            var result = await _pointService.GetAllPointsAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _pointService.GetByIdAsync(id);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> AddPoint([FromBody] PointCreateDto dto)
        {
            if (!ModelState.IsValid)
            {
                var error = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .FirstOrDefault();

                return BadRequest(ApiResponse<PointDto>.ErrorResponse(error ?? "Invalid input."));
            }

            var result = await _pointService.AddPointAsync(dto);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePoint(int id, [FromBody] PointCreateDto dto)
        {
            if (!ModelState.IsValid)
            {
                var error = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .FirstOrDefault();

                return BadRequest(ApiResponse<PointDto>.ErrorResponse(error ?? "Invalid input."));
            }

            var result = await _pointService.UpdatePointAsync(id, dto);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePoint(int id)
        {
            var result = await _pointService.DeletePointAsync(id);
            return Ok(result);
        }
    }
}
