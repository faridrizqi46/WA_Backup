import { NextRequest, NextResponse } from 'next/server';
import { dataIngestionService } from '@/services/DataIngestionService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    console.log(`[API /crawl] Received request for URL: ${url}`);

    if (!url) {
      console.warn('[API /crawl] URL is required');
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log('[API /crawl] Calling dataIngestionService.crawlUrl...');
    const result = await dataIngestionService.crawlUrl(url);
    console.log(`[API /crawl] Result: ${JSON.stringify(result)}`);

    return NextResponse.json(result);
  } catch (err) {
    console.error('[API /crawl] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to crawl URL' },
      { status: 500 }
    );
  }
}