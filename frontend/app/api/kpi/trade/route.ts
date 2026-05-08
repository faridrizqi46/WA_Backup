import { NextRequest, NextResponse } from 'next/server';
import { tradeKPIService } from '@/services/TradeKPIService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { opportunityId } = body;

    if (!opportunityId) {
      return NextResponse.json({ error: 'opportunityId is required' }, { status: 400 });
    }

    const result = await tradeKPIService.extractTradeKPIs(opportunityId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /kpi/trade] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to extract KPIs' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}