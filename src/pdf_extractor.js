const pdfjsLib = require("pdfjs-dist/es5/build/pdf.js");

pdfjsLib.GlobalWorkerOptions.workerSrc = process.env.PUBLIC_URL + "/pdf.worker.min.js"

class PDFExtractor {
    constructor(pdf) {
        this.rawPdf = pdf;
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
        const simplifiedOutline = await Promise.all(
            outline.map(async o => ({ title: o.title, pageIndex: await this.getPageIndexFromOutlineItem(o) }))
        )
        const length = simplifiedOutline.length;
        return Promise.all(simplifiedOutline.map(async (o, idx) => {
            if (idx === length - 1) {
                return {
                    title: o.title,
                    pageIndex: o.pageIndex,
                    numPages: (await this.numPages()) - o.pageIndex
                }
            } else {
                return {
                    title: o.title,
                    pageIndex: o.pageIndex,
                    numPages: simplifiedOutline[idx + 1].pageIndex - o.pageIndex
                }
            }
        }))
    }

    async extractOnePage(pageIndex) {
        const pdf = await this.getPdf();
        const page = await pdf.getPage(pageIndex + 1);
        const pageTextContent = await page.getTextContent();
        return pageTextContent.items.map(i => i.str).join(" ")
    }
}

module.exports = { PDFExtractor: PDFExtractor }