using WebApplication2.Services.Interfaces;
using WebApplication2.Services;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using WebApplication2.Data;
using WebApplication2.Repositories.Interfaces;
using WebApplication2.Repositories;
using WebApplication2.Models;
using Polygon = WebApplication2.Models.Polygon;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000") // React frontend adresi
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<IPointService, PointService>();
builder.Services.AddScoped<IGenericRepository<Line>, GenericRepository<Line>>();
builder.Services.AddScoped<ILineService, LineService>();
builder.Services.AddScoped<IGenericRepository<Polygon>, GenericRepository<Polygon>>();
builder.Services.AddScoped<IPolygonService, PolygonService>();

builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"),
        x => x.UseNetTopologySuite()));


// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseRouting();

app.UseCors("AllowReactApp");

app.UseAuthorization();

app.MapControllers();

app.Run();
