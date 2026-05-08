import { NextResponse } from 'next/server';
import { prismaService } from '@/services/PrismaService';

export async function GET() {
  try {
    const records = await prismaService.prisma.bOLRecord.findMany({
      orderBy: { arrivalDate: 'desc' },
    });
    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}