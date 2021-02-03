using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using Volumen.Models;

namespace Service.Services
{
    public class Cache : ICache
    {
        private static ConcurrentDictionary<string, Sheet> cache = new ConcurrentDictionary<string, Sheet>();

        public void CellChange(string sheetId, string rowId, string cellId, string value)
        {
            if (cache.ContainsKey(sheetId))
            {
                cache.TryGetValue(sheetId, out var sheet);

                if (sheet.Rows.ContainsKey(rowId))
                {
                    sheet.Rows[rowId].Cells[cellId] = value;
                }
                else
                {
                    sheet.Rows[rowId] = new Row
                    {
                        Cells = new Dictionary<string, string>
                        {
                            {cellId, value}
                        }
                    };
                }
            }
            else
            {
                var sheet = new Sheet
                {
                    Id = sheetId,
                    Rows = new Dictionary<string, Row>
                    {
                        { rowId, new Row
                        {
                            Cells = new Dictionary<string, string>
                            {
                                {cellId, value}
                            }
                        }}
                    }
                };

                cache[sheetId] = sheet;
            }
        }

        private string GetCellValue(string sheetId, string rowId, string cellId, string value)
        {
            if (!cache.ContainsKey(sheetId))
            {
                return value;
            }

            cache.TryGetValue(sheetId, out var sheet);

            if (!sheet.Rows.ContainsKey(rowId))
            {
                return value;
            }

            var row = sheet.Rows[rowId];

            if (!row.Cells.ContainsKey(cellId))
            {
                return value;
            }

            var cell = row.Cells[cellId];
            if (string.Compare(cell, value, StringComparison.InvariantCulture) != 0)
            {
                return cell;
            }

            return value;
        }

        public void Reset()
        {
            cache = new ConcurrentDictionary<string, Sheet>();
        }

        public bool HasChanges()
        {
            return cache.Keys.Count > 0;
        }

        public Dictionary<string, Row> GetRowsIds(string sheetId)
        {
            if (cache.ContainsKey(sheetId))
            {
                cache.TryGetValue(sheetId, out var sheet);
                return sheet.Rows;
            }

            return null;
        }

        public ICollection<Sheet> GetSheets()
        {
            return cache.Values;
        }

        public void AddSheet(Sheet sheet)
        {
            if (cache.ContainsKey(sheet.Id))
            {
                throw new ArgumentException($"Sheet with ID {sheet.Id} already exists!");
            }

            cache.TryAdd(sheet.Id, sheet);
        }

        public Sheet GetSheet(string sheetId)
        {
            if (!cache.ContainsKey(sheetId))
            {
                return null;
            }

            cache.TryGetValue(sheetId, out var sheet);

            return sheet;

        }
    }
}
