import { PDFExtractor, Chapter } from "./pdf_extractor";
import React from 'react';

export abstract class FileTextExtractor {
    abstract extract(callback: (text: string | null) => void): void
}

export class TextFileTextExtractor extends FileTextExtractor {
    file: File
    constructor(file: File) {
        super();
        this.file = file;
    }

    extract(callback: (text: string | null) => void): void {
        const fileReader = new FileReader();
        fileReader.onload = () => {
            const result = fileReader.result;
            if (typeof result === "string") {
                callback(result);
            } else {
                callback(null);
            }
        }
        fileReader.readAsText(this.file);
    }
}

export class PDFFileTextExtractor extends FileTextExtractor {
    file: File
    fromPage: number
    toPage: number

    constructor(file: File, fromPage: number, toPage: number) {
        super();
        this.file = file;
        this.fromPage = fromPage;
        this.toPage = toPage;
    }

    openPDFFile(callback: (pdf: PDFExtractor | null) => any) {
        const fileReader = new FileReader();
        fileReader.onload = () => {
            const result = fileReader.result;
            if (result instanceof ArrayBuffer) {
                const pdfExtractor = new PDFExtractor(result);
                callback(pdfExtractor);
            } else {
                callback(null);
            }
        }
        fileReader.readAsArrayBuffer(this.file);

    }

    extract(callback: (text: string | null) => void): void {
        this.openPDFFile(pdfExtractor => {
            if (pdfExtractor === null) {
                callback(null);
            } else {
                Promise.all(
                    Array.from({ length: this.toPage - (this.fromPage - 1) }, (v, k) => k + this.fromPage - 1)
                        .map(p => pdfExtractor.extractOnePage(p)))
                    .then(pages => callback(pages.join(" ")))
            }
        })
    }
}

interface ExtractorControllerProps {
    file: File
    setExtractor: (extractor: FileTextExtractor) => void
}

export const TextFileTextExtractorController: React.FunctionComponent<ExtractorControllerProps> = ({ file, setExtractor }) => {
    setExtractor(new TextFileTextExtractor(file))
    return null;
}

interface PDFInfo {
    outline: Chapter[]
    numPages: number
}

export class PDFFileTextExtractorController extends React.Component<ExtractorControllerProps, {
    pdfInfo: PDFInfo | null, pageRange: [number, number] | null, badFile: boolean, chapterSelectedIdx: number | null
}>  {
    constructor(props: ExtractorControllerProps) {
        super(props);
        this.state = {
            pdfInfo: null,
            pageRange: null,
            chapterSelectedIdx: null,
            badFile: false
        };
    }

    componentDidMount() {
        this.readPDF();
    }
    componentDidUpdate(prevProps: ExtractorControllerProps){
        if (prevProps.file !== this.props.file) {
            this.readPDF();
        }
    }
    readPDF() {
        new PDFFileTextExtractor(this.props.file, 0, 0).openPDFFile(pdfExtractor => {
            if (pdfExtractor === null) {
                this.setState({ badFile: true })
            } else {
                Promise.all([
                    pdfExtractor.extractOutline(),
                    pdfExtractor.numPages()
                ]).then(outlineAndNumPage => {
                    this.setState({
                        pdfInfo: { outline: outlineAndNumPage[0], numPages: outlineAndNumPage[1] },
                        pageRange: [1, outlineAndNumPage[1]]
                    })
                    this.props.setExtractor(new PDFFileTextExtractor(this.props.file, 1, outlineAndNumPage[1]))
                })
            }
        })
    }

    updatePageRange(fromPage: number, toPage: number): void {
        this.setState({ pageRange: [fromPage, toPage] });
        this.props.setExtractor(new PDFFileTextExtractor(this.props.file, fromPage, toPage));
    }

    render() {
        if (this.state.badFile) {
            return <p>Bad PDF FILE</p>
        } else if (this.state.pdfInfo === null && !this.state.badFile) {
            return <p>LOADING PDF FILE</p>
        } else if (this.state.pageRange !== null && this.state.pdfInfo !== null) {
            return <div className="row mt-1">
                <div className="col-2 pl-0 pr-1">
                    <input type="number" className="form-control" placeholder="Page From" value={this.state.pageRange[0]}
                        onChange={event => { this.state.pageRange !== null && this.updatePageRange(parseInt(event.target.value), this.state.pageRange[1]) }} />
                </div>
                <div className="col-2 pl-0 pr-1">
                    <input type="number" className="form-control" placeholder="Page To" value={this.state.pageRange[1]}
                        onChange={event => { this.state.pageRange !== null && this.updatePageRange(this.state.pageRange[0], parseInt(event.target.value)) }} />
                </div>
                <div className="col-8 pl-0 pr-0">
                    <select className="form-control" value={this.state.chapterSelectedIdx === null ? -1 : this.state.chapterSelectedIdx} onChange={event => {
                        const value: number = parseInt(event.target.value);
                        if (value === -1) {
                            this.setState({
                                chapterSelectedIdx: null
                            })
                        } else if (this.state.pdfInfo !== null) {
                            const chapter = this.state.pdfInfo.outline[value];
                            this.setState(
                                {
                                    chapterSelectedIdx: value,
                                }
                            );
                            this.updatePageRange(chapter.pageIndex, chapter.pageIndex + chapter.numPages);
                        }
                    }}>
                        {this.state.pdfInfo.outline.length === 0 && <option value={-1}>No Table Of Contents</option>}
                        {this.state.pdfInfo.outline.length > 0 && <option value={-1}>Select Chapter</option>}
                        {this.state.pdfInfo.outline.map((chapter, idx) => {
                            return <option key={idx} value={idx}>{chapter.title}</option>
                        })}
                    </select>
                </div>
            </div>
        }
    }

}
