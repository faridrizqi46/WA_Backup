import { NextRequest, NextResponse } from 'next/server';
import { vectorDBService } from '@/services/VectorDBService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, content, metadata, collectionName, accountId } = body;

    if (!id || !content || !collectionName) {
      return NextResponse.json(
        { error: 'id, content, and collectionName are required' },
        { status: 400 }
      );
    }

    console.log(`[API /vector/store] Storing to collection: ${collectionName}${accountId ? ` for accountId: ${accountId}` : ''}`);

    await vectorDBService.storeEmbeddingToCollection(id, content, metadata || {}, collectionName, 850, 120, accountId);

    return NextResponse.json({ success: true, id, collectionName, accountId: accountId || null });
  } catch (error) {
    console.error('[API /vector/store] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to store embedding' },
      { status: 500 }
    );
  }
}
