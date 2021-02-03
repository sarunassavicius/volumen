using System;
using System.IO;
using System.IO.Packaging;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Service.Services;
using Volumen;
using Volumen.DTO;
using Volumen.Models;

namespace Service.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class DocumentController : Controller
    {
        private readonly IDocumentService documentService;
        private readonly ICache cache;

        public DocumentController(IDocumentService documentService, ICache cache)
        {
            this.documentService = documentService;
            this.cache = cache;
        }

        [HttpGet("load/{file}")]
        public IActionResult Load(string file)
        {
            if (!System.IO.File.Exists(file))
            {
                return BadRequest();
            }

            var result = documentService.LoadDocumentWithActiveSheet(file);

            cache.Reset();

            return Json(new LoadDocumentResponse
            {
                Document = result.Item1,
                ActiveSheet = result.Item2
            });
        }

        [HttpPost("save/{file}/{activeSheetId}")]
        public IActionResult Save(string file, string activeSheetId)
        {
            if (!System.IO.File.Exists(file))
            {
                return BadRequest();
            }

            using (var p = Package.Open(file, FileMode.Open, FileAccess.ReadWrite, FileShare.Read))
            {
                var docUri = new Uri("/Document.json", UriKind.Relative);
                var documentpart = p.GetPart(docUri);

                Document document;
                using (var stream = documentpart.GetStream(FileMode.Open))
                {
                    var reader = new StreamReader(stream);
                    document = JsonConvert.DeserializeObject<Document>(reader.ReadToEnd());
                }

                document.Date = DateTime.Now;

                var cachedSheets = cache.GetSheets();

                foreach (var cachedSheet in cachedSheets)
                {
                    var sheet = cachedSheet;

                    if (document.Sheets.ContainsKey(cachedSheet.Id))
                    {
                        if (sheet.Deleted)
                        {
                            document.Sheets.Remove(sheet.Id);
                            documentService.RemoveSheet(p, sheet.Id);

                            continue;
                        }

                        sheet = documentService.LoadSheet(p, cachedSheet.Id);
                    }

                    document.Sheets[sheet.Id] = sheet.Name;
                    if (sheet.Id == activeSheetId)
                    {
                        document.ActiveSheetId = activeSheetId;
                    }

                    foreach (var cahcedRow in cachedSheet.Rows.ToList())
                    {
                        if (sheet.Rows.ContainsKey(cahcedRow.Key))
                        {
                            var row = sheet.Rows[cahcedRow.Key];
                            foreach (var cachedCell in cahcedRow.Value.Cells.ToList())
                            {
                                row.Cells[cachedCell.Key] = cachedCell.Value;
                            }
                        }
                        else
                        {
                            sheet.Rows[cahcedRow.Key] = cahcedRow.Value;
                        }
                    }

                    documentService.SaveSheet(p, sheet);
                }

                p.DeletePart(docUri);
                
                var docPart = p.CreatePart(docUri, "", CompressionOption.Normal);

                using var stringStream = Streams.GenerateStreamFromString(JsonConvert.SerializeObject(document, Formatting.Indented));
                using var dest = docPart.GetStream();

                Streams.CopyStream(stringStream, dest);
            }

            return Ok();
        }
    }
}
