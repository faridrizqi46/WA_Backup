import { NextRequest, NextResponse } from 'next/server';
import { vectorDBService } from '@/services/VectorDBService';
import { prismaService } from '@/services/PrismaService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, topK = 5 } = body;

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'query is required' },
        { status: 400 }
      );
    }

    console.log('[API /query] Searching for:', query);

    const results = await vectorDBService.queryEmbeddings(query, topK);

    const enrichedResults = await Promise.all(
      results.map(async (r) => {
        try {
          const crawlResult = await prismaService.getCrawlResultById(r.id);
          return {
            ...r,
            crawlResult,
          };
        } catch {
          return r;
        }
      })
    );

    return NextResponse.json({ success: true, data: enrichedResults });
  } catch (error) {
    console.error('[API /query] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to query embeddings' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const stats = await vectorDBService.getCollectionStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('[API /query] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get collection stats' },
      { status: 500 }
    );
  }
}

export async function PUT() {
  try {
    const embeddings = await vectorDBService.getAllEmbeddings(100);
    return NextResponse.json({ success: true, data: embeddings });
  } catch (error) {
    console.error('[API /query] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get embeddings' },
      { status: 500 }
    );
  }
}