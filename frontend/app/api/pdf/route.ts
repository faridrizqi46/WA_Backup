import { NextRequest, NextResponse } from 'next/server';
import { PDFParserService } from '@/services/PDFParserService';

const pdfServices: Map<string, PDFParserService> = new Map();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sessionId = formData.get('sessionId') as string || 'default';

    console.log('[API /pdf/upload] Received file:', file?.name, 'session:', sessionId);

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    
    const parser = new PDFParserService();
    const pageCount = await parser.loadDocument(arrayBuffer);

    pdfServices.set(sessionId, parser);

    console.log(`[API /pdf/upload] Document loaded, ${pageCount} pages`);

    return NextResponse.json({
      success: true,
      sessionId,
      pageCount,
      message: `PDF loaded successfully with ${pageCount} pages`,
    });
  } catch (err) {
    console.error('[API /pdf/upload] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to upload PDF' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('sessionId') || 'default';

  const parser = pdfServices.get(sessionId);
  
  if (!parser) {
    return NextResponse.json({ error: 'No session found' }, { status: 404 });
  }

  return NextResponse.json({
    pageCount: parser.getPageCount(),
    sessionId,
  });
}