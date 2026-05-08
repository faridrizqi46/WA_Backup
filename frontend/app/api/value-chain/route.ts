import { NextRequest, NextResponse } from 'next/server';
import { prismaService } from '@/services/PrismaService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, nodes } = body;

    if (!accountId || !nodes || !Array.isArray(nodes)) {
      return NextResponse.json(
        { error: 'accountId and nodes array are required' },
        { status: 400 }
      );
    }

    const formattedNodes = nodes.map((node: { company: string; parentCompany?: string | null; segment?: string; clientType?: string; tier: number }) => ({
      accountId,
      company: node.company,
      parentCompany: node.parentCompany || null,
      segment: node.segment || 'SME',
      clientType: node.clientType || 'Local Distributor',
      tier: node.tier,
    }));

    const created = await prismaService.createValueChainNodes(formattedNodes);
    return NextResponse.json({ success: true, count: created.count });
  } catch (error) {
    console.error('[API /value-chain] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to insert value chain nodes' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const clientType = searchParams.get('clientType');

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    const deleted = await prismaService.deleteValueChainNodesByAccountId(accountId, clientType || undefined);
    return NextResponse.json({ success: true, count: deleted.count });
  } catch (error) {
    console.error('[API /value-chain] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete value chain nodes' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const clientType = searchParams.get('clientType');

    console.log('[API /value-chain] GET - accountId:', accountId, 'clientType:', clientType);

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    const nodes = await prismaService.getValueChainNodesByAccountId(accountId, clientType || undefined);
    console.log('[API /value-chain] Found nodes:', nodes.length);

    return NextResponse.json(nodes);
  } catch (error) {
    console.error('[API /value-chain] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch value chain nodes' },
      { status: 500 }
    );
  }
}