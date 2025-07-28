using NetTopologySuite.Geometries;
using WebApplication2.Models;
using Point = WebApplication2.Models.Point;
using Polygon = WebApplication2.Models.Polygon;

namespace WebApplication2.Repositories.Interfaces
{
    public interface IUnitOfWork
    {
        IGenericRepository<Point> Points { get; }
        IGenericRepository<Line> Lines { get; }
        
        IGenericRepository<Polygon> Polygons { get; }

        Task<int> SaveAsync();
    }
}
