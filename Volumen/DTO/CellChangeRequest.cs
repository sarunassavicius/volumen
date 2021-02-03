namespace Volumen.DTO
{
    public class CellChangeRequest
    {
        public string File { get; set; }
        public string SheetId { get; set; }
        public string RowId { get; set; }
        public string CellId { get; set; }
        public string Value { get; set; }
    }
}
