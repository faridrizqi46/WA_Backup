import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';
import { parsePortOfDischarge, buildRefURL } from './PrismaService';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export interface FinancialMetricDTO {
  label: string;
  value: string;
  direction: 'up' | 'down';
}

export interface CompanyTreeNodeDTO {
  name: string;
  ownershipType: string;
  city: string;
  stateProvince: string;
  country: string;
  ibrProduct: string;
  isAnchor?: boolean;
  indent?: number;
  prefix?: '-' | '+';
}

export interface ValueChainNodeDTO {
  id: string;
  company: string;
  segment: 'Corporate' | 'Commercial' | 'SME' | 'Micro';
  clientType: 'Supplier' | 'Local Distributor' | 'Global Distributor';
  tier: 0 | 1 | 2;
  tier2?: ValueChainNodeDTO[];
}

export interface TradeIntelligenceDTO {
  title: string;
  agentLabel: string;
  dataRange: string;
  coverageNote: string;
  primaryStats: { label: string; value: string; unit?: string }[];
  secondaryStats: { label: string; value: string; unit?: string }[];
  bolRecords: {
    bolNumber: string;
    arrivalDate: string;
    supplier: string | null;
    supplierConfirmed: boolean;
    productShort: string;
    grossWeightKgs: number;
    containerCount: number;
    portOfDischarge: string | null;
    vesselCarrier: string;
    refURL: string;
  }[];
  supplierShare: { name: string; weightKgs: number; weightLabel: string; color: string }[];
  tableSummaryNote: string;
}

export interface OpportunityDTO {
  id?: string;
  offeredProduct: string;
  insight: string;
  confidenceLevel: 'High' | 'Mid' | 'Low';
  potentialValue: string;
  offerDate: string;
  reason: string;
  isLoanAdvisory?: boolean;
  urgency?: 'Urgent' | 'This Month' | 'This Quarter';
  recommendedAction?: string;
  deadline?: string;
  tradeIntelligence?: TradeIntelligenceDTO;
}

export interface InsightsRelatedDTO {
  defaultInsights: { industryInsights: string[]; clientInsights: string[] };
  productPortion: { name: string; value: number; color: string }[];
  walletShare: { name: string; value: number; color: string }[];
  opportunityCount: number;
  totalOpportunityAmount: string;
}

export interface RelatedContactDTO {
  name: string;
  title: string;
  email: string;
  phone: string;
  photo?: string;
}

export interface AccountDetailDTO {
  id: string;
  name: string;
  layerId: string;
  industry: string;
  type: string;
  segment: string;
  cfoCount: number;
  accountNumber: string;
  description: string;
  headquarters: string;
  latitude: string;
  longitude: string;
  alsoFoundAt: string[];
  keyHighlight: string;
  financialMetrics: FinancialMetricDTO[];
  companyTree: CompanyTreeNodeDTO[];
  valueChainNodes: ValueChainNodeDTO[];
  opportunities: OpportunityDTO[];
  insightsRelated?: InsightsRelatedDTO;
  contacts: RelatedContactDTO[];
}

export interface KPIMetricsDTO {
  revenueRealization: number;
  revenuePlan: number;
  accountRealization: number;
  accountPlan: number;
  currentQuarter: number;
  currentQuarterLabel: string;
  previousQuarter: number;
  previousQuarterLabel: string;
  generatedLeads: number;
  topIndustries: string[];
}

export interface IndustryDataDTO {
  name: string;
  plan: number;
  realization: number;
}

export interface OpportunitySummaryDTO {
  product: string;
  company: string;
  companySlug?: string;
  potentialValue: number;
  offerDate: string;
  confidence: 'High' | 'Mid' | 'Low';
}

export interface LoanFacilityDTO {
  facilityType: string;
  maxLimitRpM: number;
  maxLimitNote?: string;
  borrowerTag: string;
  borrowerType: 'Parent' | 'Subsidiary';
  expiryDate: string;
  expiryYear: number;
  bankShortName: string;
  bankFull: string;
}

export async function getAllAccounts(): Promise<AccountDetailDTO[]> {
  const accounts = await prisma.account.findMany({
    include: {
      financialMetrics: true,
      companyTree: true,
      valueChainNodes: true,
      opportunities: {
        include: {
          detail: true,
          tradeIntelligence: {
            include: {
              bolRecords: true,
            },
          },
          xaiScoring: true,
          dataLineage: true,
        },
      },
      insightsRelated: true,
      relatedContacts: true,
    },
  });

  return accounts.map((account) => ({
    id: account.id,
    name: account.name,
    layerId: account.layerId,
    industry: account.industry,
    type: account.type,
    segment: account.segment,
    cfoCount: account.cfoCount,
    accountNumber: account.accountNumber,
    description: account.description,
    headquarters: account.headquarters,
    latitude: account.latitude,
    longitude: account.longitude,
    alsoFoundAt: account.alsoFoundAt as string[],
    keyHighlight: account.keyHighlight,
    financialMetrics: account.financialMetrics.map((fm) => ({
      label: fm.label,
      value: fm.value,
      direction: fm.direction as 'up' | 'down',
    })),
    companyTree: account.companyTree.map((ct) => ({
      name: ct.name,
      ownershipType: ct.ownershipType,
      city: ct.city,
      stateProvince: ct.stateProvince,
      country: ct.country,
      ibrProduct: ct.ibrProduct,
      isAnchor: ct.isAnchor || false,
      indent: ct.indent || 0,
      prefix: (ct.prefix || undefined) as '-' | '+' | undefined,
    })),
    valueChainNodes: account.valueChainNodes.map((vc) => ({
      id: vc.id,
      company: vc.company,
      segment: vc.segment as 'Corporate' | 'Commercial' | 'SME' | 'Micro',
      clientType: vc.clientType as 'Supplier' | 'Local Distributor' | 'Global Distributor',
      tier: vc.tier as 0 | 1 | 2,
    })),
    opportunities: account.opportunities.map((opp) => ({
      id: opp.id,
      offeredProduct: opp.offeredProduct,
      insight: opp.insight,
      confidenceLevel: opp.confidenceLevel as 'High' | 'Mid' | 'Low',
      potentialValue: opp.potentialValue,
      offerDate: opp.offerDate,
      reason: opp.reason,
      isLoanAdvisory: opp.isLoanAdvisory || undefined,
      urgency: opp.urgency as 'Urgent' | 'This Month' | 'This Quarter' | undefined,
      recommendedAction: opp.recommendedAction || undefined,
      deadline: opp.deadline || undefined,
      detail: opp.detail
        ? {
            potentialValueDisplay: opp.detail.potentialValueDisplay,
            potentialValueUnit: opp.detail.potentialValueUnit,
            businessBenefits: opp.detail.businessBenefits as { label: string; value: string; positive: boolean }[],
            dataSources: opp.detail.dataSources as { title: string; description: string; sources: string[] }[],
          }
        : undefined,
      tradeIntelligence: opp.tradeIntelligence
        ? {
            title: opp.tradeIntelligence.title,
            agentLabel: opp.tradeIntelligence.agentLabel,
            dataRange: opp.tradeIntelligence.dataRange,
            coverageNote: opp.tradeIntelligence.coverageNote,
            primaryStats: opp.tradeIntelligence.primaryStats as { label: string; value: string; unit?: string }[],
            secondaryStats: opp.tradeIntelligence.secondaryStats as { label: string; value: string; unit?: string }[],
            bolRecords: (opp.tradeIntelligence.bolRecords || []).map((r: any) => {
              return {
                bolNumber: r.bolNumber,
                arrivalDate: r.arrivalDate instanceof Date ? r.arrivalDate.toISOString().split('T')[0] : r.arrivalDate,
                supplier: r.supplier || null,
                supplierConfirmed: r.supplierConfirmed,
                productShort: r.productShort,
                grossWeightKgs: r.grossWeightKgs,
                containerCount: r.containerCount,
                portOfDischarge: r.portOfDischarge || parsePortOfDischarge(r.productShort) || null,
                vesselCarrier: r.vesselCarrier,
                refURL: r.refURL || buildRefURL(r.bolNumber),
              };
            }),
            supplierShare: opp.tradeIntelligence.supplierShare as {
              name: string;
              weightKgs: number;
              weightLabel: string;
              color: string;
            }[],
            tableSummaryNote: opp.tradeIntelligence.tableSummaryNote,
            xaiScoring: opp.xaiScoring
              ? {
                  overallScore: opp.xaiScoring.overallScore,
                  scoreLabel: opp.xaiScoring.scoreLabel,
                  dimensions: opp.xaiScoring.dimensions as {
                    dimension: string;
                    score: number;
                    confidenceFlag: string;
                    evidence: string[];
                    rmChallenge: { challenge: string; response: string };
                  }[],
                }
              : undefined,
            dataLineage: opp.dataLineage
              ? opp.dataLineage.map((dl: any) => ({
                  title: dl.title,
                  description: dl.description,
                  reliability: dl.reliability as 'highest' | 'high' | 'medium' | 'low',
                }))
              : undefined,
          }
        : undefined,
    })),
    insightsRelated: account.insightsRelated
      ? {
          defaultInsights: {
            industryInsights: (account.insightsRelated.defaultInsights as { industryInsights: string[] }).industryInsights,
            clientInsights: (account.insightsRelated.defaultInsights as { clientInsights: string[] }).clientInsights,
          },
          productPortion: account.insightsRelated.productPortion as { name: string; value: number; color: string }[],
          walletShare: account.insightsRelated.walletShare as { name: string; value: number; color: string }[],
          opportunityCount: account.insightsRelated.opportunityCount,
          totalOpportunityAmount: account.insightsRelated.totalOpportunityAmount,
        }
      : undefined,
    contacts: account.relatedContacts.map((c) => ({
      name: c.name,
      title: c.title,
      email: c.email,
      phone: c.phone,
      photo: c.photo || undefined,
    })),
  }));
}

export async function getAccountById(companyId: string): Promise<AccountDetailDTO | null> {
  const accounts = await getAllAccounts();
  return accounts.find((a) => a.id === companyId) || null;
}

export async function getKPIMetrics(): Promise<KPIMetricsDTO | null> {
  const kpi = await prisma.kPIMetrics.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!kpi) return null;
  return {
    revenueRealization: kpi.revenueRealization,
    revenuePlan: kpi.revenuePlan,
    accountRealization: kpi.accountRealization,
    accountPlan: kpi.accountPlan,
    currentQuarter: kpi.currentQuarter,
    currentQuarterLabel: kpi.currentQuarterLabel,
    previousQuarter: kpi.previousQuarter,
    previousQuarterLabel: kpi.previousQuarterLabel,
    generatedLeads: kpi.generatedLeads,
    topIndustries: kpi.topIndustries as string[],
  };
}

export async function getLoanBankGroups() {
  const groups = await prisma.loanBankGroup.findMany({
    include: { facilities: true },
  });

  return groups.map((g) => ({
    bank: g.bank,
    shortName: g.shortName,
    facilities: g.facilities.map((f) => ({
      facilityType: f.facilityType,
      maxLimitRpM: f.maxLimitRpM,
      maxLimitNote: f.maxLimitNote || undefined,
      borrowerTag: f.borrowerTag,
      borrowerType: f.borrowerType as 'Parent' | 'Subsidiary',
      expiryDate: f.expiryDate,
      expiryYear: f.expiryYear,
      bankShortName: g.shortName,
      bankFull: g.bank,
    })),
  }));
}

export async function disconnect() {
  await prisma.$disconnect();
  await pool.end();
}