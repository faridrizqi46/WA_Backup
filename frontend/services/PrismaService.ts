import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

export interface CompanyCreate {
  companyName: string;
  industries: string;
}

export interface CrawlResultCreate {
  companyId: string;
  url: string;
  title: string;
  content?: string;
  embedding?: string;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export function parsePortOfDischarge(productShort: string): string | null {
  const idx = productShort.indexOf('PORT OF DISCHARG');
  if (idx === -1) return null;
  const after = productShort.slice(idx);
  const colonIdx = after.indexOf(':');
  if (colonIdx === -1) return null;
  const rest = after.slice(colonIdx + 1).trim();
  const commaIdx = rest.indexOf(',');
  if (commaIdx === -1) return null;
  return rest.slice(0, commaIdx).trim();
}

export function buildRefURL(bolNumber: string): string {
  const prefix = bolNumber.slice(0, 4);
  const suffix = bolNumber.slice(4);
  if (prefix === 'ONEY') return `https://ecomm.one-line.com/one-ecom/manage-shipment/cargo-tracking?trakNoParam=${suffix}`;
  if (prefix === 'MAEU') return `https://www.maersk.com/tracking/${suffix}`;
  return 'https://www.msc.com/en/track-a-shipment';
}

export class PrismaService {
  readonly prisma: PrismaClient;

  constructor() {
    this.prisma = createPrismaClient();
  }

  async createCompany(data: CompanyCreate) {
    return this.prisma.company.create({
      data,
    });
  }

  async getCompanyById(id: string) {
    return this.prisma.company.findUnique({
      where: { id },
      include: { crawlResults: true },
    });
  }

  async getCompanyByName(companyName: string) {
    return this.prisma.company.findFirst({
      where: { companyName },
      include: { crawlResults: true },
    });
  }

  async getAllCompanies() {
    return this.prisma.company.findMany({
      include: { crawlResults: true },
    });
  }

  async updateCompany(id: string, data: Partial<CompanyCreate>) {
    return this.prisma.company.update({
      where: { id },
      data,
    });
  }

  async deleteCompany(id: string) {
    return this.prisma.company.delete({
      where: { id },
    });
  }

  async createCrawlResult(data: CrawlResultCreate) {
    return this.prisma.crawlResult.create({
      data,
    });
  }

  async getCrawlResultById(id: string) {
    return this.prisma.crawlResult.findUnique({
      where: { id },
    });
  }

  async getCrawlResultsByCompanyId(companyId: string) {
    return this.prisma.crawlResult.findMany({
      where: { companyId },
    });
  }

  async getAllCrawlResults() {
    return this.prisma.crawlResult.findMany();
  }

  async updateCrawlResult(id: string, data: Partial<CrawlResultCreate>) {
    return this.prisma.crawlResult.update({
      where: { id },
      data,
    });
  }

  async deleteCrawlResult(id: string) {
    return this.prisma.crawlResult.delete({
      where: { id },
    });
  }

  async getOrCreateCompany(companyName: string, industries: string = 'Unknown') {
    let company = await this.getCompanyByName(companyName);
    if (!company) {
      company = { ...(await this.createCompany({ companyName, industries })), crawlResults: [] };
    }
    return company;
  }

  async searchCompanies(query: string) {
    return this.prisma.company.findMany({
      where: {
        OR: [
          { companyName: { contains: query } },
          { industries: { contains: query } },
        ],
      },
      include: { crawlResults: true },
    });
  }

  async createBolRecord(data: {
    tradeIntelligenceId: string;
    arrivalDate: Date;
    bolNumber: string;
    containerCount: number;
    grossWeightKgs: number;
    portOfDischarge: string;
    productShort: string;
    supplier: string;
    supplierConfirmed: boolean;
    vesselCarrier: string;
  }) {
    const refURL = buildRefURL(data.bolNumber);
    const parsedPort = parsePortOfDischarge(data.productShort);
    return this.prisma.bOLRecord.create({
      data: {
        ...data,
        portOfDischarge: parsedPort || data.portOfDischarge,
        refURL,
      },
    });
  }

  async createBolRecords(data: {
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
  }[]) {
    const records = data.map(r => ({
      ...r,
      arrivalDate: typeof r.arrivalDate === 'string' ? new Date(r.arrivalDate) : r.arrivalDate,
      refURL: buildRefURL(r.bolNumber),
      portOfDischarge: parsePortOfDischarge(r.productShort) || r.portOfDischarge,
    }));
    return this.prisma.bOLRecord.createMany({
      data: records,
    });
  }

  async getBolRecordsByTradeIntelligenceId(tradeIntelligenceId: string) {
    return this.prisma.bOLRecord.findMany({
      where: { tradeIntelligenceId },
      orderBy: { arrivalDate: 'desc' },
    });
  }

  async getBolRecordsByOpportunityId(opportunityId: string) {
    return this.prisma.bOLRecord.findMany({
      where: {
        tradeIntelligence: {
          opportunityId,
        },
      },
      orderBy: { arrivalDate: 'desc' },
    });
  }

  async deleteBolRecord(id: string) {
    return this.prisma.bOLRecord.delete({
      where: { id },
    });
  }

  async deleteBolRecordsByTradeIntelligenceId(tradeIntelligenceId: string) {
    return this.prisma.bOLRecord.deleteMany({
      where: { tradeIntelligenceId },
    });
  }

  async createValueChainNodes(data: {
    accountId: string;
    company: string;
    parentCompany?: string | null;
    segment: string;
    clientType: string;
    tier: number;
  }[]) {
    return this.prisma.valueChainNode.createMany({
      data,
    });
  }

async deleteValueChainNodesByAccountId(accountId: string, clientType?: string) {
    return this.prisma.valueChainNode.deleteMany({
      where: {
        accountId,
        ...(clientType ? { clientType } : {}),
      },
    });
  }

  async getValueChainNodesByAccountId(accountId: string, clientType?: string) {
    return this.prisma.valueChainNode.findMany({
      where: {
        accountId,
        ...(clientType ? { clientType } : {}),
      },
      orderBy: { tier: 'asc' },
    });
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }
}

export const prismaService = new PrismaService();