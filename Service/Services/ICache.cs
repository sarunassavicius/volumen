using System.Collections.Generic;
using Volumen.Models;

namespace Service.Services
{
    public interface ICache
    {
        void CellChange(string sheetId, string rowId, string cellId, string value);
        void Reset();
        void AddSheet(Sheet sheet);
        bool HasChanges();
        Dictionary<string, Row> GetRowsIds(string sheetId);
        ICollection<Sheet> GetSheets();
        Sheet GetSheet(string sheetId);
    }
}
