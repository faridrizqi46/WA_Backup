import { NextRequest, NextResponse } from 'next/server';
import { vectorDBService } from '@/services/VectorDBService';

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const collection = searchParams.get('collection');
    const prefix = searchParams.get('prefix');
    const id = searchParams.get('id');

    if (!collection) {
      return NextResponse.json(
        { success: false, error: 'collection parameter is required' },
        { status: 400 }
      );
    }

    let deletedCount = 0;

    if (id) {
      await vectorDBService.deleteEmbedding(id);
      deletedCount = 1;
    } else if (prefix) {
      deletedCount = await vectorDBService.deleteByPrefix(collection, prefix);
    } else {
      deletedCount = await vectorDBService.deleteAllInCollection(collection);
    }

    return NextResponse.json({ success: true, deleted: deletedCount, collection });
  } catch (error) {
    console.error('[API /vector/delete] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete' },
      { status: 500 }
    );
  }
}
