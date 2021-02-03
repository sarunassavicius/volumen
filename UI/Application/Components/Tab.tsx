import * as React from "react";
import * as Electron from "electron";

class TabState {
    public name: string;
    public active: boolean;
}

export interface ITabParameter {
    id: string;
    name: string;
    active: boolean;
    onClick: (id: string, e: React.MouseEvent<HTMLElement>) => void;
}

export class Tab extends React.Component<ITabParameter, TabState> {
    constructor(props: ITabParameter, context: any) {
        super(props, context);

        this.setState({ name: this.props.name, active: this.props.active });
    }

    public componentDidMount(): void {
    }

    public componentWillReceiveProps(props: ITabParameter): void {
        this.setState({ name: props.name, active: props.active });
    }

    private onClick = async (e: React.MouseEvent<HTMLElement>) => {
        this.props.onClick(this.props.id, e);
    }

    public render(): React.ReactNode {
        return <div id={this.props.id} className={"tab" + (this.state.active ? " active" : "")} onClick={this.onClick}>
            <div className="label">
                {this.state.name}
            </div>
        </div>;
    }
}