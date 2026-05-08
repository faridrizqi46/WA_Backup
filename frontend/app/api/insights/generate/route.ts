import { NextRequest, NextResponse } from 'next/server';
import { insightService } from '@/services/InsightService';
import { prismaService } from '@/services/PrismaService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId } = body;

    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
    }

    let companyName = 'PT Japfa Comfeed Indonesia';
    
    try {
      const account = await prismaService.prisma.account.findUnique({
        where: { id: accountId },
        include: { company: true },
      });

      if (account?.company) {
        companyName = account.company.companyName;
      }
    } catch (e) {
      console.log('[API] Account not found, using default company name');
    }

    const result = await insightService.generateInsights(accountId, companyName);

    try {
      await prismaService.prisma.insightHistory.create({
        data: {
          accountId,
          industryInsights: result.industryInsights,
          clientInsights: result.clientInsights,
          query: 'Auto-generated insights',
        },
      });
    } catch (e) {
      console.log('[API] Could not save insight history');
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Insight generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed. Use POST.' }, { status: 405 });
}