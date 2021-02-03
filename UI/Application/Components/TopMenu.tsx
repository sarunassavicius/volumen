import * as React from "react";
import * as Electron from "electron";
import { LoadDocumentResponse } from "../DTO/LoadDocumentResponse";
import { Application } from "../Application";
import { Essence } from "@savicius.lt/essence-js";

class LoginState {
    public login: string;
    public password: string;
    public error: string;
    public loading: boolean;
    public hasErrors: boolean;
}

export interface ITopMenuProps {
    app: Application;
}

export class TopMenu extends React.Component<ITopMenuProps, LoginState> {
    constructor(props: ITopMenuProps, context: any) {
        super(props, context);
    }

    private onOpenClick = async (event: React.MouseEvent<HTMLElement>) => {
       Electron.remote.dialog.showOpenDialog(Electron.remote.BrowserWindow.getAllWindows()[0], {
            properties: ['openFile'],
            filters: [
                { name: "Įrašai", extensions: ["vdf"] },
                { name: "Visi failai", extensions: ["*"] }
            ]
        }, async (paths: string[], bookmarks: string[]) => {
            if (paths) {
                document.body.style.cursor = "wait";
                await this.props.app.showLoader();
                //TODO: move URL
                let response = await Essence.get<LoadDocumentResponse>("http://localhost:10001/document/load/" + encodeURIComponent(paths[0]));
                let doc = response.data;
                await this.props.app.loadDocument(doc, paths[0]);
            }
        });
    };

    private onSaveClick = async (event: React.MouseEvent<HTMLElement>) => {
        await this.props.app.saveDocument();
    }

    private onFindClick = async (event: React.MouseEvent<HTMLElement>) => {
        this.props.app.showSearchWindow();
    }

    public render() {
        return <div className="top-menu-container">
            <div className="button open" onClick={this.onOpenClick}>Atverti</div>
            <div className="button save" onClick={this.onSaveClick}>Išsaugoti</div>
            <div className="button find" onClick={this.onFindClick}>Ieškoti</div>
        </div>;
    }
}