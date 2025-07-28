using System.ComponentModel.DataAnnotations;

namespace WebApplication2.DTOs
{
    public class LineCreateDto
    {
        [Required]
        public string Name { get; set; }

        [Required]
        public string WKT { get; set; }
    }
}
