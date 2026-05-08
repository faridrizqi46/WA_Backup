import { NextRequest, NextResponse } from 'next/server';
import { dataIngestionService } from '@/services/DataIngestionService';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  try {
    const results = await dataIngestionService.search(query);
    return NextResponse.json({ results });
  } catch (err) {
    console.error('Search error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch search results' },
      { status: 500 }
    );
  }
}