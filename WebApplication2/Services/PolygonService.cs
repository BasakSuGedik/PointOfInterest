using NetTopologySuite.IO;
using WebApplication2.Models;
using WebApplication2.Repositories.Interfaces;
using WebApplication2.Services.Interfaces;
using WebApplication2.DTOs;
using WebApplication2.Responses;
using NetTopologySuite.Geometries;
using WebApplication2.Repositories;
using Polygon = WebApplication2.Models.Polygon;
namespace WebApplication2.Services
{
    public class PolygonService : IPolygonService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly WKTReader _reader;


        public PolygonService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
            _reader = new WKTReader();
        }

        public async Task<ApiResponse<IEnumerable<PolygonDto>>> GetAllPolygonsAsync()
        {
            try
            {
                var polygons = await _unitOfWork.Polygons.GetAllAsync();

                var dtoList = polygons.Select(p => new PolygonDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    WKT = !string.IsNullOrWhiteSpace(p.WKT)
                        ? p.WKT
                        : (p.Geometry != null ? p.Geometry.AsText() : "")
                });
                return ApiResponse<IEnumerable<PolygonDto>>.SuccessResponse(dtoList);
            }
            catch (Exception ex)
            {

                return ApiResponse<IEnumerable<PolygonDto>>.ErrorResponse("Error: " + ex.Message);
            }
        }

        public async Task<ApiResponse<PolygonDto>> GetByIdAsync(int id)
        {
            try
            {
                var polygon = await _unitOfWork.Polygons.GetByIdAsync(id);
                if (polygon == null)
                    return ApiResponse<PolygonDto>.ErrorResponse("Polygon not found");
                return ApiResponse<PolygonDto>.SuccessResponse(new PolygonDto
                {
                    Id = polygon.Id,
                    Name = polygon.Name,
                    WKT = polygon.WKT
                });
            }
            catch (Exception ex)
            {
                return ApiResponse<PolygonDto>.ErrorResponse("Error: " + ex.Message);
            }
        }

        public async Task<ApiResponse<PolygonDto>> AddPolygonAsync(PolygonCreateDto dto)
        {
            try
            {
                var geometry = _reader.Read(dto.WKT);
                geometry.SRID = 4326;

                var polygon = new Polygon
                {
                    Name = dto.Name,
                    WKT = dto.WKT,
                    Geometry = geometry
                };

                await _unitOfWork.Polygons.AddAsync(polygon);
                await _unitOfWork.SaveAsync();

                return ApiResponse<PolygonDto>.SuccessResponse(new PolygonDto
                {
                    Id = polygon.Id,
                    Name = polygon.Name,
                    WKT = polygon.WKT
                }, "Polygon saved successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse<PolygonDto>.ErrorResponse("Error: " + ex.Message);
            }
        }

        public async Task<ApiResponse<PolygonDto>> UpdatePolygonAsync(int id, PolygonCreateDto dto)
        {
            try
            {
                var polygon = await _unitOfWork.Polygons.GetByIdAsync(id);
                if (polygon == null)
                    return ApiResponse<PolygonDto>.ErrorResponse("Polygon not found");

                var geometry = _reader.Read(dto.WKT);
                geometry.SRID = 4326;

                polygon.Name = dto.Name;
                polygon.WKT = dto.WKT;
                polygon.Geometry = geometry;

                _unitOfWork.Polygons.Update(polygon);
                await _unitOfWork.SaveAsync();

                return ApiResponse<PolygonDto>.SuccessResponse(new PolygonDto
                {
                    Id = polygon.Id,
                    Name = polygon.Name,
                    WKT = polygon.WKT
                }, "Polygon updated successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse<PolygonDto>.ErrorResponse("Error: " + ex.Message);
            }
        }

        public async Task<ApiResponse<string>> DeletePolygonAsync(int id)
        {
            try
            {
                var polygon = await _unitOfWork.Polygons.GetByIdAsync(id);
                if (polygon == null)
                    return ApiResponse<string>.ErrorResponse("Polygon not found");

                _unitOfWork.Polygons.Delete(polygon);
                await _unitOfWork.SaveAsync();

                return ApiResponse<string>.SuccessResponse(null, "Polygon deleted successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse<string>.ErrorResponse("Error: " + ex.Message);
            }
        }
    }
}
