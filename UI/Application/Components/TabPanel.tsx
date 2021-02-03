import * as React from "react";
import { Application } from "../Application";
import { Tab } from "./Tab";
import { InputWindowSettings } from "../DTO/InputWindowSettings";
import { InputWindowValidationResult } from "../DTO/InputWindowValidationResult";

class TabPanelState {
    public sheets: { [id: string]: string };
    public activeSheetId: string;
}

export interface ITabPanelProperties {
    sheets: { [id: string]: string };
    activeSheetId: string;
    onTabClick: (sheetId: string, e: React.MouseEvent<HTMLElement>) => void;
    app: Application;
}

export class TabPanel extends React.Component<ITabPanelProperties, TabPanelState> {
    private tabs: JSX.Element[];

    constructor(props: ITabPanelProperties, context: any) {
        super(props, context);

        this.setState({ sheets: this.props.sheets });
        this.populateTabs(this.state.sheets, this.props.activeSheetId);
    }

    public componentWillReceiveProps(props: ITabPanelProperties): void {
        this.populateTabs(props.sheets, props.activeSheetId);
        this.setState({ sheets: props.sheets, activeSheetId: props.activeSheetId });
        this.forceUpdate();
    }

    private onTabClick(tabId: string, e: React.MouseEvent<HTMLElement>): void {
        this.populateTabs(this.state.sheets, tabId);
        this.props.onTabClick(tabId, e);
    }

    private populateTabs(sheets: { [id: string]: string }, activeSheetId: string): void {
        this.tabs = [];
        for (let id in sheets) {
            this.tabs.push(<Tab id={id} name={sheets[id]} active={id === activeSheetId} onClick={(tabId, e) => this.onTabClick(tabId, e)}/>);
        }
    }

    private onAddTabClick = async (e: React.MouseEvent<HTMLElement>) => {
        let inputWinSettings = new InputWindowSettings();
        inputWinSettings.title = "Naujo lapo pavadinimas";
        inputWinSettings.value = this.findNewSheetName();

        inputWinSettings.validation = async (value: string) => {
            let result = new InputWindowValidationResult();
            result.isValid = true;

            if (Object.values(this.state.sheets).find(s => s === value)) {
                result.message = "Lapas su tokiu pavadinimu jau egzistuoja!";
                result.isValid = false;
            }

            return result;
        };

        inputWinSettings.onSumbit = async (name: string) => {
            await this.props.app.createSheet(name);
        };

        await this.props.app.showInputWindow(inputWinSettings);
    }

    private findNewSheetName(): string {
        let sheetName = "Lapas";
        let sheetNo = 2;

        while (true) {
            sheetName = `Lapas ${sheetNo}`;

            if (Object.values(this.state.sheets).find(s => s === sheetName)) {
                sheetNo++;
            } else {
                break;
            }
        }

        return sheetName;
    }

    public render(): React.ReactNode {
        return <div className="tab-panel-container">
            <div className="tab-controls">
                <div className="button plus" onClick={(e) => this.onAddTabClick(e)}></div>
            </div>
            <div className="tab-content">
                <div className="tab-container">
                    {this.tabs}
                </div>
            </div>
        </div>;
    }
}