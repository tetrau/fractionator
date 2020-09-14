interface Chapter {
    title: string;
    pageIndex: number;
    numPages: numPages;
}

export class PDFExtractor {
    constructor(pdf: string);
  
    numPages(): Promise<number>;
  
    extractOutline(): Promise<Chapter[]>;

    extractOnePage(pageIndex): Promise<string>; 
  }
  