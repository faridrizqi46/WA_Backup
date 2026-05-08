import { NextRequest, NextResponse } from 'next/server';
import { vectorDBService } from '@/services/VectorDBService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const collection = searchParams.get('collection') || '';
    const topK = parseInt(searchParams.get('topK') || '5', 10);

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    let results;
    if (collection) {
      results = await vectorDBService.queryByCollection(query, collection, topK);
    } else {
      results = await vectorDBService.queryEmbeddings(query, topK);
    }

    return NextResponse.json({
      query,
      collection: collection || 'scrawling-data (default)',
      count: results.length,
      results: results.map(r => ({
        id: r.id,
        content: r.content.substring(0, 200) + (r.content.length > 200 ? '...' : ''),
        distance: r.distance,
        metadata: r.metadata,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Query failed' },
      { status: 500 }
    );
  }
}