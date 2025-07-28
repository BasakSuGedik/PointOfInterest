using WebApplication2.DTOs;
using WebApplication2.Responses;

namespace WebApplication2.Services.Interfaces
{
    public interface IPolygonService
    {
        Task<ApiResponse<IEnumerable<PolygonDto>>> GetAllPolygonsAsync();
        Task<ApiResponse<PolygonDto>> GetByIdAsync(int id);
        Task<ApiResponse<PolygonDto>> AddPolygonAsync(PolygonCreateDto dto);
        Task<ApiResponse<PolygonDto>> UpdatePolygonAsync(int id, PolygonCreateDto dto);
        Task<ApiResponse<string>> DeletePolygonAsync(int id);
    }
}
