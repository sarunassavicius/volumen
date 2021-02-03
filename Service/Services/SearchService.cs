using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Volumen.DTO;

namespace Service.Services
{
    public class SearchService : ISearchService
    {
        private bool shouldStop = false;

        private readonly IDocumentService documentService;
        private readonly ICache cache;

        private object lockObject = new object();

        public SearchService(IDocumentService documentService, ICache cache)
        {
            this.documentService = documentService;
            this.cache = cache;
        }

        public async Task<List<SearchResult>> Find(string file, string key)
        {
            shouldStop = false;

            var result = new List<SearchResult>();
            var document = documentService.LoadDocument(file);
            var threads = Environment.ProcessorCount * 2;

            var sheetIds = document.Sheets.Keys.ToList();
            sheetIds.AddRange(cache.GetSheets().Where(s => !s.Deleted).Select(s => s.Id));
            sheetIds = sheetIds.Distinct().ToList();

            var tasks = new List<Task<List<SearchResult>>>();
            foreach (var sheetId in sheetIds)
            {
                tasks.Add(GetSearchTask(file, sheetId, key));
            }

            await Task.WhenAll(tasks);

            foreach (var task in tasks)
            {
                result.AddRange(task.Result);
            }

            return result;
        }

        public void Stop()
        {
            shouldStop = true;
        }

        private Task<List<SearchResult>> GetSearchTask(string file, string sheetId, string key)
        {
            return Task.Run(() =>
            {
                var result = new List<SearchResult>();
                if (shouldStop)
                {
                    return result;
                }

                var sheet = cache.GetSheet(sheetId) ?? documentService.LoadSheet(file, sheetId);

                foreach (var rowId in sheet.Rows.Keys)
                {
                    if (shouldStop)
                    {
                        break;
                    }

                    var row = sheet.Rows[rowId];
                    foreach (var cellId in row.Cells.Keys)
                    {
                        var cell = row.Cells[cellId];
                        if (cell.IndexOf(key, StringComparison.OrdinalIgnoreCase) >= 0)
                        {
                            result.Add(new SearchResult
                            {
                                SheetId = sheetId,
                                CellId = cellId,
                                RowId = rowId,
                                Value = cell,
                                SheetName = sheet.Name
                            });
                        }
                    }
                }

                return result;
            });
        } 
    }
}
