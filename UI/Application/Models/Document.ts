export class Document {
    public isArchived: boolean;
    public date: Date;
    public sheets: { [id: string]: string };
}