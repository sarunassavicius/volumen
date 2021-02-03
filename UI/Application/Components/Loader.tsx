import * as React from "react";
import { EssenceElement, Essence } from "@savicius.lt/essence-js";
//import "essence-js";

export class Loader extends React.Component<any, {}> {
    private container: EssenceElement;

    public componentDidMount(): void {
        //var e = Essence;
        this.container = Essence("#loader");

        if (this.props.visible) {
            this.show();
        }
        if (!this.props.visible) {
            this.hide();
        }
    }

    public shouldComponentUpdate(props: Readonly<any>, state: Readonly<any>, context: Readonly<any>): boolean {
        return false;
    }

    public async show(): Promise<any> {
        this.container.setAttribute("style", "display: flex;");
        await this.container.fadeIn();
    }

    public async hide(): Promise<any> {
        await this.container.fadeOut();
    }

    public render() {
        return <div id="loader" className={"modal-container"} style={{display: "none"}}>
            <div className="loader"></div>
        </div>;
    }
}