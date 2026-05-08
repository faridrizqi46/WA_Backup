require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function update() {
  const result = await prisma.valueChainNode.updateMany({
    data: { accountId: '9502431f-0ab1-446f-8944-32cb1720f119' }
  });
  console.log('Updated', result.count, 'records');
  await prisma.$disconnect();
}

update().catch(e => { console.error(e); process.exit(1); });