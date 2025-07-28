using NetTopologySuite.Geometries;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebApplication2.Models
{
    [Table("point")]
    public class Point
    {
        [Key, Required]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public string WKT { get; set; }

        [Required]
        [StringLength(30, ErrorMessage = "Name length can't be more than 30 character.")]
        public string Name { get; set; }

        public Geometry Geometry { get; set; }

    }

}
