import { NextRequest, NextResponse } from 'next/server';
import { prismaService } from '@/services/PrismaService';
import { vectorDBService } from '@/services/VectorDBService';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get('companyId');

  try {
    if (companyId) {
      const results = await prismaService.getCrawlResultsByCompanyId(companyId);
      return NextResponse.json({ success: true, data: results });
    }

    const results = await prismaService.getAllCrawlResults();
    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('[API /crawl-results] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch crawl results' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, url, title, content } = body;

    if (!companyId || !url || !title) {
      return NextResponse.json(
        { success: false, error: 'companyId, url, and title are required' },
        { status: 400 }
      );
    }

    console.log('[API /crawl-results] Creating crawl result:', { companyId, url, title });

    const crawlResult = await prismaService.createCrawlResult({
      companyId,
      url,
      title,
      content: content || '',
    });

    if (content) {
      try {
        console.log('[API /crawl-results] Storing embedding in ChromaDB...');
        await vectorDBService.storeEmbedding(crawlResult.id, content, {
          companyId,
          url,
          title,
        });
        console.log('[API /crawl-results] Embedding stored successfully');
      } catch (embedError) {
        console.error('[API /crawl-results] Failed to store embedding:', embedError);
      }
    }

    return NextResponse.json({ success: true, data: crawlResult });
  } catch (error) {
    console.error('[API /crawl-results] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create crawl result' },
      { status: 500 }
    );
  }
}