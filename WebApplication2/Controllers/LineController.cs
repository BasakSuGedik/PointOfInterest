using Microsoft.AspNetCore.Mvc;
using WebApplication2.DTOs;
using WebApplication2.Responses;
using WebApplication2.Services.Interfaces;

namespace WebApplication2.Controllers
{
    [Route("api/linestring")]
    [ApiController]
    public class LineController : ControllerBase
    {
        private readonly ILineService _lineService;

        public LineController(ILineService lineService)
        {
            _lineService = lineService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllLines()
        {
            var result = await _lineService.GetAllLinesAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetLineById(int id)
        {
            var result = await _lineService.GetByIdAsync(id);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> AddLine([FromBody] LineCreateDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse<string>.ErrorResponse("Invalid input"));
            }

            var result = await _lineService.AddLineAsync(dto);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLine(int id, [FromBody] LineCreateDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse<string>.ErrorResponse("Invalid input"));
            }

            var result = await _lineService.UpdateLineAsync(id, dto);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLine(int id)
        {
            var result = await _lineService.DeleteLineAsync(id);
            return Ok(result);
        }
    }
}
