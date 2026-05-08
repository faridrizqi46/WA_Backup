import { NextRequest, NextResponse } from 'next/server';
import { insightService } from '@/services/InsightService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, companyName } = body;

    const company = companyName || 'PT Japfa Comfeed Indonesia';
    const id = accountId || 'test-japfa';

    console.log('[API /api/test-insights] Generating insights for:', company);

    const result = await insightService.generateInsights(id, company);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /test-insights] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate insights', 
        message: error instanceof Error ? error.message : 'Unknown error',
        industryInsights: [],
        clientInsights: []
      },
      { status: 200 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to generate insights',
    body: { accountId: 'optional', companyName: 'optional' }
  });
}