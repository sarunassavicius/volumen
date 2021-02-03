using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Service.Services;
using Volumen.DTO;
using Volumen.Models;

namespace Service.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class SheetController : Controller
    {
        private const int DefaultSheetRowCount = 65000;

        private readonly IDocumentService documentService;
        private readonly ICache cache;

        public SheetController(IDocumentService documentService, ICache cache)
        {
            this.documentService = documentService;
            this.cache = cache;
        }

        [HttpGet("load/{file}/{id}")]
        public IActionResult Load(string file, string id)
        {
            if (!System.IO.File.Exists(file))
            {
                return BadRequest();
            }

            var sheet = documentService.LoadSheet(file, id);

            if (cache.HasChanges())
            {
                var rows = cache.GetRowsIds(sheet.Id);
                if (rows != null)
                {
                    foreach (var row in sheet.Rows.Where(r => rows.Keys.Contains(r.Key)).ToList())
                    {
                        var cachedRow = rows[row.Key];
                        foreach (var cell in row.Value.Cells.Where(c => cachedRow.Cells.Keys.Contains(c.Key)).ToList())
                        {
                            row.Value.Cells[cell.Key] = cachedRow.Cells[cell.Key];
                        }
                    }
                }
            }

            return Json(sheet);
        }

        [HttpPost("cell-change")]
        public IActionResult CellChange([FromBody] CellChangeRequest request)
        {
            cache.CellChange(request.SheetId, request.RowId, request.CellId, request.Value);
            return Ok();
        }

        [HttpPost("add/{file}/{name}")]
        public IActionResult Add(string file, string name)
        {
            if (!System.IO.File.Exists(file) || string.IsNullOrEmpty(name.Trim()))
            {
                return BadRequest();
            }

            name = name.Trim();

            if (cache.GetSheets().Any(s => s.Name == name))
            {
                return BadRequest();
            }

            var sheet = new Sheet
            {
                Id = Guid.NewGuid().ToString("D"),
                Name = name,
                Columns = new List<Column>
                {
                    new Column
                    {
                        Name = "A"
                    },
                    new Column
                    {
                        Name = "B"
                    },
                    new Column
                    {
                        Name = "C"
                    }
                },
                Rows = new Dictionary<string, Row>()
            };

            for (var i = 0; i < DefaultSheetRowCount + 1; i++)
            {
                sheet.Rows[i.ToString(CultureInfo.InvariantCulture)] = new Row
                {
                    Height = 0,
                    Cells = new Dictionary<string, string>
                    {
                        {"0", string.Empty}
                    }
                };
            }

            cache.AddSheet(sheet);

            return Json(sheet);
        }

        [HttpPost("rename/{file}/{id}/{name}")]
        public IActionResult Rename(string file, string id, string name)
        {
            if (!System.IO.File.Exists(file) || string.IsNullOrEmpty(id.Trim()) || string.IsNullOrEmpty(name.Trim()))
            {
                return BadRequest();
            }

            name = name.Trim();

            var sheet = cache.GetSheets().SingleOrDefault(s => s.Id == id);
            if (sheet == null)
            {
                sheet = documentService.LoadSheet(file, id);
                if (sheet == null)
                {
                    return BadRequest();
                }

                cache.AddSheet(sheet);
            }

            sheet.Name = name;

            return Ok();
        }

        [HttpPost("remove/{file}/{id}")]
        public IActionResult Remove(string file, string id)
        {
            if (!System.IO.File.Exists(file) || string.IsNullOrEmpty(id.Trim()))
            {
                return BadRequest();
            }

            var sheet = cache.GetSheets().SingleOrDefault(s => s.Id == id);
            if (sheet == null)
            {
                sheet = documentService.LoadSheet(file, id);
                if (sheet == null)
                {
                    return BadRequest();
                }

                cache.AddSheet(sheet);
            }

            sheet.Deleted = true;

            return Ok();
        }
    }
}
