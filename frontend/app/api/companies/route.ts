import { NextRequest, NextResponse } from 'next/server';
import { prismaService } from '@/services/PrismaService';

export async function GET() {
  try {
    const companies = await prismaService.getAllCompanies();
    return NextResponse.json({ success: true, data: companies });
  } catch (error) {
    console.error('[API /companies] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, industries } = body;

    if (!companyName) {
      return NextResponse.json(
        { success: false, error: 'companyName is required' },
        { status: 400 }
      );
    }

    const company = await prismaService.createCompany({
      companyName,
      industries: industries || 'Unknown',
    });

    return NextResponse.json({ success: true, data: company });
  } catch (error) {
    console.error('[API /companies] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create company' },
      { status: 500 }
    );
  }
}