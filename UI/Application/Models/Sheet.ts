import { Column } from "./Column";
import { Row } from "./Row";

export class Sheet {
    public id: string;
    public name: string;
    public columns: Array<Column>;
    public rows: {[i: number]: Row};

    public isDeleted: boolean;
}