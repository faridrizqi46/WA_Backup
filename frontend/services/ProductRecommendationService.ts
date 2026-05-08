import { VectorDBService, QueryResult } from './VectorDBService';
import { LLMService } from './LLMService';
import { prismaService } from './PrismaService';
import signalsRaw from '@/data/product-signals.json';

interface SignalsEntry {
  product: string;
  signals: string[];
  generatedAt: string;
}

interface SignalsData {
  [key: string]: SignalsEntry;
}

const signalsData: SignalsData = signalsRaw as SignalsData;

export interface FeatureScore {
  name: string;
  score: number;
  evidence?: string;
}

export interface ParameterRecommendation {
  parameter: string;
  recommended: boolean;
  confidenceScore: number;
  features: FeatureScore[];
  summary: string;
}

export interface CompanyRecommendation {
  company: string;
  recommendations: ParameterRecommendation[];
  overallSummary: string;
}

const COLLECTIONS = ['scrawling-data', 'JapfaAnnualReport2025'];

export class ProductRecommendationService {
  private vectorDBService: VectorDBService;
  private llmService: LLMService;
  private mlApiUrl: string;

  constructor(
    vectorDBService: VectorDBService,
    llmService: LLMService,
    mlApiUrl: string = 'http://localhost:8000'
  ) {
    this.vectorDBService = vectorDBService;
    this.llmService = llmService;
    this.mlApiUrl = mlApiUrl;
  }

  private buildQueryText(company: string, parameter: string): string {
    const signals = signalsData[parameter]?.signals || [];
    if (signals.length === 0) {
      console.warn(`[ProductRec] No signals found for ${parameter}, using fallback`);
      return `${company} ${parameter} trade finance import export`;
    }
    const signalsText = signals.join(' ');
    return `${company} ${signalsText}`;
  }

  private async getCompanyEnrichmentData(companyName: string) {
    let account: any = null;
    let matchMethod = '';

    const words = companyName.split(/\s+/).filter(w => w.length > 2);
    if (words.length > 0) {
      account = await prismaService.prisma.account.findFirst({
        where: {
          OR: words.map(word => ({
            name: { contains: word, mode: 'insensitive' }
          }))
        },
        include: {
          valueChainNodes: true,
          opportunities: {
            include: {
              tradeIntelligence: {
                include: { bolRecords: true }
              }
            }
          }
        }
      });
      if (account) matchMethod = 'word match';
    }

    if (!account) {
      account = await prismaService.prisma.account.findFirst({
        where: {
          name: { contains: companyName.split(' ')[0], mode: 'insensitive' }
        },
        include: {
          valueChainNodes: true,
          opportunities: {
            include: {
              tradeIntelligence: {
                include: { bolRecords: true }
              }
            }
          }
        }
      });
      if (account) matchMethod = 'prefix match';
    }

    if (!account) {
      console.log(`[ProductRec] No Account found for company: "${companyName}"`);
      return { valueChain: [], bolRecords: [] };
    }

    console.log(`[ProductRec] Found Account: "${account.name}" (id: ${account.id}) via ${matchMethod}`);

    let valueChain = account.valueChainNodes || [];
    valueChain = valueChain.map((node: any) => {
      if (node.tier === 1 && !node.parentCompany) {
        return { ...node, parentCompany: account.name };
      }
      return node;
    });

    const bolRecords = account.opportunities
      .flatMap((opp: any) => opp.tradeIntelligence?.bolRecords || []) || [];

    console.log(`[ProductRec] ValueChain nodes: ${valueChain.length}, BOL records: ${bolRecords.length}`);

    return { valueChain, bolRecords };
  }

  private buildEnrichmentText(valueChain: any[], bolRecords: any[]): string {
    if (valueChain.length === 0 && bolRecords.length === 0) {
      console.log(`[ProductRec] No enrichment data available (empty ValueChain & BOL)`);
      return '';
    }

    const anchorNode = valueChain.find((n: any) => n.tier === 0);
    const suppliers = valueChain.filter((n: any) => n.clientType === 'Supplier');
    const distributors = valueChain.filter((n: any) => n.clientType.includes('Distributor'));
    const confirmedShipments = bolRecords.filter((b: any) => b.supplierConfirmed);
    const totalContainers = bolRecords.reduce((sum: number, b: any) => sum + (b.containerCount || 0), 0);
    const totalWeight = bolRecords.reduce((sum: number, b: any) => sum + (b.grossWeightKgs || 0), 0);
    const uniqueSuppliers = [...new Set(bolRecords.map((b: any) => b.supplier).filter(Boolean))];

    console.log(`[ProductRec] Enrichment parsed - Anchor: ${anchorNode ? 'YES' : 'NO'}, Suppliers: ${suppliers.length}, Distributors: ${distributors.length}, Shipments: ${bolRecords.length}, Confirmed: ${confirmedShipments.length}, Containers: ${totalContainers}, Weight: ${totalWeight}kg`);

    const parts: string[] = [];

    if (anchorNode) {
      parts.push('ANCHOR BUYER detected in value chain');
    }
    if (valueChain.length > 0) {
      parts.push(`Supply chain nodes: ${valueChain.length}`);
      if (suppliers.length > 0) parts.push(`Supplier nodes: ${suppliers.length}`);
      if (distributors.length > 0) parts.push(`Distributor nodes: ${distributors.length}`);
    }
    if (bolRecords.length > 0) {
      parts.push(`Total BOL shipments on record: ${bolRecords.length}`);
      if (confirmedShipments.length > 0) parts.push(`Verified shipments: ${confirmedShipments.length}`);
      if (totalContainers > 0) parts.push(`Total containers: ${totalContainers}`);
      if (totalWeight > 0) parts.push(`Total shipment weight: ${totalWeight.toLocaleString()} kg`);
      if (uniqueSuppliers.length > 0) parts.push(`Unique suppliers: ${uniqueSuppliers.slice(0, 5).join(', ')}`);
    }

    return parts.join('. ');
  }

  async getRecommendationsForCompany(
    company: string,
    parameters: string[] = ['LC', 'SCF']
  ): Promise<CompanyRecommendation> {
    const recommendations: ParameterRecommendation[] = [];

    for (const parameter of parameters) {
      const recommendation = await this.getParameterRecommendation(company, parameter);
      recommendations.push(recommendation);
    }

    const overallSummary = this.generateOverallSummary(recommendations);

    return {
      company,
      recommendations,
      overallSummary,
    };
  }

  async getParameterRecommendation(
    company: string,
    parameter: string
  ): Promise<ParameterRecommendation> {
    const signals = signalsData[parameter]?.signals || [];
    const signalsText = signals.length > 0 ? signals.join(' ') : 'trade finance import export';
    console.log(`[ProductRec] Signals for ${parameter}:`, signals);

    const { valueChain, bolRecords } = await this.getCompanyEnrichmentData(company);
    const enrichmentText = this.buildEnrichmentText(valueChain, bolRecords);

    let queryText = `${company} ${signalsText}`;
    if (enrichmentText) {
      queryText = `${queryText} ${enrichmentText}`;
      console.log(`[ProductRec] DB Enrichment TEXT: "${enrichmentText}"`);
    } else {
      console.log(`[ProductRec] No DB enrichment available`);
    }

    console.log(`[ProductRec] Full query text: "${queryText}"`);

    const chunks = await this.vectorDBService.queryWithSignals(
      company,
      queryText,
      COLLECTIONS,
      15
    );

    const features = await this.llmService.generateFeaturesFromChunks(chunks, parameter);

    const mlScore = await this.callMLService(company, parameter, features);

    const summary = await this.llmService.generateRecommendationSummary(
      company,
      parameter,
      features,
      chunks
    );

    return {
      parameter,
      recommended: mlScore.recommended,
      confidenceScore: mlScore.confidenceScore,
      features,
      summary,
    };
  }

  private async callMLService(
    company: string,
    parameter: string,
    features: FeatureScore[]
  ): Promise<{ recommended: boolean; confidenceScore: number }> {
    try {
      const featureMap: Record<string, number> = {};
      features.forEach(f => {
        featureMap[f.name] = f.score;
      });

      const response = await fetch(`${this.mlApiUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company,
          parameter,
          features: featureMap,
        }),
      });

      if (!response.ok) {
        throw new Error(`ML service error: ${response.status}`);
      }

      const result = await response.json();
      return {
        recommended: result.recommended,
        confidenceScore: result.confidenceScore,
      };
    } catch (error) {
      console.error('[ProductRec] ML service call failed:', error);
      throw new Error('ML service unavailable - no fallback. Ensure python ml/predict.py is running on localhost:8000');
    }
  }

  private generateOverallSummary(recommendations: ParameterRecommendation[]): string {
    const recommendedParams = recommendations.filter(r => r.recommended);
    if (recommendedParams.length === 0) {
      return `Based on our analysis, this company may not be a strong fit for our trade finance products at this time.`;
    }

    const productNames = recommendedParams.map(r =>
      r.parameter === 'LC' ? 'Letter of Credit' : 'Supply Chain Finance'
    ).join(' and ');

    const topScore = Math.max(...recommendedParams.map(r => r.confidenceScore));

    return `${productNames} are recommended with confidence scores of ${recommendedParams.map(r => (r.confidenceScore * 100).toFixed(0)).join('% and ')}%. The highest confidence is ${(topScore * 100).toFixed(0)}%.`;
  }
}

export const productRecommendationService = new ProductRecommendationService(
  {} as VectorDBService,
  {} as LLMService
);