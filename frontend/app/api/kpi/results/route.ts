import { NextRequest, NextResponse } from 'next/server';
import { prismaService } from '@/services/PrismaService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const opportunityId = searchParams.get('opportunityId');

    if (!opportunityId) {
      return NextResponse.json({ error: 'opportunityId is required' }, { status: 400 });
    }

    const rows = await prismaService.prisma.tradeKPIResult.findMany({
      where: { opportunityId },
      orderBy: { property: 'asc' },
    });

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}