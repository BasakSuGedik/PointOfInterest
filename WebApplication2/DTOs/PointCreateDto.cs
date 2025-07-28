using System.ComponentModel.DataAnnotations;

namespace WebApplication2.DTOs
{
    public class PointCreateDto
    {
        [Required]
        public string WKT { get; set; }

        [Required]
        [StringLength(20)]
        public string Name { get; set; }
    }
}
