import { NextRequest, NextResponse } from 'next/server';
import { PDFParserService } from '@/services/PDFParserService';

const pdfServices: Map<string, PDFParserService> = new Map();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, pageNum, parseAll } = body;

    console.log(`[API /pdf/parse] sessionId: ${sessionId}, pageNum: ${pageNum}, parseAll: ${parseAll}`);

    let parser = pdfServices.get(sessionId);
    
    if (!parser) {
      return NextResponse.json({ error: 'No PDF session found. Upload a PDF first.' }, { status: 400 });
    }

    if (parseAll) {
      console.log('[API /pdf/parse] Parsing all pages');
      const result = await parser.parseAllPages();
      return NextResponse.json(result);
    }

    if (pageNum) {
      console.log(`[API /pdf/parse] Parsing page ${pageNum}`);
      const parsedPage = await parser.parsePage(pageNum);
      return NextResponse.json({
        success: true,
        page: parsedPage,
      });
    }

    return NextResponse.json({ error: 'Specify pageNum or parseAll' }, { status: 400 });
  } catch (err) {
    console.error('[API /pdf/parse] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to parse PDF' },
      { status: 500 }
    );
  }
}