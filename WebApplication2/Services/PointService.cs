using Microsoft.EntityFrameworkCore;
using WebApplication2.Models;
using WebApplication2.Responses;
using WebApplication2.Services.Interfaces;
using WebApplication2.Data;
using WebApplication2.DTOs;
using NetTopologySuite.IO;
using NetTopologySuite.Geometries;
using Point = WebApplication2.Models.Point;
using WebApplication2.Repositories.Interfaces;

namespace WebApplication2.Services
{
    public class PointService : IPointService
    {

        private readonly IUnitOfWork _unitOfWork;
        private readonly WKTReader _reader;

        public PointService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
            _reader = new WKTReader();
        }


        public async Task<ApiResponse<IEnumerable<PointDto>>> GetAllPointsAsync()
        {
            try
            {
                var points = await _unitOfWork.Points.GetAllAsync();

                var dtoList = points.Select(p => new PointDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    WKT = !string.IsNullOrWhiteSpace(p.WKT)
                        ? p.WKT
                        : (p.Geometry != null ? p.Geometry.AsText() : "") // NULL kontrolü
                });

                return ApiResponse<IEnumerable<PointDto>>.SuccessResponse(dtoList);
            }
            catch (Exception ex)
            {
                return ApiResponse<IEnumerable<PointDto>>.ErrorResponse("Error: " + ex.Message);
            }
        }


        public async Task<ApiResponse<PointDto>> GetByIdAsync(int id)
        {
            try
            {
                var point = await _unitOfWork.Points.GetByIdAsync(id);
                if (point == null)
                    return ApiResponse<PointDto>.ErrorResponse("Point not found");

                var dto = new PointDto
                {
                    Id = point.Id,
                    Name = point.Name,
                    WKT = point.WKT
                };

                return ApiResponse<PointDto>.SuccessResponse(dto);
            }
            catch (Exception ex)
            {
                return ApiResponse<PointDto>.ErrorResponse("Error: " + ex.Message);
            }
        }

        public async Task<ApiResponse<PointDto>> AddPointAsync(PointCreateDto dto)
        {
            try
            {
                var geometry = _reader.Read(dto.WKT);
                geometry.SRID = 4326; // varsayılan SRID

                var point = new Point
                {
                    Name = dto.Name,
                    WKT = dto.WKT,
                    Geometry = geometry
                };

                await _unitOfWork.Points.AddAsync(point);
                await _unitOfWork.SaveAsync();

                var resultDto = new PointDto
                {
                    Id = point.Id,
                    Name = point.Name,
                    WKT = point.WKT
                };

                return ApiResponse<PointDto>.SuccessResponse(resultDto, "Point saved successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse<PointDto>.ErrorResponse("Error: " + ex.Message);
            }
        }

        public async Task<ApiResponse<PointDto>> UpdatePointAsync(int id, PointCreateDto updated)
        {
            try
            {
                var point = await _unitOfWork.Points.GetByIdAsync(id);
                if (point == null)
                    return ApiResponse<PointDto>.ErrorResponse("Point not found");

                var geometry = _reader.Read(updated.WKT);
                geometry.SRID = 4326;

                point.Name = updated.Name;
                point.WKT = updated.WKT;
                point.Geometry = geometry;

                _unitOfWork.Points.Update(point);
                await _unitOfWork.SaveAsync();

                var dto = new PointDto
                {
                    Id = point.Id,
                    Name = point.Name,
                    WKT = point.WKT
                };

                return ApiResponse<PointDto>.SuccessResponse(dto, "Point updated successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse<PointDto>.ErrorResponse("Error: " + ex.Message);
            }
        }

        public async Task<ApiResponse<string>> DeletePointAsync(int id)
        {
            try
            {
                var point = await _unitOfWork.Points.GetByIdAsync(id);
                if (point == null)
                    return ApiResponse<string>.ErrorResponse("Point not found");

                _unitOfWork.Points.Delete(point);
                await _unitOfWork.SaveAsync();

                return ApiResponse<string>.SuccessResponse(null, "Point deleted successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse<string>.ErrorResponse("Error: " + ex.Message);
            }
        }
    }
}
