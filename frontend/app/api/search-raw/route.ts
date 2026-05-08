import { NextRequest, NextResponse } from 'next/server';

const SEARCH_API_URL = process.env.SEARCH_API_URL || 'https://www.searchapi.io/api/v1/search';
const SEARCH_API_KEY = process.env.SEARCHAPI_API_KEY || process.env.SEARCH_API_KEY;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  console.log(`[API /search-raw] Raw search for: ${query}`);

  if (!SEARCH_API_KEY) {
    return NextResponse.json({ error: 'SearchAPI key not configured' }, { status: 500 });
  }

  try {
    const params = new URLSearchParams({
      q: query,
      engine: 'google_news',
      num: '10',
    });

    console.log(`[API /search-raw] Request URL: ${SEARCH_API_URL}?${params}`);

    const response = await fetch(`${SEARCH_API_URL}?${params}`, {
      headers: {
        'Authorization': `Bearer ${SEARCH_API_KEY}`,
        'Accept': 'application/json',
      },
    });

    console.log(`[API /search-raw] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API /search-raw] API error: ${errorText}`);
      return NextResponse.json({ error: `Search API failed: ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    console.log(`[API /search-raw] Raw response keys: ${Object.keys(data)}`);
    console.log(`[API /search-raw] Response data:`, JSON.stringify(data, null, 2).slice(0, 5000));

    return NextResponse.json({
      success: true,
      query,
      status: response.status,
      data,
      summary: {
        hasOrganicResults: !!data.organic_results,
        organicResultsCount: data.organic_results?.length || 0,
        hasResults: !!data.results,
        resultsCount: data.results?.length || 0,
        topLevelKeys: Object.keys(data).slice(0, 20),
      }
    });
  } catch (err) {
    console.error(`[API /search-raw] Error: ${err}`);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to call SearchAPI' },
      { status: 500 }
    );
  }
}