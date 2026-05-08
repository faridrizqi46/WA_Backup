import { NextRequest, NextResponse } from 'next/server';
import { prismaService } from '@/services/PrismaService';

interface BolRecordInput {
  tradeIntelligenceId: string;
  arrivalDate: Date | string;
  bolNumber: string;
  containerCount: number;
  grossWeightKgs: number;
  portOfDischarge: string;
  productShort: string;
  supplier: string;
  supplierConfirmed: boolean;
  vesselCarrier: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tradeIntelligenceId, records } = body;

    if (!tradeIntelligenceId || !records || !Array.isArray(records)) {
      return NextResponse.json(
        { error: 'tradeIntelligenceId and records array are required' },
        { status: 400 }
      );
    }

    // First verify tradeIntelligence exists
    const tradeIntel = await prismaService.prisma.tradeIntelligence.findUnique({
      where: { id: tradeIntelligenceId },
    });

    if (!tradeIntel) {
      return NextResponse.json(
        { error: `TradeIntelligence with id '${tradeIntelligenceId}' not found. Please create TradeIntelligence first.` },
        { status: 400 }
      );
    }

    const created = await prismaService.createBolRecords(
      records.map((record: BolRecordInput) => ({
        ...record,
        tradeIntelligenceId,
      }))
    );
    return NextResponse.json({ success: true, count: created.count });
  } catch (error) {
    console.error('[API /bol] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to insert BOL records' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tradeIntelligenceId = searchParams.get('tradeIntelligenceId');

    if (!tradeIntelligenceId) {
      return NextResponse.json(
        { error: 'tradeIntelligenceId is required' },
        { status: 400 }
      );
    }

    const records = await prismaService.getBolRecordsByTradeIntelligenceId(tradeIntelligenceId);
    return NextResponse.json(records);
  } catch (error) {
    console.error('[API /bol] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch BOL records' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tradeIntelligenceId = searchParams.get('tradeIntelligenceId');

    if (!tradeIntelligenceId) {
      return NextResponse.json(
        { error: 'tradeIntelligenceId is required' },
        { status: 400 }
      );
    }

    const deleted = await prismaService.deleteBolRecordsByTradeIntelligenceId(tradeIntelligenceId);
    return NextResponse.json({ success: true, count: deleted.count });
  } catch (error) {
    console.error('[API /bol] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete BOL records' },
      { status: 500 }
    );
  }
}