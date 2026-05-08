import { NextResponse } from 'next/server';
import { getLoanBankGroups } from '@/services/DatabaseService';

export async function GET() {
  try {
    const groups = await getLoanBankGroups();
    return NextResponse.json(groups);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch loan bank groups' }, { status: 500 });
  }
}