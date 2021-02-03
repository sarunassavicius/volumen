using System.Collections.Generic;

namespace Volumen.Models
{
    public class Row
    {
        public int Height { get; set; }
        public Dictionary<string, string> Cells { get; set; }

        public Row()
        {
            Cells = new Dictionary<string, string>();
        }
    }
}
