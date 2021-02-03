import * as React from "react";
import { EssenceElement, Essence } from "@savicius.lt/essence-js";
import { Application } from "../Application";

class ValueEditorState {
    value: string;
}

export interface IValueEditorProperties {
    value: string;
    valueChange: (value: string) => void;
    app: Application;
}

export class ValueEditor extends React.Component<IValueEditorProperties, ValueEditorState> {
    private editor: EssenceElement;
    private editorContainer: EssenceElement;
    private isMouseDown: boolean;

    constructor(props: IValueEditorProperties, context: any) {
        super(props, context);

        document.addEventListener("mouseup", () => {
            this.isMouseDown = false;
        });
        document.addEventListener("mousemove", (e) => this.onDocumentMouseMove(e));
    }

    public componentDidMount(): void {
        this.editor = Essence("#valueEditor");
        this.editorContainer = Essence("#editorContainer");
    };

    public componentWillReceiveProps(props: IValueEditorProperties): void {
        this.setState({ value: props.value });
    }

    public setValue(value: string): void {
        this.setState({ value: value });
    }

    private onKeyPress(e: React.KeyboardEvent): void {
        let value = this.editor.getValue();
        this.setState({ value: value }, () => {
            this.props.valueChange(value);
        });
    }

    private onChange(e: React.ChangeEvent): void {
    }

    private onDocumentMouseMove(e: MouseEvent): void {
        if (this.isMouseDown) {
            let el = (this.editorContainer.getElement() as HTMLElement);
            let newHeight = e.pageY - 20;// - (el.offsetHeight + 10);
            el.style.height = `${(newHeight)}px`;
            console.log(`x: ${e.clientX}, y: ${e.clientY}, h: ${newHeight}`);
        }
    }

    private onResizeAreaMouseDown(e: React.MouseEvent): void {
        this.isMouseDown = true;
    }

    private onResizeAreaMouseUp(e: React.MouseEvent): void {
        this.isMouseDown = false;
    }

    public render(): React.ReactNode {
        return <div id="editorContainer" className="value-editor-container">
            <textarea id="valueEditor" name="value-editor" value={this.state.value} onChange={(e) => this.onKeyPress(null)}></textarea>
            <div id="resizeArea" className="resizable-area" onMouseDown={(e) => this.onResizeAreaMouseDown(e)} onMouseUp={(e) => this.onResizeAreaMouseUp(e)} draggable={true}></div>
        </div>;
    }
}