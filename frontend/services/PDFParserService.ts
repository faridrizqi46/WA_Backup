export interface PageMetadata {
  width: number;
  height: number;
  pageIndex: number;
  hasText: boolean;
  hasImages: boolean;
  hasTables: boolean;
}

export interface TextSection {
  type: 'text';
  content: string;
}

export interface ImageSection {
  type: 'image';
  ocrText: string;
  imageData?: string;
}

export interface TableSection {
  type: 'table';
  headers: string[];
  rows: string[][];
  markdown: string;
}

export interface GraphSection {
  type: 'graph';
  description: string;
  imageData?: string;
}

export type SectionContent = TextSection | ImageSection | TableSection | GraphSection;

export interface Section {
  type: 'text' | 'image' | 'table' | 'graph';
  column: 'left' | 'right' | 'full';
  content: SectionContent;
  bounds?: { x: number; y: number; width: number; height: number };
}

export interface ParsedPage {
  pageNum: number;
  sections: Section[];
  rawText: { left: string; right: string };
  metadata: PageMetadata;
}

export interface ParseProgress {
  pageNum: number;
  totalPages: number;
  percent: number;
  status: string;
}

export interface ParseResult {
  success: boolean;
  pages: ParsedPage[];
  error?: string;
}

export type ContentType = 'text' | 'image' | 'table' | 'graph' | 'mixed';

export type PDFServiceCallback = (message: string) => void;

export class PDFParserService {
  private pdfjsLib: any = null;
  private pdfDocument: any = null;

  async initialize(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('PDFParserService can only be used in browser environment');
    }
    
    this.pdfjsLib = await import('pdfjs-dist');
    this.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${this.pdfjsLib.version}/pdf.worker.min.js`;
    console.log('[PDFParser] pdfjs-dist initialized');
  }

  async loadDocument(data: ArrayBuffer): Promise<number> {
    if (!this.pdfjsLib) {
      await this.initialize();
    }

    console.log('[PDFParser] Loading document, size:', data.byteLength);
    
    const loadingTask = this.pdfjsLib.getDocument({ data });
    this.pdfDocument = await loadingTask.promise;
    
    console.log('[PDFParser] Document loaded, pages:', this.pdfDocument.numPages);
    
    return this.pdfDocument.numPages;
  }

  async loadDocumentFromUrl(url: string): Promise<number> {
    if (!this.pdfjsLib) {
      await this.initialize();
    }

    console.log('[PDFParser] Loading document from URL:', url);
    
    const loadingTask = this.pdfjsLib.getDocument({ url });
    this.pdfDocument = await loadingTask.promise;
    
    console.log('[PDFParser] Document loaded from URL, pages:', this.pdfDocument.numPages);
    return this.pdfDocument.numPages;
  }

  async getPage(pageNum: number): Promise<{ page: any; metadata: PageMetadata }> {
    if (!this.pdfDocument) {
      throw new Error('No document loaded');
    }

    const page = await this.pdfDocument.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });
    
    const metadata: PageMetadata = {
      width: viewport.width,
      height: viewport.height,
      pageIndex: pageNum - 1,
      hasText: false,
      hasImages: false,
      hasTables: false,
    };

    return { page, metadata };
  }

  async extractText(page: any): Promise<{ left: string; right: string; full: string }> {
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.5 });
    const pageWidth = viewport.width;
    const midPoint = pageWidth / 2;

    let leftText = '';
    let rightText = '';
    let fullText = '';

    for (const item of textContent.items) {
      if ('str' in item && item.str) {
        const x = item.transform[4];
        const text = item.str.trim();
        
        if (text) {
          fullText += text + ' ';
          
          if (x < midPoint) {
            leftText += text + ' ';
          } else {
            rightText += text + ' ';
          }
        }
      }
    }

    return {
      left: leftText.trim(),
      right: rightText.trim(),
      full: fullText.trim(),
    };
  }

  async renderPageToCanvas(page: any, scale = 2.0): Promise<{ canvas: HTMLCanvasElement; width: number; height: number }> {
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get canvas context');
    }

    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    return { canvas, width: viewport.width, height: viewport.height };
  }

  detectContentType(textLength: number, hasImages: boolean): ContentType {
    if (textLength < 50 && !hasImages) {
      return 'image';
    }
    
    if (textLength > 200) {
      return 'text';
    }
    
    if (textLength > 50 && textLength <= 200) {
      return 'mixed';
    }
    
    return 'image';
  }

  async detectPageType(page: any): Promise<ContentType> {
    const textContent = await page.getTextContent();
    const textLength = textContent.items.reduce((acc: number, item: any) => {
      if ('str' in item) {
        return acc + (item.str?.trim().length || 0);
      }
      return acc;
    }, 0);

    const opList = await page.getOperatorList();
    let hasImages = false;
    
    for (let i = 0; i < opList.fnArray.length; i++) {
      if (opList.fnArray[i] === 85) {
        hasImages = true;
        break;
      }
    }

    return this.detectContentType(textLength, hasImages);
  }

  async detectSections(page: any) {
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.5 });
    const pageWidth = viewport.width;
    const midPoint = pageWidth / 2;

    const leftItems: any[] = [];
    const rightItems: any[] = [];

    for (const item of textContent.items) {
      if ('str' in item && item.transform) {
        const x = item.transform[4];
        if (x < midPoint) {
          leftItems.push(item);
        } else {
          rightItems.push(item);
        }
      }
    }

    const leftSections = this.groupTextItemsIntoSections(leftItems, 'left');
    const rightSections = this.groupTextItemsIntoSections(rightItems, 'right');

    return { leftSections, rightSections };
  }

  private groupTextItemsIntoSections(items: any[], column: 'left' | 'right'): Section[] {
    if (items.length === 0) {
      return [];
    }

    const sections: Section[] = [];
    const sortedItems = [...items].sort((a, b) => {
      const yA = a.transform ? a.transform[5] : 0;
      const yB = b.transform ? b.transform[5] : 0;
      return yA - yB;
    });

    let currentSection: { items: any[]; y: number } | null = null;
    const Y_THRESHOLD = 15;

    for (const item of sortedItems) {
      const itemY = item.transform ? item.transform[5] : 0;
      
      if (!currentSection) {
        currentSection = { items: [item], y: itemY };
      } else if (Math.abs(itemY - currentSection.y) < Y_THRESHOLD) {
        currentSection.items.push(item);
      } else {
        sections.push(this.createSectionFromItems(currentSection.items, column));
        currentSection = { items: [item], y: itemY };
      }
    }

    if (currentSection && currentSection.items.length > 0) {
      sections.push(this.createSectionFromItems(currentSection.items, column));
    }

    return sections;
  }

  private createSectionFromItems(items: any[], column: 'left' | 'right'): Section {
    const content = items
      .filter(item => 'str' in item)
      .map(item => item.str)
      .join(' ')
      .trim();

    return {
      type: 'text',
      column,
      content: {
        type: 'text',
        content,
      },
    };
  }

  async extractTableFromCanvas(canvas: HTMLCanvasElement): Promise<TableSection> {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const gridLines: { horizontal: number[]; vertical: number[] } = {
      horizontal: [],
      vertical: [],
    };

    const width = canvas.width;
    const height = canvas.height;
    const threshold = 200;

    for (let y = 0; y < height; y += 5) {
      let darkPixels = 0;
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        if (r < threshold && g < threshold && b < threshold) {
          darkPixels++;
        }
      }
      if (darkPixels / width > 0.1) {
        gridLines.horizontal.push(y);
      }
    }

    for (let x = 0; x < width; x += 5) {
      let darkPixels = 0;
      for (let y = 0; y < height; y++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        if (r < threshold && g < threshold && b < threshold) {
          darkPixels++;
        }
      }
      if (darkPixels / height > 0.1) {
        gridLines.vertical.push(x);
      }
    }

    let markdown = '| Column 1 | Column 2 |\n|----------|----------|\n| Data 1 | Data 2 |';
    
    if (gridLines.horizontal.length > 2 && gridLines.vertical.length > 1) {
      markdown = this.generateMarkdownTable(gridLines);
    }

    return {
      type: 'table',
      headers: ['Column 1', 'Column 2'],
      rows: [['Data 1', 'Data 2']],
      markdown,
    };
  }

  private generateMarkdownTable(gridLines: { horizontal: number[]; vertical: number[] }): string {
    const cols = gridLines.vertical.sort((a, b) => a - b);
    const rows = gridLines.horizontal.sort((a, b) => a - b);

    if (cols.length < 2 || rows.length < 2) {
      return '| No table detected |';
    }

    const headerRow = cols.slice(0, 2).map((_, i) => `Header ${i + 1}`);

    const dataRows = rows.slice(1, Math.min(rows.length, 5)).map(() => {
      return cols.slice(0, 2).map(() => 'Cell');
    });

    let markdown = '| ' + headerRow.join(' | ') + ' |\n';
    markdown += '| ' + headerRow.map(() => '---').join(' | ') + ' |\n';
    
    for (const row of dataRows) {
      markdown += '| ' + row.join(' | ') + ' |\n';
    }

    return markdown;
  }

  async extractImageOCR(canvas: HTMLCanvasElement): Promise<string> {
    console.log('[PDFParser] Starting OCR on canvas');
    
    const imageDataUrl = canvas.toDataURL('image/png');
    
    try {
      const Tesseract = await import('tesseract.js');
      const result = await Tesseract.recognize(imageDataUrl, 'eng+ind', {
        logger: (m: any) => console.log('[Tesseract]', m.status, m.progress),
      });
      
      console.log('[PDFParser] OCR completed, confidence:', result.data.confidence);
      return result.data.text;
    } catch (error) {
      console.error('[PDFParser] OCR failed:', error);
      return '[OCR Failed]';
    }
  }

  async parsePage(pageNum: number): Promise<ParsedPage> {
    if (!this.pdfDocument) {
      throw new Error('No document loaded');
    }

    console.log(`[PDFParser] Parsing page ${pageNum}`);
    
    const { page, metadata } = await this.getPage(pageNum);
    
    const textResult = await this.extractText(page);
    const contentType = await this.detectPageType(page);
    const sections = await this.detectSections(page);

    metadata.hasText = textResult.full.length > 50;

    const parsedPage: ParsedPage = {
      pageNum,
      sections: [...sections.leftSections, ...sections.rightSections],
      rawText: {
        left: textResult.left,
        right: textResult.right,
      },
      metadata,
    };

    console.log(`[PDFParser] Page ${pageNum} parsed, type: ${contentType}, sections: ${parsedPage.sections.length}`);

    return parsedPage;
  }

  async parseAllPages(): Promise<ParseResult> {
    if (!this.pdfDocument) {
      return { success: false, pages: [], error: 'No document loaded' };
    }

    console.log(`[PDFParser] Parsing all ${this.pdfDocument.numPages} pages`);
    
    const pages: ParsedPage[] = [];
    
    for (let i = 1; i <= this.pdfDocument.numPages; i++) {
      const parsed = await this.parsePage(i);
      pages.push(parsed);
    }

    return { success: true, pages };
  }

  getPageCount(): number {
    return this.pdfDocument?.numPages || 0;
  }

  destroy(): void {
    if (this.pdfDocument) {
      this.pdfDocument.destroy();
      this.pdfDocument = null;
    }
  }
}

export const createPDFParserService = (): PDFParserService => {
  return new PDFParserService();
};