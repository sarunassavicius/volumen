import { InputWindowValidationResult } from "./InputWindowValidationResult";

export class InputWindowSettings {
    public title: string;
    public value: string;

    public onSumbit: (value: string) => Promise<any>;
    public onClose: () => Promise<any>;

    public validation: (value: string) => Promise<InputWindowValidationResult>;
}