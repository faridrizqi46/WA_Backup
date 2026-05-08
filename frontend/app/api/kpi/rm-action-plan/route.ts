import { NextRequest, NextResponse } from 'next/server';
import { tradeKPIService } from '@/services/TradeKPIService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const opportunityId = searchParams.get('opportunityId');

    if (!opportunityId) {
      return NextResponse.json({ error: 'opportunityId is required' }, { status: 400 });
    }

    const companyName = 'PT Japfa Comfeed Indonesia';
    const result = await tradeKPIService.generateRMActionPlan(opportunityId, companyName);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /kpi/rm-action-plan] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate RM Action Plan',
        message: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Please try again or contact your administrator if the problem persists.',
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed. Use GET.' }, { status: 405 });
}