using WebApplication2.Models;
using WebApplication2.Responses;
using WebApplication2.DTOs;

namespace WebApplication2.Services.Interfaces
{
    public interface IPointService
    {
        Task<ApiResponse<IEnumerable<PointDto>>> GetAllPointsAsync();
        Task<ApiResponse<PointDto>> GetByIdAsync(int id);
        Task<ApiResponse<PointDto>> AddPointAsync(PointCreateDto dto);
        Task<ApiResponse<PointDto>> UpdatePointAsync(int id, PointCreateDto dto);
        Task<ApiResponse<string>> DeletePointAsync(int id);
    }
}
