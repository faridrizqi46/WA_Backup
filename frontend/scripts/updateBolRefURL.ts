import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function buildRefURL(bolNumber: string): string {
  const prefix = bolNumber.slice(0, 4);
  const suffix = bolNumber.slice(4);
  if (prefix === 'ONEY') return `https://ecomm.one-line.com/one-ecom/manage-shipment/cargo-tracking?trakNoParam=${suffix}`;
  if (prefix === 'MAEU') return `https://www.maersk.com/tracking/${suffix}`;
  return 'https://www.msc.com/en/track-a-shipment';
}

async function main() {
  const records = await prisma.bOLRecord.findMany();
  let count = 0;
  for (const r of records) {
    const refURL = buildRefURL(r.bolNumber);
    await prisma.bOLRecord.update({ where: { id: r.id }, data: { refURL } });
    count++;
  }
  console.log(`Updated ${count} records`);
}

main().then(() => prisma.$disconnect());