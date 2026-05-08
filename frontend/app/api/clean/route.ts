import { NextRequest, NextResponse } from 'next/server';
import { llmService, CleanResult } from '@/services/LLMService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, url } = body;

    console.log(`[API /clean] Received request, content length: ${content?.length || 0}`);

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const result: CleanResult = await llmService.cleanContent(content, url);
    console.log(`[API /clean] Result: ${JSON.stringify({ ...result, cleanedContent: result.cleanedContent?.substring(0, 100) + '...' })}`);

    return NextResponse.json(result);
  } catch (err) {
    console.error('[API /clean] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to clean content' },
      { status: 500 }
    );
  }
}