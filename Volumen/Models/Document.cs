using System;
using System.Collections.Generic;

namespace Volumen.Models
{
    [Serializable]
    public class Document
    {
        public bool IsArchived { get; set; }
        public DateTime Date { get; set; }
        public string ActiveSheetId { get; set; }

        public Dictionary<string, string> Sheets { get; set; }

        public Document()
        {
            Sheets = new Dictionary<string, string>();
            Date = DateTime.Now;
        }
    }
}
