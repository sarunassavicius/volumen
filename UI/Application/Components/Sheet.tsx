import * as React from "react";
import { HotTable } from "@handsontable/react";
import { Sheet as SheetModel } from "../Models/Sheet";
import { Application } from "../Application";
import { Essence } from "@savicius.lt/essence-js";

class SheetState {
    public sheet: SheetModel;
}

export interface ISheetProperties {
    app: Application;
    sheet: SheetModel;
    onCellClick: (value: string) => void;
}

export class Sheet extends React.Component<ISheetProperties, SheetState> {
    private data: Array<Array<string>>;

    public sheet: HotTable;

    constructor(props: any, context: any) {
        super(props, context);

        this.data = [];

        if (!this.props.sheet.rows) {
            for (let i = 0; i < 1000; i++) {
                this.data.push(["", "", ""]);
            }
        }
    }

    public componentWillReceiveProps(props: ISheetProperties): void {
        if (props.sheet && props.sheet.rows) {
            if (this.state.sheet && props.sheet.id === this.state.sheet.id) {
                return;
            }

            this.data = [];

            for (let i in props.sheet.rows) {
                let row = props.sheet.rows[i];
                let cell0 = row.cells[0];
                let cell1 = row.cells[1];
                let cell2 = row.cells[2];

                this.data.push([cell0, cell1, cell2]);
            }

            this.setState({ sheet: props.sheet });
        }
    }

    public componentDidMount(): void {
        this.sheet.hotInstance.selectCell(0, 0);

        this.sheet.hotInstance.addHook("afterChange", (changes: Array<any>, source: string) => {
            if (changes) {
                this.props.app.cache.onCellChange(this.props.sheet.id, changes[0][0], changes[0][1], changes[0][2], changes[0][3]);
            }
        });

        this.sheet.hotInstance.addHook("afterOnCellMouseUp", (e: MouseEvent, coords: object, td: HTMLTableCellElement) => {
            if (Essence.hasClass(td, "ht__highlight")) {
                this.props.onCellClick("");
                return;
            }

            this.props.onCellClick(td.innerText);
        });

        this.sheet.hotInstance.addHook("afterDocumentKeyDown", (e: KeyboardEvent) => {
            let cls = (e.target as Element).getAttribute("class");
            if (cls !== "handsontableInput") {
                return true;
            }

            if (e.keyCode === 13) {
                let coords = this.sheet.hotInstance.getSelected();

                if (coords && coords.length > 0) {
                    let fc = coords[0];
                    let r = fc[0];
                    let c = fc[1];
                    let cell = this.sheet.hotInstance.getCell(r, c);

                    if (cell) {
                        this.props.onCellClick((cell as HTMLElement).innerText);
                    }
                }

                return;
            }

            let editor = Essence(".handsontableInput");
            if (!editor) {
                return;
            }

            let txt = (editor.getElement() as HTMLInputElement).value;
            let key = e.key;

            if (key.length > 1) {
                key = "";
            }

            this.props.onCellClick(txt + key);
        });
    }

    private colWidth(col: any): number {
        if (this.props.sheet.name === "Lapas2" && col === 1) {
            return 700;
        }
        return 50;
    }

    public render() {
        return <div className="sheet-container">
             <HotTable ref={sheet => this.sheet = sheet} data={this.data} colHeaders={true} rowHeaders={true} stretchH="all" manualColumnResize={true} manualRowResize={true} colWidths={(col) => this.colWidth(col)}
                outsideClickDeselects={false} wordWrap={false}/>
        </div>;
    }
}