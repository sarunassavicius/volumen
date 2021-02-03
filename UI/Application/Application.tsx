import "./Style/styles.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as Electron from "electron"

import { Essence, EssenceElement } from "@savicius.lt/essence-js";
import { Cache } from "./Cache";
import { TopMenu } from "./Components/TopMenu";
import { Sheet } from "./Components/Sheet";
import { ValueEditor } from "./Components/ValueEditor";
import { TabPanel } from "./Components/TabPanel";
import { Loader } from "./Components/Loader";
import { SearchWindow } from "./Components/SearchWindow";
import { InputWindow } from "./Components/InputWindow";
import { Sheet as SheetModel } from "./Models/Sheet";
import { Document } from "./Models/Document";
import { LoadDocumentResponse } from "./DTO/LoadDocumentResponse";
import { InputWindowSettings } from "./DTO/InputWindowSettings";
import { InputWindowValidationResult } from "./DTO/InputWindowValidationResult";
import { EventStorage } from "./EventStorage";

//Electron.remote.BrowserWindow.getAllWindows()[0].maximize();

class ApplicationState {
    public document: Document;
    public activeSheet: SheetModel;
    public valueEditorValue: string;
}

export class Application extends React.Component<any, ApplicationState> {
    private loader: Loader;
    private valueEditor: ValueEditor;
    private searchWindow: SearchWindow;
    private inputWindow: InputWindow;

    public sheet: Sheet;
    public cache: Cache;
    public documentPath: string;

    constructor(props: any, context: any) {
        super(props, context);

        this.cache = new Cache(this.documentPath);
        this.setUpContextMenu();

        let doc = new Document();

        let sm1 = new SheetModel();
        sm1.id = "-1";
        sm1.name = "Lapas 1";

        doc.sheets = { [sm1.id]: sm1.name };

        this.setState({ document: doc, activeSheet: sm1, valueEditorValue: "" });
    }

    public async navigateToSheet(sheetId: string, rowId: string = null, cellId: string = null): Promise<SheetModel> {
        if (sheetId === "-1") {
            return;
        }

        document.body.style.cursor = "wait";
        await this.showLoader();

        //TODO: move URL
        let response = await Essence.get<SheetModel>("http://localhost:10001/sheet/load/" + encodeURIComponent(this.documentPath) + "/" + sheetId);

        let state = new ApplicationState();
        Object.assign(state, this.state);
        state.activeSheet = response.data;
        state.valueEditorValue = "";

        this.setState(state, async () => {
            document.body.style.cursor = "default";
            await this.hideLoader();
            window.scrollTo(0, 0);

            if (rowId === null || cellId === null) {
                this.sheet.sheet.hotInstance.selectCell(0, 0);
                this.valueEditor.setValue(this.sheet.sheet.hotInstance.getDataAtCell(0, 0));

                return;
            }

            let row = parseInt(rowId);
            let cell = parseInt(cellId);

            this.sheet.sheet.hotInstance.selectCell(row, cell);
            this.valueEditor.setValue(this.sheet.sheet.hotInstance.getDataAtCell(row, cell));
        });
    }

    public componentDidMount(): void {
        Essence("#application").getElement().addEventListener("contextmenu", (e: MouseEvent) => {
            EventStorage.EventTarget = Essence(e.target);
        });
        Essence("#application").getElement().addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.keyCode === 27) {
                this.inputWindow.hide();
                this.searchWindow.hide();
            }
        });
    }

    public render(): React.ReactNode {
        return <div className="application-container">
            <Loader ref={loader => this.loader = loader} visible={false} />
            <SearchWindow app={this} ref={sw => this.searchWindow = sw} visible={false} />
            <InputWindow app={this} ref={iw => this.inputWindow = iw} visible={false} />
            <div id="top-menu">
                <TopMenu app={this} />
            </div>
            <ValueEditor app={this} ref={editor => this.valueEditor = editor} value={this.state.valueEditorValue} valueChange={(value: string) => this.onValueEditorChange(value)} />
            <Sheet app={this} ref={sheet => this.sheet = sheet} sheet={this.state.activeSheet} onCellClick={(value: string) => this.onSheetCellClick(value)} />
            <TabPanel app={this} sheets={this.state.document.sheets} activeSheetId={this.state.activeSheet.id} onTabClick={(sheetId, e) => this.onTabClick(sheetId, e)} />
        </div>
    }

    public async loadDocument(response: LoadDocumentResponse, path: string): Promise<any> {
        this.documentPath = path;

        let state = new ApplicationState();
        Object.assign(state, this.state);
        state.document = response.document;
        state.activeSheet = response.activeSheet;

        this.setState(state, async () => {
            document.body.style.cursor = "default";
            await this.hideLoader();
            this.valueEditor.setValue(this.sheet.sheet.hotInstance.getDataAtCell(0, 0));
        });

        this.searchWindow.clearSearchResults();
    }

    public async saveDocument(): Promise<any>  {
        document.body.style.cursor = "wait";

        await this.showLoader();
        await Essence.post<object>(`http://localhost:10001/document/save/${encodeURIComponent(this.documentPath)}/${this.state.activeSheet.id}`);
        await this.hideLoader();

        document.body.style.cursor = "default";
    }

    public async createSheet(name: string): Promise<any> {
        let sheet = (await Essence.post<SheetModel>(`http://localhost:10001/sheet/add/${encodeURIComponent(this.documentPath)}/${encodeURIComponent(name)}`)).data;

        let state = new ApplicationState();
        Object.assign(state, this.state);
        state.document.sheets[sheet.id] = sheet.name;
        state.activeSheet = sheet;
        state.valueEditorValue = "";

        this.setState(state, async () => {
            document.body.style.cursor = "default";
            await this.hideLoader();
            window.scrollTo(0, 0);

            this.sheet.sheet.hotInstance.selectCell(0, 0);
            this.valueEditor.setValue(this.sheet.sheet.hotInstance.getDataAtCell(0, 0));
        });
    }

    public async showLoader(): Promise<any> {
        await this.loader.show();
    }

    public async hideLoader(): Promise<any> {
        await this.loader.hide();
    }

    public async showSearchWindow(): Promise<any> {
        await this.searchWindow.show();
    }

    public async showInputWindow(settings: InputWindowSettings): Promise<any> {
        await this.inputWindow.show(settings);
    }

    private async onTabClick(sheetId: string, e: React.MouseEvent<HTMLElement>): Promise<SheetModel> {
        return this.navigateToSheet(sheetId);
    }

    private onSheetCellClick(value: string): void {
        this.valueEditor.setValue(value);
    }

    private onValueEditorChange(value: string): void {
        let state = new ApplicationState();
        Object.assign(state, this.state);
        state.valueEditorValue = value;

        let selection = this.sheet.sheet.hotInstance.getSelected()[0];
        let row = selection[0];
        let col = selection[1];

        this.sheet.sheet.hotInstance.setDataAtCell(row, col, value, "value-editor");
    }

    private async renameSheet(sheetId: string): Promise<any> {
        let sheetName = this.state.document.sheets[sheetId];

        let inputWinSettings = new InputWindowSettings();
        inputWinSettings.title = "Lapo pervadinimas";
        inputWinSettings.value = sheetName;

        inputWinSettings.validation = async (value: string) => {
            let result = new InputWindowValidationResult();
            result.isValid = true;

            if (value === sheetName) {
                return result;
            }

            if (Object.values(this.state.document.sheets).find(s => s === value)) {
                result.message = "Lapas su tokiu pavadinimu jau egzistuoja!";
                result.isValid = false;
            }

            return result;
        };

        inputWinSettings.onSumbit = async (name: string) => {
            if (name === sheetName) {
                document.body.style.cursor = "default";
                await this.hideLoader();
                return;
            }

            await Essence.post(`http://localhost:10001/sheet/rename/${encodeURIComponent(this.documentPath)}/${sheetId}/${encodeURIComponent(name)}`);

            let state = new ApplicationState();
            Object.assign(state, this.state);
            state.document.sheets[sheetId] = name;

            if (state.activeSheet.id === sheetId) {
                state.activeSheet.name = name;
            }

            this.setState(state, async () => {
                document.body.style.cursor = "default";
                await this.hideLoader();
            });
        };

        await this.showInputWindow(inputWinSettings);
    }

    public async removeSheet(sheetId: string): Promise<any> {
        let sheetIds = Object.keys(this.state.document.sheets);
        if (sheetIds.length === 1) {
            throw new Error("Cannot delete the only sheet!");
        }

        let state = new ApplicationState();
        Object.assign(state, this.state);

        if (state.activeSheet.id === sheetId) {
            let sheetPosition = 0;

            sheetIds.forEach((val: string, i: number) => {
                if (val === sheetId) {
                    sheetPosition = i;
                    return;
                }
            });

            this.navigateToSheet(sheetPosition != sheetIds.length-1 ? sheetIds[sheetPosition + 1] : sheetIds[sheetPosition - 1]);
        }

        delete state.document.sheets[sheetId];
        this.setState(state);

        await Essence.post(`http://localhost:10001/sheet/remove/${encodeURIComponent(this.documentPath)}/${sheetId}`);
    }

    public removeSheetSelection(): void {
        let selection = this.sheet.sheet.hotInstance.getSelected()[0];

        EventStorage.LastSelectedRow = selection[0];
        EventStorage.LastSelectedColumn = selection[1];

        this.sheet.sheet.hotInstance.updateSettings({
            outsideClickDeselects: true
        }, false);
        this.sheet.sheet.hotInstance.deselectCell();
    }

    public restoreSheetSelection(): void {
        this.sheet.sheet.hotInstance.updateSettings({
            outsideClickDeselects: false
        }, false);

        this.sheet.sheet.hotInstance.selectCell(EventStorage.LastSelectedRow, EventStorage.LastSelectedColumn);
    }

    private setUpContextMenu(): void {
        let tabMenu = new Electron.remote.Menu();
        tabMenu.append(new Electron.remote.MenuItem({
            id: "tabMenuRenameSheet",
            label: "&Pervadinti",
            click: async () => {
                await this.renameSheet(EventStorage.EventTarget.getParent().getAttribute("id"));
            }
        }));
        tabMenu.append(new Electron.remote.MenuItem({
            id: "tabMenuRemoveSheet",
            label: "Pa&šalinti",
            click: async () => {
                let sheetId = EventStorage.EventTarget.getParent().getAttribute("id");
                let sheetName = this.state.document.sheets[sheetId];

                let options = {} as Electron.MessageBoxOptions;
                options.message = `Ar tikrai norite pašalinti lapą "${sheetName}"?`;
                options.title = "Patvirtinimas";
                options.type = "question";
                options.buttons = ["&Taip", "&Ne"];

                Electron.remote.dialog.showMessageBox(Electron.remote.BrowserWindow.getAllWindows()[0], options, async (response: number) => {
                    if (response === 0) {
                        this.removeSheet(sheetId);
                    }
                });
            }
        }));

        let generalMenu = new Electron.remote.Menu();
        generalMenu.append(new Electron.remote.MenuItem({
            label: "Iškirpti",
            click: () => {
                document.execCommand("cut");
            }
        }));
        generalMenu.append(new Electron.remote.MenuItem({
            label: "Kopijuoti",
            click: () => {
                document.execCommand("copy");
            }
        }));
        generalMenu.append(new Electron.remote.MenuItem({
            label: "Įklijuoti",
            click: () => {
                document.execCommand("paste");
            }
        }));

        window.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();

            let target = (e.target as Element).parentElement;
            if (target) {
                let win = Electron.remote.getCurrentWindow();
                if (target.className === "tab" || target.className === "tab active") {
                    tabMenu.getMenuItemById("tabMenuRemoveSheet").enabled = Object.keys(this.state.document.sheets).length > 1;
                    tabMenu.popup({
                        window: win
                    });
                } else {
                    if (target.nodeName.toLowerCase() === "textarea") {
                        generalMenu.popup({
                            window: win
                        });
                    }
                }
            }
          },
        false);
    }
}

ReactDOM.render(
    <Application />,
    document.getElementById("application")
);