import { NextResponse } from 'next/server';
import { prismaService } from '@/services/PrismaService';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;

    if (!accountId) {
      return NextResponse.json({ error: 'Missing accountId' }, { status: 400 });
    }

    const rows = await prismaService.prisma.loanFacilities.findMany({
      where: { accountId },
      orderBy: { expiryDate: 'asc' },
    });

    const groupsMap: Record<string, { bank: string; shortName: string; facilities: any[] }> = {};
    for (const row of rows) {
      if (!groupsMap[row.bankShortName]) {
        groupsMap[row.bankShortName] = {
          bank: row.bank,
          shortName: row.bankShortName,
          facilities: [],
        };
      }
      groupsMap[row.bankShortName].facilities.push({
        facilityType: row.facilityType,
        maxLimitRpM: Number(row.maxLimitRpM),
        maxLimitNote: row.maxLimitNote ?? undefined,
        borrowerTag: row.borrowerTag,
        borrowerType: row.borrowerType,
        expiryDate: row.expiryDate instanceof Date
          ? row.expiryDate.toISOString().split('T')[0]
          : row.expiryDate ? String(row.expiryDate) : null,
        expiryYear: row.expiryYear ?? null,
        insight: row.insight,
        fullInsight: row.fullInsight ?? undefined,
      });
    }

    return NextResponse.json({ groups: Object.values(groupsMap) });
  } catch (error) {
    console.error('Failed to fetch loan facilities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loan facilities', detail: String(error) },
      { status: 500 }
    );
  }
}