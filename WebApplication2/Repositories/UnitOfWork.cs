using NetTopologySuite.Geometries;
using WebApplication2.Data;
using WebApplication2.Models;
using WebApplication2.Repositories.Interfaces;
using Point = WebApplication2.Models.Point;
using Polygon = WebApplication2.Models.Polygon;

namespace WebApplication2.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly AppDbContext _context;

        public IGenericRepository<Point> Points { get; }
        public IGenericRepository<Line> Lines { get; }
        
        public IGenericRepository<Polygon> Polygons { get; }

        public UnitOfWork(AppDbContext context,
                          IGenericRepository<Point> points,
                          IGenericRepository<Line> lines,
                          IGenericRepository<Polygon> polygons)
        {
            _context = context;
            Points = points;
            Lines = lines;
            Polygons = polygons;
        }

        public async Task<int> SaveAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}
