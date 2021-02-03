import { Sheet } from "../Models/Sheet";
import { Document } from "../Models/Document";

export class LoadDocumentResponse {
    public document: Document;
    public activeSheet: Sheet;
}