export interface KPIMetrics {
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

export interface IndustryData {
  name: string;
  plan: number;
  realization: number;
}

export interface Opportunity {
  product: string;
  company: string;
  companySlug: string;
  potentialValue: number;
  offerDate: string;
  confidence: 'High' | 'Mid' | 'Low';
}

export interface FinancialMetric {
  label: string;
  value: string;
  direction: 'up' | 'down';
}

export interface CompanyNode {
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

export interface ValueChainNode {
  id: string;
  company: string;
  segment: 'Corporate' | 'Commercial' | 'SME' | 'Micro';
  clientType: 'Supplier' | 'Local Distributor' | 'Global Distributor';
  tier: 0 | 1 | 2;
  tier2?: ValueChainNode[];
}

export interface BusinessBenefit {
  label: string;
  value: string;
  positive: boolean;
}

export interface DataSource {
  title: string;
  description: string;
  sources: string[];
}

export interface OpportunityDetail {
  potentialValueDisplay: string;
  potentialValueUnit: string;
  businessBenefits: BusinessBenefit[];
  dataSources: DataSource[];
}

// ── XAI Scoring (explainable AI — reusable for any opportunity) ──

export interface XaiRmChallenge {
  challenge: string;
  response: string;
}

export interface XaiDimension {
  dimension: string;
  score: number;
  confidenceFlag: 'verified' | 'inferred' | 'estimated';
  evidence: string[];
  rmChallenge: XaiRmChallenge;
}

export interface XaiScoring {
  overallScore: number;
  scoreLabel: string;
  dimensions: XaiDimension[];
}

// ── Trade Intelligence Brief (reusable for any trade-finance opportunity) ──

export interface BolRecord {
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
}

export interface TradeIntelStat {
  label: string;
  value: string;
  unit?: string;
}

export interface TradeSupplierShare {
  name: string;
  weightKgs: number;
  weightLabel: string;
  color: string;
}

export interface DataLineageItem {
  title: string;
  description: string;
  reliability: 'highest' | 'high' | 'medium' | 'low';
}

export interface TradeIntelligenceBrief {
  title: string;
  agentLabel: string;
  dataRange: string;
  coverageNote: string;
  primaryStats: TradeIntelStat[];
  secondaryStats: TradeIntelStat[];
  bolRecords: BolRecord[];
  supplierShare: TradeSupplierShare[];
  tableSummaryNote: string;
  xaiScoring?: XaiScoring;
  dataLineage?: DataLineageItem[];
}

export interface AccountOpportunityItem {
  id?: string;
  offeredProduct: string;
  insight: string;
  confidenceLevel: 'High' | 'Mid' | 'Low';
  potentialValue: string;
  offerDate: string;
  reason: string;
  detail?: OpportunityDetail;
  isLoanAdvisory?: boolean;
  urgency?: 'Urgent' | 'This Month' | 'This Quarter';
  recommendedAction?: string;
  deadline?: string;
  tradeIntelligence?: TradeIntelligenceBrief;
}

export interface RelatedContact {
  name: string;
  title: string;
  email: string;
  phone: string;
  photo?: string;
}

export interface PieSlice {
  name: string;
  value: number;
  color: string;
}

export interface InsightsData {
  industryInsights: string[];
  clientInsights: string[];
}

export interface AccountInsightsRelated {
  defaultInsights: InsightsData;
  productPortion: PieSlice[];
  walletShare: PieSlice[];
  opportunityCount: number;
  totalOpportunityAmount: string;
  opportunities: AccountOpportunityItem[];
  contacts: RelatedContact[];
}

export interface AccountDetail {
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
  financialMetrics: FinancialMetric[];
  companyTree: CompanyNode[];
  keyHighlight: string;
  valueChainNodes: ValueChainNode[];
  insightsRelated?: AccountInsightsRelated;
}

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  date?: string;
}

export interface CrawlResult {
  content?: string;
  markdown?: string;
  html?: string;
  metadata?: Record<string, unknown>;
  error?: string;
  jobId?: string;
  status?: string;
}

export interface IngestionResult {
  searchQuery: string;
  searchResults: SearchResult[];
  crawlResults: CrawlResult[];
  totalSearchResults: number;
  totalCrawled: number;
  errors: string[];
}

// ── Trade KPI Result ────────────────────────────────────────────────────────

export interface SingleKPI {
  name: string;
  value: number | string;
  unit: string;
}

export interface SupplierKPIDetail {
  shipment: number;
  container: number;
  avgGapBetweenShipment: number;
}

export interface SupplierKPI {
  supplierName: string;
  details: SupplierKPIDetail;
}

export interface TimelineStep {
  step: number;
  action: string;
  details: string;
  timeline: string;
}

export interface DeckDecision {
  recommendation: 'Approve' | 'Review Further' | 'Reject';
  keyFactors: string[];
  riskIndicators: string[];
}

export interface DosAndDonts {
  do: string[];
  dont: string[];
}

export interface RMActionPlanResult {
  section1Timeline: TimelineStep[];
  section2WhatToBring: string[];
  section3DeckDecision: DeckDecision;
  section4OpeningScript: string;
  section5DosAndDonts: DosAndDonts;
  generatedAt: string;
  cached: boolean;
}

export interface TradeKPIResult {
  annualTradeValueUSD: SingleKPI;
  projectedVolumeMT: SingleKPI;
  avgShipmentFrequencyDays: SingleKPI;
  visibleContainersCount: SingleKPI;
  swiftTonnageYTD: SingleKPI;
  allTimeCustomsCount: SingleKPI;
  allTimeSwiftContainers: SingleKPI;
  allTimeSwiftVolumeMT: SingleKPI;
  avgGapBetweenShipments: SingleKPI;
  shipmentsPerYear: SingleKPI;
  swiftCadence: SingleKPI;
  supplierCadence: SingleKPI;
  peakShipmentMonth: SingleKPI;
  supplierShipments: SupplierKPI[];
}
