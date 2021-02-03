using Volumen.Models;

namespace Volumen.DTO
{
    public class LoadDocumentResponse
    {
        public Document Document { get; set; }
        public Sheet ActiveSheet { get; set; }
    }
}
