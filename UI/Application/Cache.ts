import { Sheet } from "./Models/Sheet";
import { CellChangeRequest } from "./DTO/CellChangeRequest";
import { Essence } from "@savicius.lt/essence-js";

export class Cache {
    private documentPath: string;
    private sheets: {[id: string]: Sheet};

    constructor(documentPath: string) {
        this.sheets = {};
        this.documentPath = documentPath;
    }

    public onCellChange(sheetId: string, row: number, col: number, oldValue: string, newValue: string): void {
        if (oldValue === newValue) {
            return;
        }

        let request = new CellChangeRequest();
        request.file = this.documentPath;
        request.sheetId = sheetId;
        request.rowId = row.toString();
        request.cellId = col.toString();
        request.value = newValue;

        Essence.post<object>("http://localhost:10001/sheet/cell-change", request);
    }
}