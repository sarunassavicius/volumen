using System;
using System.IO;
using System.IO.Packaging;
using System.Linq;
using Newtonsoft.Json;
using Volumen;
using Volumen.Models;

namespace Service.Services
{
    public class DocumentService: IDocumentService
    {
        private readonly ICache cache;

        public DocumentService(ICache cache)
        {
            this.cache = cache;
        }

        private Document ReadDocument(Package package)
        {
            Document document;

            var documentPart = package.GetPart(new Uri("/Document.json", UriKind.Relative));
            using (var stream = documentPart.GetStream(FileMode.Open))
            {
                var reader = new StreamReader(stream);
                document = JsonConvert.DeserializeObject<Document>(reader.ReadToEnd());
            }

            if (string.IsNullOrEmpty(document.ActiveSheetId))
            {
                document.ActiveSheetId = document.Sheets.Keys.First();
            }

            return document;
        }

        public Document LoadDocument(string file)
        {
            Document document;

            using (var p = Package.Open(file, FileMode.Open))
            {
                document = ReadDocument(p);
            }

            return document;
        }

        public (Document, Sheet) LoadDocumentWithActiveSheet(string file)
        {
            Document document;
            Sheet sheet;

            using (var p = Package.Open(file, FileMode.Open))
            {
                document = ReadDocument(p);

                var sheetPart = p.GetPart(new Uri($"/{document.ActiveSheetId}.json", UriKind.Relative));
                using var stream = sheetPart.GetStream(FileMode.Open);
                var reader = new StreamReader(stream);

                sheet = JsonConvert.DeserializeObject<Sheet>(reader.ReadToEnd());
            }

            return (document, sheet);
        }

        public Sheet LoadSheet(string file, string id)
        {
            using var p = Package.Open(file, FileMode.Open, FileAccess.Read, FileShare.Read);

            return LoadSheet(p, id);
        }

        public Sheet LoadSheet(Package package, string id)
        {
            var sheet = cache.GetSheets().SingleOrDefault(s => s.Id == id);
            if (sheet != null)
            {
                return sheet;
            }

            var sheetPart = package.GetPart(new Uri($"/{id}.json", UriKind.Relative));
            using var stream = sheetPart.GetStream(FileMode.Open);
            var reader = new StreamReader(stream);

            return JsonConvert.DeserializeObject<Sheet>(reader.ReadToEnd());
        }

        public void SaveSheet(Package package, Sheet sheet)
        {
            var uri = new Uri($"/{sheet.Id}.json", UriKind.Relative);
            package.DeletePart(uri);

            var sheetPart = package.CreatePart(uri, "", CompressionOption.Normal);

            using var stringStream = Streams.GenerateStreamFromString(JsonConvert.SerializeObject(sheet, Formatting.Indented));
            using Stream dest = sheetPart.GetStream();

            Streams.CopyStream(stringStream, dest);
        }

        public void RemoveSheet(Package package, string sheetId)
        {
            var uri = new Uri($"/{sheetId}.json", UriKind.Relative);
            package.DeletePart(uri);
        }
    }
}
