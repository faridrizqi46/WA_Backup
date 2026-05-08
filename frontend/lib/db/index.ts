import 'server-only';
import { Pool } from 'pg';
import type { LoanFacilityRow, BankLoanGroup } from '@/types/database';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.error('DATABASE_URL is not set');
      throw new Error('DATABASE_URL environment variable is not set');
    }
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
        ca: undefined,
        cert: undefined,
        key: undefined,
      },
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  return pool;
}

export async function getLoanFacilitiesByAccountId(
  accountId: string
): Promise<BankLoanGroup[]> {
  const p = getPool();
  const result = await p.query<LoanFacilityRow>(
    `SELECT * FROM LoanFacilities 
     WHERE "accountId" = $1 
     ORDER BY "expiryDate" ASC`,
    [accountId]
  );

  const rows = result.rows;

  const groupsMap = new Map<string, BankLoanGroup>();
  for (const row of rows) {
    if (!groupsMap.has(row.bankShortName)) {
      groupsMap.set(row.bankShortName, {
        bank: row.bank,
        shortName: row.bankShortName,
        facilities: [],
      });
    }
    groupsMap.get(row.bankShortName)!.facilities.push({
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

  return Array.from(groupsMap.values());
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}