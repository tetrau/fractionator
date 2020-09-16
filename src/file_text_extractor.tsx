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
    pdfInfo: PDFInfo | null,
    pageRange: [number, number] | null,
    pageRangeSafe: [number, number] | null,
    badFile: boolean,
    chapterSelectedIdx: number | null
}>  {
    constructor(props: ExtractorControllerProps) {
        super(props);
        this.state = {
            pdfInfo: null,
            pageRange: null,
            pageRangeSafe: null,
            chapterSelectedIdx: null,
            badFile: false
        };
        this.updateToSafePageRange = this.updateToSafePageRange.bind(this);
    }

    componentDidMount() {
        this.readPDF();
    }
    componentDidUpdate(prevProps: ExtractorControllerProps) {
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
        if (this.state.pdfInfo !== null) {
            const safeFromPage = Math.max(1, Math.min(fromPage, this.state.pdfInfo.numPages))
            const safeToPage = Math.min(this.state.pdfInfo.numPages, Math.max(fromPage, toPage))
            this.setState({
                pageRange: [fromPage, toPage],
                pageRangeSafe: [safeFromPage, safeToPage]
            });
            this.props.setExtractor(new PDFFileTextExtractor(this.props.file, safeFromPage, safeToPage));
        }
    }

    updateToSafePageRange() {
        if (this.state.pageRangeSafe !== null) {
            this.setState({ pageRange: this.state.pageRangeSafe });
        }
    }

    render() {
        if (this.state.badFile) {
            return <p>Bad PDF FILE</p>
        } else if (this.state.pdfInfo === null && !this.state.badFile) {
            return <p>LOADING PDF FILE</p>
        } else if (this.state.pageRange !== null && this.state.pdfInfo !== null) {
            return <div className="row mt-1">
                <div className="col-2 pl-0 pr-1">
                    <div className="form-group">
                        <label className="mb-1 ml-1 small text-nowrap">
                            Page From
                        </label>
                        <input type="number" className="form-control" placeholder="Page From" value={this.state.pageRange[0]}
                            onBlur={this.updateToSafePageRange}
                            onChange={event => { this.state.pageRange !== null && this.updatePageRange(parseInt(event.target.value), this.state.pageRange[1]) }} />
                    </div>
                </div>
                <div className="col-2 pl-0 pr-1">
                    <div className="form-group">
                        <label className="mb-1 ml-1 small text-nowrap">
                            Page To
                        </label>
                        <input type="number" className="form-control" placeholder="Page To" value={this.state.pageRange[1]}
                            onBlur={this.updateToSafePageRange}
                            onChange={event => { this.state.pageRange !== null && this.updatePageRange(this.state.pageRange[0], parseInt(event.target.value)) }} />
                    </div>
                </div>
                <div className="col-8 pl-0 pr-0">
                    <div className="form-group">
                        <label className="mb-1 ml-1 small text-nowrap">
                            Chapter
                        </label>
                        <select className="form-control" value={
                            this.state.chapterSelectedIdx === null ||
                                this.state.pageRange[0] !== this.state.pdfInfo.outline[this.state.chapterSelectedIdx].pageIndex + 1 ||
                                this.state.pageRange[1] !== this.state.pdfInfo.outline[this.state.chapterSelectedIdx].pageIndex + this.state.pdfInfo.outline[this.state.chapterSelectedIdx].numPages ?
                                -1 : this.state.chapterSelectedIdx
                        } onChange={event => {
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
                                console.log(chapter);
                                this.updatePageRange(chapter.pageIndex + 1, chapter.pageIndex + 1 + chapter.numPages - 1);
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
            </div >
        }
    }

}
