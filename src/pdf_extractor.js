import * as pdfjsLib from "pdfjs-dist/es5/build/pdf.js"
import { isWord } from "./data";
import workerContent from "./pdf.worker.min.json";

// Using a blob object url as the workerSrc
var workerBlob = new Blob([workerContent],{type : 'text/javascript'});
var workerBlobURL = URL.createObjectURL(workerBlob);
pdfjsLib.GlobalWorkerOptions.workerSrc = workerBlobURL;

export function concatText(text1, text2) {
    const words1 = text1.toLowerCase().split(/[^a-zA-Z-']/).filter(w => w.length > 0);
    const words2 = text2.toLowerCase().split(/[^a-zA-Z-']/).filter(w => w.length > 0);
    if (words1.length === 0 || words2.length === 0) {
    } else {
        const lastWord1 = words1[words1.length - 1];
        const firstWord2 = words2[0];
        if (isWord(lastWord1) && isWord(firstWord2)) {
        } else if (lastWord1.endsWith("-") && isWord(lastWord1.slice(null, -1)) && isWord(firstWord2)) {
            return text1.trimEnd().concat(text2.trimStart());
        }
        else if (lastWord1.endsWith("-")) {
            const word = lastWord1.slice(null, -1).concat(firstWord2);
            if (isWord(word) && text1.trimEnd().endsWith("-")) {
                return text1.trimEnd().slice(null, -1).concat(text2);
            }
        } else if (!isWord(lastWord1) && !isWord(firstWord2)) {
            if (isWord(lastWord1.concat(firstWord2))) {
                return text1.trimEnd().concat(text2.trimStart())
            }
        }
    }
    return `${text1} ${text2}`
}


export class PDFExtractor {
    constructor(pdf) {
        this.rawPdf = { data: pdf };
        this.pdf = null;
        this.getPdf = this.getPdf.bind(this);
        this.numPages = this.numPages.bind(this);
        this.getPageIndexFromOutlineItem = this.getPageIndexFromOutlineItem.bind(this);
        this.extractOutline = this.extractOutline.bind(this);
        this.extractOnePage = this.extractOnePage.bind(this);
    }

    async getPdf() {
        if (this.pdf === null) {
            this.pdf = await pdfjsLib.getDocument(this.rawPdf).promise;
        }
        return this.pdf
    }

    async numPages() {
        return (await this.getPdf())._pdfInfo.numPages;
    }

    async getPageIndexFromOutlineItem(outlineItem) {
        const pdf = await this.getPdf();
        let dest = outlineItem.dest;
        let ref
        if (typeof outlineItem.dest === "string") {
            ref = (await pdf.getDestination(outlineItem.dest))[0];
        } else {
            ref = dest[0];
        }
        return await pdf.getPageIndex(ref);
    }

    async extractOutline() {
        const pdf = await this.getPdf();
        const outline = await pdf.getOutline();
        if (outline === null) {
            return [];
        }
        const depth2Outline = outline.flatMap(o1 => {
            o1.depth = 1
            return [o1].concat(
                o1.items.map(o2 => {
                    o2.title = `${o1.title} / ${o2.title}`;
                    o2.depth = 2;
                    return o2
                })
            )
        });
        const simplifiedOutline = await Promise.all(
            depth2Outline
                .filter(o => o.dest !== null)
                .map(async (o, idx) => ({
                    title: o.title,
                    idx: idx,
                    pageIndex: await this.getPageIndexFromOutlineItem(o),
                    depth: o.depth
                }))
        );
        const calculateChapter = async (outlineInput) => {

            const length = outlineInput.length;
            return await Promise.all(outlineInput.map(async (o, i) => {
                if (i === length - 1) {
                    const numPages = (await this.numPages()) - o.pageIndex;
                    return {
                        title: o.title,
                        pageIndex: o.pageIndex,
                        numPages: numPages === 0 ? 1 : numPages,
                        idx: o.idx,
                        depth: o.depth
                    }
                } else {
                    const numPages = outlineInput[i + 1].pageIndex - o.pageIndex;
                    return {
                        title: o.title,
                        pageIndex: o.pageIndex,
                        numPages: numPages === 0 ? 1 : numPages,
                        idx: o.idx,
                        depth: o.depth
                    }
                }
            }))
        }
        const result = await calculateChapter(simplifiedOutline);
        const depth1Result = result.filter(o => o.depth === 1);
        const correcttedDepth1Result = await calculateChapter(depth1Result);
        const correctResult = result.filter(o => o.depth === 2).concat(correcttedDepth1Result)
        correctResult.sort((a, b) => a.idx - b.idx);
        return correctResult;
    }

    async extractOnePage(pageIndex) {
        const pdf = await this.getPdf();
        const page = await pdf.getPage(pageIndex + 1);
        const pageTextContent = await page.getTextContent();
        pageTextContent.items.map(i => console.log(i.str));
        return pageTextContent.items.map(i => i.str).reduce(concatText, "")
    }
}

