require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function check() {
  const acc = await prisma.account.findUnique({
    where: { id: '9502431f-0ab1-446f-8944-32cb1720f119' }
  });
  console.log('Account:', acc ? acc.name : 'NOT FOUND');

  const currentVC = await prisma.valueChainNode.findMany({
    select: { accountId: true, company: true }
  });
  console.log('Current ValueChainNode accountIds:', [...new Set(currentVC.map(v => v.accountId))]);
  console.log('Total VC records:', currentVC.length);

  await prisma.$disconnect();
}

check().catch(e => { console.error(e); process.exit(1); });