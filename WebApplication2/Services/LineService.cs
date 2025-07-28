using NetTopologySuite.IO;
using WebApplication2.Models;
using WebApplication2.Repositories.Interfaces;
using WebApplication2.Services.Interfaces;
using WebApplication2.DTOs;
using WebApplication2.Responses;
using NetTopologySuite.Geometries;
using WebApplication2.Repositories;

namespace WebApplication2.Services
{
    public class LineService : ILineService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly WKTReader _reader;

        public LineService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
            _reader = new WKTReader();
        }

        public async Task<ApiResponse<IEnumerable<LineDto>>> GetAllLinesAsync()
        {
            try
            {
                var lines = await _unitOfWork.Lines.GetAllAsync();
                var dtoList = lines.Select(l => new LineDto
                {
                    Id = l.Id,
                    Name = l.Name,
                    WKT = !string.IsNullOrWhiteSpace(l.WKT)
                        ? l.WKT
                        : (l.Geometry != null ? l.Geometry.AsText() : "")
                });

                return ApiResponse<IEnumerable<LineDto>>.SuccessResponse(dtoList);
            }
            catch (Exception ex)
            {
                return ApiResponse<IEnumerable<LineDto>>.ErrorResponse("Error: " + ex.Message);
            }
        }

        public async Task<ApiResponse<LineDto>> GetByIdAsync(int id)
        {
            try
            {
                var line = await _unitOfWork.Lines.GetByIdAsync(id);
                if (line == null)
                    return ApiResponse<LineDto>.ErrorResponse("Line not found");

                return ApiResponse<LineDto>.SuccessResponse(new LineDto
                {
                    Id = line.Id,
                    Name = line.Name,
                    WKT = line.WKT
                });
            }
            catch (Exception ex)
            {
                return ApiResponse<LineDto>.ErrorResponse("Error: " + ex.Message);
            }
        }

        public async Task<ApiResponse<LineDto>> AddLineAsync(LineCreateDto dto)
        {
            try
            {
                var geometry = _reader.Read(dto.WKT);
                geometry.SRID = 4326;

                var line = new Line
                {
                    Name = dto.Name,
                    WKT = dto.WKT,
                    Geometry = geometry
                };

                await _unitOfWork.Lines.AddAsync(line);
                await _unitOfWork.SaveAsync();

                return ApiResponse<LineDto>.SuccessResponse(new LineDto
                {
                    Id = line.Id,
                    Name = line.Name,
                    WKT = line.WKT
                }, "Line saved successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse<LineDto>.ErrorResponse("Error: " + ex.Message);
            }
        }

        public async Task<ApiResponse<LineDto>> UpdateLineAsync(int id, LineCreateDto dto)
        {
            try
            {
                var line = await _unitOfWork.Lines.GetByIdAsync(id);
                if (line == null)
                    return ApiResponse<LineDto>.ErrorResponse("Line not found");

                var geometry = _reader.Read(dto.WKT);
                geometry.SRID = 4326;

                line.Name = dto.Name;
                line.WKT = dto.WKT;
                line.Geometry = geometry;

                _unitOfWork.Lines.Update(line);
                await _unitOfWork.SaveAsync();

                return ApiResponse<LineDto>.SuccessResponse(new LineDto
                {
                    Id = line.Id,
                    Name = line.Name,
                    WKT = line.WKT
                }, "Line updated successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse<LineDto>.ErrorResponse("Error: " + ex.Message);
            }
        }

        public async Task<ApiResponse<string>> DeleteLineAsync(int id)
        {
            try
            {
                var line = await _unitOfWork.Lines.GetByIdAsync(id);
                if (line == null)
                    return ApiResponse<string>.ErrorResponse("Line not found");

                _unitOfWork.Lines.Delete(line);
                await _unitOfWork.SaveAsync();

                return ApiResponse<string>.SuccessResponse(null, "Line deleted successfully");
            }
            catch (Exception ex)
            {
                return ApiResponse<string>.ErrorResponse("Error: " + ex.Message);
            }
        }
    }
}
