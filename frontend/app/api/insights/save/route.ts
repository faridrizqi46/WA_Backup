import { NextRequest, NextResponse } from 'next/server';
import { prismaService } from '@/services/PrismaService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, defaultInsights } = body;

    if (!accountId || !defaultInsights) {
      return NextResponse.json({ error: 'accountId and defaultInsights are required' }, { status: 400 });
    }

    const updated = await prismaService.prisma.insightsRelated.upsert({
      where: { accountId },
      create: {
        accountId,
        defaultInsights,
        productPortion: [],
        walletShare: [],
        opportunityCount: 0,
        totalOpportunityAmount: '0',
      },
      update: {
        defaultInsights,
      },
    });

    return NextResponse.json({ success: true, id: updated.id });
  } catch (error) {
    console.error('[API] Save insights error:', error);
    return NextResponse.json(
      { error: 'Failed to save insights' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed. Use POST.' }, { status: 405 });
}