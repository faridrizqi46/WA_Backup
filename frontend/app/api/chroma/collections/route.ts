import { NextResponse } from 'next/server';
import { vectorDBService } from '@/services/VectorDBService';

export async function GET() {
  try {
    const collections = await vectorDBService.getCollectionsList();

    const collectionDetails: Record<string, any> = {};

    for (const collectionName of collections) {
      try {
        const data = await vectorDBService.getCollectionData(collectionName, 10);
        collectionDetails[collectionName] = {
          count: data.length,
          sampleIds: data.slice(0, 5).map((d: { id: string }) => d.id),
          hasData: data.length > 0,
        };
      } catch (err) {
        collectionDetails[collectionName] = {
          error: err instanceof Error ? err.message : 'Failed to get collection data',
        };
      }
    }

    return NextResponse.json({
      collections,
      details: collectionDetails,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get collections' },
      { status: 500 }
    );
  }
}