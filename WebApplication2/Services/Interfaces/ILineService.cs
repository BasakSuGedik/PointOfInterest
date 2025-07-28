using WebApplication2.DTOs;
using WebApplication2.Responses;

namespace WebApplication2.Services.Interfaces
{
    public interface ILineService
    {
        Task<ApiResponse<IEnumerable<LineDto>>> GetAllLinesAsync();
        Task<ApiResponse<LineDto>> GetByIdAsync(int id);
        Task<ApiResponse<LineDto>> AddLineAsync(LineCreateDto dto);
        Task<ApiResponse<LineDto>> UpdateLineAsync(int id, LineCreateDto dto);
        Task<ApiResponse<string>> DeleteLineAsync(int id);
    }
}
