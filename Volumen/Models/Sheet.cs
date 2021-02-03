using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Volumen.Models
{
    public class Sheet
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public bool Deleted { get; set; }
        
        public List<Column> Columns { get; set; }
        public Dictionary<string, Row> Rows { get; set; }

        public Sheet()
        {
            Columns = new List<Column>();
            Rows = new Dictionary<string, Row>();
        }
    }
}
