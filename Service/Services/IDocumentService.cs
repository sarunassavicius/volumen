using System.IO.Packaging;
using Volumen.Models;

namespace Service.Services
{
    public interface IDocumentService
    {
        Document LoadDocument(string file);
        (Document, Sheet) LoadDocumentWithActiveSheet(string file);
        Sheet LoadSheet(string file, string id);
        Sheet LoadSheet(Package package, string id);
        void SaveSheet(Package package, Sheet sheet);
        void RemoveSheet(Package package, string sheetId);
    }
}
