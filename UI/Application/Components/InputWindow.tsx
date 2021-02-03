import "../Style/input-window.scss";

import * as React from "react";
import * as Electron from "electron";
import { Essence, EssenceElement } from "@savicius.lt/essence-js";
import { Application } from "../Application";
import { InputWindowSettings } from "../DTO/InputWindowSettings";

class InputWindowState {
    public visible: boolean;
    public loading: boolean;
    public value: string;
    public settings: InputWindowSettings;
}

export interface IInputWindowProperties {
    app: Application;
    visible: boolean;
}

export class InputWindow extends React.Component<IInputWindowProperties, InputWindowState> {
    private container: EssenceElement;
    private win: EssenceElement;
    private input: EssenceElement;

    constructor(props: any, context: any) {
        super(props, context);
    }

    public componentDidMount(): void {
        this.container = Essence("#inputWindowContainer");
        this.win = Essence("#inputWindow");
        this.input = this.win.findFirstChild("input[type=text]");

        if (this.props.visible) {
            this.show(this.state.settings);
        }
        if (!this.props.visible) {
            this.hide();
        }
    }

    public async show(settings: InputWindowSettings): Promise<any> {
        let state = new InputWindowState();

        Object.assign(state, this.state);
        state.visible = true;
        state.settings = settings;

        this.setState(state);
        this.container.setAttribute("style", "display: flex;");

        this.props.app.removeSheetSelection();

        await this.container.fadeIn();

        this.input.focus();
        this.input.selectAllText();
    }

    public async hide(): Promise<any> {
        await this.container.fadeOut();

        let state = new InputWindowState();

        Object.assign(state, this.state);
        state.settings = null;
        state.visible = false;

        this.props.app.restoreSheetSelection();

        this.setState(state);
    }

    private onCloseClick = async (e: React.MouseEvent<HTMLElement>) => {
        if (this.state.settings && this.state.settings.onClose) {
            this.state.settings.onClose();
        }

        await this.hide();
    }

    private onSubmitClick = async (e: React.MouseEvent<HTMLElement>) => {
        if (this.state.loading) {
            return;
        }

        let value = this.state.value ? this.state.value : this.input.getValue();

        if (!value || value.trim() === "") {
            this.showMessage("Būtinas lapo pavadinimas!");
            return;
        }

        value = value.trim();

        if (this.state.settings.validation) {
            let validationResult = await this.state.settings.validation(value);

            if (!validationResult.isValid) {
                this.showMessage(validationResult.message);
                return;
            }
        }

        let state = new InputWindowState();
        let settings = new InputWindowSettings();
        Object.assign(state, this.state);
        Object.assign(settings, this.state.settings);
        state.settings.value = value;
        this.setState(state);

        document.body.style.cursor = "wait";

        this.setLoadingState(true);

        await this.state.settings.onSumbit(value);

        document.body.style.cursor = "default";
        this.setLoadingState(false);

        await this.hide();
    }

    private showMessage(message: string): void {
        let msgOptions = {} as Electron.MessageBoxOptions;
        msgOptions.message = message;
        msgOptions.title = "Klaida";
        msgOptions.type = "error";

        Electron.remote.dialog.showMessageBox(Electron.remote.BrowserWindow.getAllWindows()[0], msgOptions);
    }

    private onInputFieldKeyUp(e: React.KeyboardEvent<HTMLInputElement>): void {
        if (e.keyCode === 13) {
            this.onSubmitClick(null);
        }
    }

    private setLoadingState(loading: boolean): void {
        let state = new InputWindowState();
        let settings = new InputWindowSettings();

        Object.assign(state, this.state);
        Object.assign(settings, this.state.settings);
        state.loading = loading;

        this.setState(state);
    }

    public render() {
        return <div id="inputWindowContainer" className={"modal-container"} style={(!this.state.visible ? {display: "none"} : {display: "flex"})}>
            <div id="inputWindow" className="modal input-window minified">
                <div className="modal-header">
                    <div className="modal-header-container">
                        <div className="title">{this.state.settings ? this.state.settings.title : "Pavadinimas"}</div>
                        <div className="button close" onClick={this.onCloseClick}></div>
                    </div>
                </div>
                <div className="modal-loader" style={{display: "none"}}>
                    <div className="loader"></div>
                </div>
                <div className="modal-body">
                    <div className="input-container">
                        <div className="input-field-container">
                            <input type="text" value={this.state.settings ? this.state.settings.value : ""} onKeyUp={(e) => this.onInputFieldKeyUp(e)} style={(this.state.loading ? {cursor: "wait"} : {cursor: "initial"})}>
                            </input>
                        </div>
                    </div>
                    <div className="control-container">
                        <div className="control" onClick={this.onCloseClick}>Atšaukti</div>
                        <div className="control main" onClick={this.onSubmitClick}>Saugoti</div>
                    </div>
                </div>
            </div>
        </div>;
    }
}