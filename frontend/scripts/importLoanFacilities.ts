import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Importing loan facilities data...');

  const filePath = path.join(process.cwd(), 'data', 'HBJP_Japfa_enriched (3).json');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(fileContent);

  const account = await prisma.account.findFirst({
    where: { name: { contains: 'JAPFA' } },
  });

  if (!account) {
    console.error('Account with JAPFA not found');
    process.exit(1);
  }

  console.log(`Found account: ${account.id}`);

  const loanFacilitiesData = (data as any[]).map((item) => ({
    accountId: account.id,
    bank: item.bank ?? '',
    bankShortName: item.bankShortName ?? '',
    borrowerTag: item.borrowerTag ?? '',
    borrowerType: item.borrowerType ?? '',
    createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
    expiryDate: item.expiryDate ? new Date(item.expiryDate) : new Date(),
    expiryYear: item.expiryYear ?? 0,
    facilityType: item.facilityType ?? '',
    fullInsight: item.fullInsight ?? '',
    insight: item.insight ?? '',
    maxLimitNote: item.maxLimitNote ?? '',
    maxLimitRpM: BigInt(item.maxLimitRpM ?? 0),
    updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
  }));

  for (const item of loanFacilitiesData) {
    await prisma.loanFacilities.create({ data: item });
  }

  console.log(`Imported ${loanFacilitiesData.length} loan facilities records`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });