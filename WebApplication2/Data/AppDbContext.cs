using Microsoft.EntityFrameworkCore;
using WebApplication2.Models;

namespace WebApplication2.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Point> Points { get; set; }
        public DbSet<Line> Lines { get; set; }
        public DbSet<Polygon> Polygons { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Point Entity
            modelBuilder.Entity<Point>(entity =>
            {
                entity.Property(e => e.Geometry).HasColumnType("geometry");
            });

            // Line Entity
            modelBuilder.Entity<Line>(entity =>
            {
                entity.Property(e => e.Geometry).HasColumnType("geometry");
            });

            // Polygon Entity
            modelBuilder.Entity<Polygon>(entity =>
            {
                entity.Property(e => e.Geometry).HasColumnType("geometry");
            });

            base.OnModelCreating(modelBuilder);
        }
    }
}
