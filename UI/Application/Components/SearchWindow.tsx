import "../Style/search-window.scss";

import * as React from "react";
import * as Electron from "electron";
import { Essence, EssenceElement } from "@savicius.lt/essence-js";
import { HotTable } from "@handsontable/react";
import { Application } from "../Application";
import { SearchResult } from "../DTO/SearchResult";

class SearchWindowState {
    public key: string;
    public visible: boolean;
    public loading: boolean;
}

export interface ISearchWindowProperties {
    app: Application;
    visible: boolean;
}

export class SearchWindow extends React.Component<ISearchWindowProperties, SearchWindowState> {
    private container: EssenceElement;
    private win: EssenceElement;
    private grid: HotTable;
    private data: Array<Array<string>>;
    private resultCountText: string;
    private results: SearchResult[];

    private columnIdToName: {[id: string]: string} = {
        "0": "A",
        "1": "B",
        "2": "C"
    };

    constructor(props: any, context: any) {
        super(props, context);

        this.data = [];
    }

    public componentDidMount(): void {
        this.container = Essence("#searchWindowContainer");
        this.win = Essence("#searchWindow");

        if (this.props.visible) {
            this.show();
        }
        if (!this.props.visible) {
            this.hide();
        }

        this.grid.hotInstance.addHook("beforeOnCellMouseDown", (event: any, coords: any) => {
            event.stopImmediatePropagation();
        });

        this.grid.hotInstance.addHook("afterRender", (isForced: boolean) => {
        });

        this.grid.hotInstance.addHook("afterOnCellMouseUp", (e: MouseEvent, coords: any, td: HTMLTableCellElement) => {
            if (Essence.hasClass(td, "ht__highlight")) {
                return;
            }

            let row = this.results[coords.row] as SearchResult;
            if (!row) {
                return;
            }

            //TODO: do not navigate - only select cell if the result is on the same sheet
            this.props.app.navigateToSheet(row.sheetId, row.rowId, row.cellId);
        });
    }

    public shouldComponentUpdate(props: Readonly<ISearchWindowProperties>, state: Readonly<SearchWindowState>, context: Readonly<any>): boolean {
        return true;
    }

    public async show(): Promise<any> {
        this.container.setAttribute("style", "display: flex;");
        this.props.app.removeSheetSelection();

        await this.container.fadeIn();

        let state = new SearchWindowState();

        Object.assign(state, this.state);
        state.visible = true;

        this.setState(state);

        let input = this.win.findFirstChild("input[type=text]");
        input.focus();
        input.selectAllText();
    }

    public async hide(): Promise<any> {
        await this.container.fadeOut();

        this.props.app.restoreSheetSelection();

        let state = new SearchWindowState();

        Object.assign(state, this.state);
        state.visible = false;

        this.setState(state);
    }

    public clearSearchResults(): void {
        this.data = [];
        this.results = [];

        let state = new SearchWindowState();
        Object.assign(state, this.state);
        state.key = "";
        this.setState(state);

        this.win.getElement().removeAttribute("style");
    }

    private onCloseClick = async (e: React.MouseEvent<HTMLElement>) => {
        await this.hide();
    }

    private onSearchClick = async (e: React.MouseEvent<HTMLElement>) => {
        if (this.state.loading) {
            return;
        }

        if (!this.state.key || this.state.key.trim() === "") {
            return;
        }

        if (!this.props.app.documentPath) {
            this.showZeroResultMessage();
            return;
        }

        this.setLoadingState(true);

        this.data = [];
        document.body.style.cursor = "wait";

        this.results = (await Essence.get<SearchResult[]>(`http://localhost:10001/search/${encodeURIComponent(this.props.app.documentPath)}/${encodeURIComponent(this.state.key)}`)).data;

        if (this.results.length === 0) {
            document.body.style.cursor = "default";

            this.setLoadingState(false);
            this.results = [];
            this.resultCountText = `Rasta elementų: ${(this.results.length)}`;
            this.showZeroResultMessage();

            return;
        }

        for (let id in this.results) {
            let r = this.results[id];
            this.data.push([r.sheetName, this.columnIdToName[r.cellId] + ":" + r.rowId, r.value]);
        }

        this.resultCountText = `Rasta elementų: ${(this.results.length)}`;
        this.forceUpdate();
        this.grid.hotInstance.scrollViewportTo(0, 0);

        document.body.style.cursor = "default";
        this.setLoadingState(false);

        await this.win.slideTo(350, 300);
    }

    private showZeroResultMessage(): void {
        let msgOptions = {} as Electron.MessageBoxOptions;
        msgOptions.message = "Paieška negrąžino jokių rezultatų";
        msgOptions.title = "Paieška";
        msgOptions.type = "info"

        Electron.remote.dialog.showMessageBox(Electron.remote.BrowserWindow.getAllWindows()[0], msgOptions);
    }

    private onSearchFieldChange(e: React.ChangeEvent<HTMLInputElement>): void {
        let state = new SearchWindowState();

        Object.assign(state, this.state);
        state.key = e.target.value;

        this.setState(state);
    }

    private onSearchFieldKeyUp(e: React.KeyboardEvent<HTMLInputElement>): void {
        if (e.keyCode === 13) {
            this.onSearchClick(null);
        }
    }

    private setLoadingState(loading: boolean): void {
        let state = new SearchWindowState();

        Object.assign(state, this.state);
        state.loading = loading;

        this.setState(state);
    }

    public render() {
        return <div id="searchWindowContainer" className={"modal-container"} style={(!this.state.visible ? {display: "none"} : {display: "flex"})}>
            <div id="searchWindow" className="modal search-window minified">
                <div className="modal-header">
                    <div className="modal-header-container">
                        <div className="title">Paieška</div>
                        <div className="button close" onClick={this.onCloseClick}></div>
                    </div>
                </div>
                <div className="modal-loader" style={{display: "none"}}>
                    <div className="loader"></div>
                </div>
                <div className="modal-body">
                    <div className="input-container">
                        <div className="field-label">Rasti:</div>
                        <div className="input-field-container">
                            <input type="text" value={this.state.key} onChange={(e) => this.onSearchFieldChange(e)} onKeyUp={(e) => this.onSearchFieldKeyUp(e)} style={(this.state.loading ? {cursor: "wait"} : {cursor: "initial"})}></input>
                            <div className="button find" onClick={(e) => this.onSearchClick(e)}></div>
                        </div>
                    </div>
                    <div className="result-container" id="resultContainer">
                        <div className="grid-container">
                            <HotTable id="searchWindowGrid" ref={sheet => this.grid = sheet} data={this.data} colHeaders={["Lapas", "Langelis", "Reikšmė"]} rowHeaders={false} stretchH="all"
                                colWidths={[120, 100, 360]} />
                        </div>
                        <div className="result-summary">
                            {this.resultCountText}
                        </div>
                    </div>
                </div>
            </div>
        </div>;
    }
}