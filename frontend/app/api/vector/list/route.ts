import { NextRequest, NextResponse } from 'next/server';
import { vectorDBService } from '@/services/VectorDBService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const collectionName = searchParams.get('collection');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    if (!collectionName) {
      return NextResponse.json(
        { success: false, error: 'collection query parameter is required' },
        { status: 400 }
      );
    }

    console.log(`[API /vector/list] Collection: ${collectionName}, Limit: ${limit}`);

    const results = await vectorDBService.getCollectionData(collectionName, limit);

    return NextResponse.json({ success: true, data: results, collection: collectionName, count: results.length });
  } catch (error) {
    console.error('[API /vector/list] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to list' },
      { status: 500 }
    );
  }
}
