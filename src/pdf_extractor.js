const pdfjsLib = require("pdfjs-dist/es5/build/pdf.js");

pdfjsLib.GlobalWorkerOptions.workerSrc = process.env.PUBLIC_URL + "/pdf.worker.min.js"

class PDFExtractor {
    constructor(pdf) {
        this.rawPdf = {data: pdf};
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
            depth2Outline.map(async (o, idx) => ({
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
        return pageTextContent.items.map(i => i.str).join(" ")
    }
}

module.exports = { PDFExtractor: PDFExtractor }