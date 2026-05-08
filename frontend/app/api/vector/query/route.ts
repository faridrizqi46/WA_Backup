import { NextRequest, NextResponse } from 'next/server';
import { vectorDBService } from '@/services/VectorDBService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, collectionName, topK = 5 } = body;

    if (!query || !collectionName) {
      return NextResponse.json(
        { success: false, error: 'query and collectionName are required' },
        { status: 400 }
      );
    }

    console.log(`[API /vector/query] Query: "${query}" in collection: ${collectionName}`);

    const results = await vectorDBService.queryByCollection(query, collectionName, topK);

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('[API /vector/query] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to query' },
      { status: 500 }
    );
  }
}
