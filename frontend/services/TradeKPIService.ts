import { prismaService } from './PrismaService';
import { vectorDBService } from './VectorDBService';
import { TradeKPIResult as TradeKPIResultType, SingleKPI, RMActionPlanResult } from '@/types';

interface RawMetrics {
  totalGrossWeightMT: number;
  totalShipmentValueUSD: number;
  shipmentCount: number;
  containerCount: number;
  swiftShipmentCount: number;
  swiftGrossWeightMT: number;
  customsCount: number;
  supplierShipments: Record<string, Date[]>;
  supplierContainerCount: Record<string, number>;
  supplierGrossWeightMT: Record<string, number>;
  shipmentDates: Date[];
  shipmentMonths: Record<number, number>;
  shipmentYears: Record<number, number>;
  customsDeclarationCount: number;
  currentYearContainers: number;
  currentYearShipments: number;
  currentYearShipmentMonths: Record<number, number>;
}

interface KPIDataSource {
  source: 'chroma' | 'db' | 'computed';
  chromaCollection?: 'scrawling-data' | 'JapfaAnnualReport2025';
  chromaQuery?: string;
}

export class TradeKPIService {
  private kpiDefinitions: Record<string, KPIDataSource> = {
    annualTradeValueUSD: { source: 'computed' },
    projectedVolumeMT: { source: 'computed' },
    avgShipmentFrequencyDays: { source: 'db' },
    visibleContainersCount: {
      source: 'chroma',
      chromaCollection: 'scrawling-data',
      chromaQuery: 'container shipments visible import export',
    },
    swiftTonnageYTD: { source: 'db' },
    allTimeCustomsCount: {
      source: 'chroma',
      chromaCollection: 'scrawling-data',
      chromaQuery: 'customs declaration shipments',
    },
    allTimeSwiftContainers: { source: 'db' },
    allTimeSwiftVolumeMT: { source: 'db' },
    avgGapBetweenShipments: { source: 'db' },
    shipmentsPerYear: { source: 'db' },
    swiftCadence: { source: 'computed' },
    supplierCadence: { source: 'db' },
    peakShipmentMonth: { source: 'db' },
  };

  async extractTradeKPIs(opportunityId: string): Promise<Array<{ opportunityId: string; name: string; value: number; unit: string; property: string }>> {
    console.log('[TradeKPI] Starting extraction for opportunity:', opportunityId);

    const rawMetrics = await this.computeBaseMetrics(opportunityId, {});
    console.log('[TradeKPI] Raw metrics computed');

    const kpis = this.computeKPIs(rawMetrics, {});

    const rows = this.transformKPIsToRows(opportunityId, kpis);

    try {
      await prismaService.prisma.tradeKPIResult.deleteMany({ where: { opportunityId } });
      await prismaService.prisma.tradeKPIResult.createMany({ data: rows as any });
      console.log('[TradeKPI] Saved', rows.length, 'rows to database');
    } catch (error) {
      console.error('[TradeKPI] Failed to save to database:', error);
    }

    return rows;
  }

  private transformKPIsToRows(
    opportunityId: string,
    kpis: Omit<TradeKPIResultType, 'explanations' | 'confidence' | 'sources' | 'computedAt'>
  ): Array<{ opportunityId: string; name: string; value: number; unit: string; property: string }> {
    const propertyMap: Record<string, string> = {
      annualTradeValueUSD: 'primaryStats',
      projectedVolumeMT: 'primaryStats',
      avgShipmentFrequencyDays: 'primaryStats',
      visibleContainersCount: 'primaryStats',
      allTimeCustomsCount: 'secondaryStats',
      avgGapBetweenShipments: 'secondaryStats',
      shipmentsPerYear: 'secondaryStats',
      peakShipmentMonth: 'other',
      swiftTonnageYTD: 'other',
      allTimeSwiftContainers: 'other',
      allTimeSwiftVolumeMT: 'other',
      swiftCadence: 'other',
      supplierCadence: 'other',
    };

    const rows: Array<{ opportunityId: string; name: string; value: number; unit: string; property: string }> = [];

    for (const [key, kpi] of Object.entries(kpis)) {
      if (key === 'supplierShipments') {
        rows.push({
          opportunityId,
          name: 'Supplier Shipment',
          value: kpi as any,
          unit: '-',
          property: 'other',
        });
      } else {
        const val = kpi as { name: string; value: number | string; unit: string };
        rows.push({
          opportunityId,
          name: val.name,
          value: typeof val.value === 'number' ? val.value as any : (parseFloat(String(val.value)) || 0) as any,
          unit: val.unit,
          property: propertyMap[key] || 'other',
        });
      }
    }

    return rows;
  }

  async getRawKPIs(opportunityId: string): Promise<Omit<TradeKPIResultType, 'explanations' | 'confidence' | 'sources' | 'computedAt'>> {
    const rawMetrics = await this.computeBaseMetrics(opportunityId, {});
    return this.computeKPIs(rawMetrics, {});
  }

  private async retrieveChromaKPIData(companyName: string): Promise<Record<string, string>> {
    const kpiData: Record<string, string> = {};

    const chromaKPIs = Object.entries(this.kpiDefinitions)
      .filter(([_, def]) => def.source === 'chroma')
      .map(([kpiName, def]) => ({ kpiName, def }));

    if (chromaKPIs.length === 0) return kpiData;

    const scrawlingKPIs = chromaKPIs.filter(k => k.def.chromaCollection === 'scrawling-data');
    const annualReportKPIs = chromaKPIs.filter(k => k.def.chromaCollection === 'JapfaAnnualReport2025');

    if (scrawlingKPIs.length > 0) {
      const scrawlingQuery = scrawlingKPIs.map(k => k.def.chromaQuery).join(' ');
      const chunks = await vectorDBService.queryByCollection(
        `${companyName} ${scrawlingQuery}`,
        'scrawling-data',
        5
      );
      const scrawlingContent = chunks.map(c => c.content).join('\n---\n');
      for (const kpi of scrawlingKPIs) {
        kpiData[kpi.kpiName] = scrawlingContent;
      }
      console.log(`[TradeKPI] scrawling-data: ${chunks.length} chunks for ${scrawlingKPIs.length} KPIs`);
    }

    if (annualReportKPIs.length > 0) {
      const annualReportQuery = annualReportKPIs.map(k => k.def.chromaQuery).join(' ');
      const chunks = await vectorDBService.queryByCollection(
        `${companyName} ${annualReportQuery}`,
        'JapfaAnnualReport2025',
        5
      );
      const annualReportContent = chunks.map(c => c.content).join('\n---\n');
      for (const kpi of annualReportKPIs) {
        kpiData[kpi.kpiName] = annualReportContent;
      }
      console.log(`[TradeKPI] JapfaAnnualReport2025: ${chunks.length} chunks for ${annualReportKPIs.length} KPIs`);
    }

    return kpiData;
  }

  private async computeBaseMetrics(opportunityId: string, chromaKPIData: Record<string, string>): Promise<RawMetrics> {
    const bolRecords = await prismaService.prisma.bOLRecord.findMany({
      where: {
        tradeIntelligence: {
          opportunityId,
        },
      },
      orderBy: { arrivalDate: 'desc' },
    });

    const shipmentDates: Date[] = [];
    const supplierShipments: Record<string, Date[]> = {};
    const supplierContainerCount: Record<string, number> = {};
    const supplierGrossWeightMT: Record<string, number> = {};
    const shipmentMonths: Record<number, number> = {};
    const shipmentYears: Record<number, number> = {};
    let totalGrossWeightMT = 0;
    let totalShipmentValueUSD = 0;
    let swiftShipmentCount = 0;
    let swiftGrossWeightMT = 0;
    let customsCount = 0;
    const containerIds = new Set<string>();
    const currentYear = new Date().getFullYear();
    let currentYearContainers = 0;
    let currentYearShipments = 0;
    const currentYearShipmentMonths: Record<number, number> = {};

    for (const record of bolRecords) {
      const arrivalDate = record.arrivalDate || record.shipmentDate;
      const shipDate = record.shipmentDate || record.arrivalDate;
      const year = record.shipmentYear || (arrivalDate ? arrivalDate.getFullYear() : currentYear);
      const month = record.shipmentMonth || (arrivalDate ? arrivalDate.getMonth() + 1 : 1);

      if (arrivalDate) {
        shipmentDates.push(arrivalDate);
        shipmentMonths[month] = (shipmentMonths[month] || 0) + 1;
        shipmentYears[year] = (shipmentYears[year] || 0) + 1;
      }

      if (record.supplier) {
        if (!supplierShipments[record.supplier]) {
          supplierShipments[record.supplier] = [];
          supplierContainerCount[record.supplier] = 0;
          supplierGrossWeightMT[record.supplier] = 0;
        }
        if (shipDate) {
          supplierShipments[record.supplier].push(shipDate);
        }
      }

      const weightMT = record.grossWeightKgs / 1000;
      totalGrossWeightMT += weightMT;

      if (record.supplier) {
        supplierGrossWeightMT[record.supplier] += weightMT;
      }

      if (record.shipmentValueEstimate) {
        totalShipmentValueUSD += record.shipmentValueEstimate;
      }

      if (record.containerId) {
        containerIds.add(record.containerId);
      }

      if (record.supplier && record.containerCount) {
        supplierContainerCount[record.supplier] = (supplierContainerCount[record.supplier] || 0) + record.containerCount;
      }

      if (record.paymentProxyFlag === 'swift') {
        swiftShipmentCount++;
        swiftGrossWeightMT += weightMT;
      }

      if (record.customsDeclarationId) {
        customsCount++;
      }

      if (year === currentYear) {
        currentYearContainers += record.containerCount || 0;
        currentYearShipments++;
        currentYearShipmentMonths[month] = (currentYearShipmentMonths[month] || 0) + 1;
      }
    }

    const { mergedShipments, mergedContainerCount, mergedWeight } = this.mergeSupplierMetrics(
      supplierShipments,
      supplierContainerCount,
      supplierGrossWeightMT
    );

    return {
      totalGrossWeightMT,
      totalShipmentValueUSD,
      shipmentCount: bolRecords.length,
      containerCount: containerIds.size,
      swiftShipmentCount,
      swiftGrossWeightMT,
      customsCount,
      supplierShipments: mergedShipments,
      supplierContainerCount: mergedContainerCount,
      supplierGrossWeightMT: mergedWeight,
      shipmentDates,
      shipmentMonths,
      shipmentYears,
      customsDeclarationCount: customsCount,
      currentYearContainers,
      currentYearShipments,
      currentYearShipmentMonths,
    };
  }

  private normalizeSupplierName(name: string): string {
    return name.toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  private findSimilarSuppliers(supplierNames: string[]): Record<string, string> {
    const normalizedToCanonical: Record<string, string> = {};
    const normalizedToOriginal: Record<string, string> = {};

    for (const name of supplierNames) {
      const normalized = this.normalizeSupplierName(name);
      if (!normalizedToCanonical[normalized]) {
        normalizedToCanonical[normalized] = normalized;
        normalizedToOriginal[normalized] = name;
      }
    }

    const nameFrequency: Record<string, number> = {};
    for (const name of supplierNames) {
      const normalized = this.normalizeSupplierName(name);
      nameFrequency[normalized] = (nameFrequency[normalized] || 0) + 1;
    }

    const canonicalMapping: Record<string, string> = {};
    for (const normalized of Object.keys(normalizedToCanonical)) {
      const frequency = nameFrequency[normalized] || 0;
      if (frequency > 1) {
        const relatedOriginals = supplierNames.filter(n => this.normalizeSupplierName(n) === normalized);
        const bestOriginal = relatedOriginals.reduce((a, b) =>
          nameFrequency[this.normalizeSupplierName(a)] > nameFrequency[this.normalizeSupplierName(b)] ? a : b
        );
        canonicalMapping[normalized] = this.normalizeSupplierName(bestOriginal);
      } else {
        canonicalMapping[normalized] = normalized;
      }
    }

    const result: Record<string, string> = {};
    for (const name of supplierNames) {
      const normalized = this.normalizeSupplierName(name);
      result[name] = normalizedToOriginal[canonicalMapping[normalized]] || name;
    }

    return result;
  }

  private mergeSupplierMetrics(
    supplierShipments: Record<string, Date[]>,
    supplierContainerCount: Record<string, number>,
    supplierGrossWeightMT: Record<string, number>
  ): { mergedShipments: Record<string, Date[]>; mergedContainerCount: Record<string, number>; mergedWeight: Record<string, number> } {
    const allSuppliers = Object.keys(supplierShipments);
    const mapping = this.findSimilarSuppliers(allSuppliers);

    const mergedShipments: Record<string, Date[]> = {};
    const mergedContainerCount: Record<string, number> = {};
    const mergedWeight: Record<string, number> = {};

    for (const [original, canonical] of Object.entries(mapping)) {
      if (!mergedShipments[canonical]) {
        mergedShipments[canonical] = [];
        mergedContainerCount[canonical] = 0;
        mergedWeight[canonical] = 0;
      }
      mergedShipments[canonical].push(...(supplierShipments[original] || []));
      mergedContainerCount[canonical] += supplierContainerCount[original] || 0;
      mergedWeight[canonical] += supplierGrossWeightMT[original] || 0;
    }

    return { mergedShipments, mergedContainerCount, mergedWeight };
  }

  private async getCompanyName(opportunityId: string): Promise<string> {
    const tradeIntel = await prismaService.prisma.tradeIntelligence.findFirst({
      where: { opportunityId },
      include: { opportunity: { include: { account: { include: { company: true } } } } },
    });
    return tradeIntel?.opportunity?.account?.company?.companyName || 'Unknown';
  }

  private async generateExplanations(
    metrics: RawMetrics,
    chromaKPIData: Record<string, string>
  ): Promise<string[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return this.getMockExplanations(metrics);
    }

const metricsSummary = `
KPI Parameters to Explain:
1. Annual Trade Value (USD) - source: BOL DB (estimated from shipmentValueEstimate)
2. Projected Full-Year Volume (MT) - source: computed from BOL
3. Average Shipment Frequency (days) - source: BOL DB
4. Visible Containers (count) - source: ChromaDB (scrawling-data)
5. Swift Tonnage YTD (MT) - source: BOL DB (supplier Swift)
6. All-Time Customs Count (shipments) - source: ChromaDB (scrawling-data)
7. All-Time Swift Containers (count) - source: BOL DB
8. All-Time Swift Volume (MT) - source: BOL DB
9. Average Gap Between Shipments (days) - source: BOL DB
10. Shipments per Year (count) - source: BOL DB
11. Swift Cadence (days) - source: computed
12. Supplier Cadence (days) - source: BOL DB
13. Peak Shipment Month (month number) - source: BOL DB

BOL Metrics Summary:
- Total Shipments: ${metrics.shipmentCount}
- Total Volume: ${metrics.totalGrossWeightMT.toFixed(2)} MT
- Total Trade Value: $${metrics.totalShipmentValueUSD.toFixed(2)}
- Swift Shipments: ${metrics.swiftShipmentCount}
- Swift Volume: ${metrics.swiftGrossWeightMT.toFixed(2)} MT
- Customs Declarations: ${metrics.customsCount}
- Active Suppliers: ${Object.keys(metrics.supplierShipments).length}
- Container Count: ${metrics.containerCount}
    `.trim();

    const chromaContext = Object.entries(chromaKPIData)
      .map(([kpi, data]) => `[${kpi}]: ${data.slice(0, 500)}`)
      .join('\n\n');

    const prompt = `Based on the following trade metrics and ChromaDB data for PT Japfa Comfeed Indonesia, generate brief explanations for each KPI parameter.

${metricsSummary}

${chromaContext ? `ChromaDB Retrieved Data:\n${chromaContext}\n` : ''}

Generate 13 brief explanations (1-2 sentences each) for the 13 KPIs listed above.
Each explanation should reference relevant data from both BOL metrics and ChromaDB context where applicable.

Return JSON array of strings:
["explanation 1", "explanation 2", ...]

Only return valid JSON array.`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a trade finance analyst specializing in Indonesian commodities.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.5,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) throw new Error('LLM call failed');
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (err) {
      console.error('[TradeKPI] LLM explanation failed:', err);
    }

    return this.getMockExplanations(metrics);
  }

  private getMockExplanations(metrics: RawMetrics): string[] {
    return [
      `Annual trade value estimated at $${metrics.totalShipmentValueUSD.toFixed(2)} based on ${metrics.shipmentCount} shipments recorded.`,
      `Projected full-year volume of ${metrics.totalGrossWeightMT.toFixed(2)} MT based on current shipment pace.`,
      `Average shipment frequency calculated from ${metrics.shipmentCount} recorded shipments over the observation period.`,
      `${metrics.containerCount} unique containers identified in the current shipment records.`,
      `Swift tonnage YTD totals ${metrics.swiftGrossWeightMT.toFixed(2)} MT from ${metrics.swiftShipmentCount} SWIFT-tagged shipments.`,
      `${metrics.customsCount} customs declarations recorded across all shipments.`,
      `${metrics.containerCount} containers confirmed through SWIFT payment records.`,
      `Total SWIFT volume of ${metrics.swiftGrossWeightMT.toFixed(2)} MT confirmed through payment proxy records.`,
      `Average gap between shipments calculated from ${metrics.shipmentDates.length} shipment records.`,
      `Shipments distributed across ${Object.keys(metrics.shipmentYears).length} years of records.`,
      `SWIFT cadence calculated from ${metrics.swiftShipmentCount} SWIFT shipments.`,
      `Supplier cadence calculated for ${Object.keys(metrics.supplierShipments).length} active suppliers.`,
      `Peak shipment month identified from shipment distribution analysis.`,
    ];
  }

  private computeKPIs(metrics: RawMetrics, chromaKPIData: Record<string, string>): Omit<TradeKPIResultType, 'explanations' | 'confidence' | 'sources' | 'computedAt'> {
    const now = new Date();
    const currentYear = now.getFullYear();

    const monthsObserved = this.calculateMonthsObserved(metrics.shipmentDates);
    const projectedVolumeMT = monthsObserved > 0
      ? (metrics.totalGrossWeightMT / monthsObserved) * 12
      : metrics.totalGrossWeightMT;

    const daysBetweenShipments = this.calculateAvgGap(metrics.shipmentDates);
    const avgGap = daysBetweenShipments > 0 ? Math.round(daysBetweenShipments) : 0;

    const currentYearShipments = metrics.shipmentYears[currentYear] || 0;
    const swiftCadence = metrics.swiftShipmentCount > 0
      ? Math.round((metrics.shipmentDates.length / metrics.swiftShipmentCount) * avgGap) || 0
      : 0;

    const supplierCadences = this.calculateSupplierCadences(metrics.supplierShipments);
    const avgSupplierCadence = Object.values(supplierCadences).length > 0
      ? Math.round(Object.values(supplierCadences).reduce((a, b) => a + b, 0) / Object.values(supplierCadences).length)
      : 0;
    const peakMonthNum = this.findPeakMonthNum(metrics.currentYearShipmentMonths);

    const estimatedUnitPriceUSD = 600;
    const annualTradeValue = projectedVolumeMT * estimatedUnitPriceUSD;

    const supplierKPIList = Object.entries(metrics.supplierShipments).map(([name, dates]) => {
      const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
      let avgFrequency = 0;
      if (sortedDates.length >= 2) {
        let totalGap = 0;
        for (let i = 1; i < sortedDates.length; i++) {
          totalGap += (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
        }
        avgFrequency = Math.round(totalGap / (sortedDates.length - 1));
      }
      return {
        supplierName: name,
        details: {
          shipment: dates.length,
          container: metrics.supplierContainerCount[name] || 0,
          avgGapBetweenShipment: avgFrequency,
        },
      };
    }).sort((a, b) => b.details.container - a.details.container);

    return {
      annualTradeValueUSD: { name: 'Annual Trade Value (USD)', value: parseFloat((annualTradeValue / 1000000).toFixed(1)), unit: 'M USD' },
      projectedVolumeMT: { name: 'Projected Full-Year Volume', value: Math.round(projectedVolumeMT), unit: 'MT' },
      avgShipmentFrequencyDays: { name: 'Avg Shipment Frequency', value: avgGap, unit: 'days' },
      visibleContainersCount: { name: 'Visible Containers', value: metrics.currentYearContainers, unit: 'containers' },
      swiftTonnageYTD: { name: 'Swift Tonnage YTD', value: Math.round(metrics.swiftGrossWeightMT), unit: 'MT' },
      allTimeCustomsCount: { name: 'All-Time Customs Shipments', value: metrics.currentYearShipments, unit: 'shipments' },
      allTimeSwiftContainers: { name: 'All-Time Swift Containers', value: metrics.containerCount, unit: 'containers' },
      allTimeSwiftVolumeMT: { name: 'All-Time Swift Volume', value: Math.round(metrics.swiftGrossWeightMT), unit: 'MT' },
      avgGapBetweenShipments: { name: 'Avg Gap Between Shipments', value: avgGap, unit: 'days' },
      shipmentsPerYear: { name: 'Shipments This Year', value: currentYearShipments, unit: 'shipments' },
      swiftCadence: { name: 'Swift Cadence', value: swiftCadence, unit: 'days' },
      supplierCadence: { name: 'Supplier Cadence', value: avgSupplierCadence, unit: 'days' },
      peakShipmentMonth: { name: 'Peak Shipment Month', value: peakMonthNum, unit: 'month' },
      supplierShipments: supplierKPIList,
    };
  }

  private calculateMonthsObserved(dates: Date[]): number {
    if (dates.length < 2) return 1;
    const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const months = (last.getFullYear() - first.getFullYear()) * 12 + (last.getMonth() - first.getMonth());
    return Math.max(1, months);
  }

  private calculateAvgGap(dates: Date[]): number {
    if (dates.length < 2) return 0;
    const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
    let totalGap = 0;
    for (let i = 1; i < sorted.length; i++) {
      totalGap += (sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60 * 60 * 24);
    }
    return totalGap / (sorted.length - 1);
  }

  private calculateSupplierCadences(supplierShipments: Record<string, Date[]>): Record<string, number> {
    const cadences: Record<string, number> = {};
    for (const [supplier, dates] of Object.entries(supplierShipments)) {
      if (dates.length >= 2) {
        const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
        let totalGap = 0;
        for (let i = 1; i < sorted.length; i++) {
          totalGap += (sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60 * 60 * 24);
        }
        cadences[supplier] = Math.round(totalGap / (sorted.length - 1));
      } else {
        cadences[supplier] = 0;
      }
    }
    return cadences;
  }

  private findPeakMonthNum(monthCounts: Record<number, number>): number {
    let maxCount = 0;
    let peakMonth = 1;
    for (const [month, count] of Object.entries(monthCounts)) {
      if (count > maxCount) {
        maxCount = count;
        peakMonth = parseInt(month);
      }
    }
    return peakMonth;
  }

  private computeConfidence(metrics: RawMetrics): Record<string, 'High' | 'Medium' | 'Low'> {
    const baseConfidence = metrics.shipmentCount > 20 ? 'High' : metrics.shipmentCount > 5 ? 'Medium' : 'Low';
    return {
      annualTradeValueUSD: baseConfidence,
      projectedVolumeMT: baseConfidence,
      avgShipmentFrequencyDays: baseConfidence,
      visibleContainersCount: baseConfidence,
      swiftTonnageYTD: baseConfidence,
      allTimeCustomsCount: baseConfidence,
      allTimeSwiftContainers: baseConfidence,
      allTimeSwiftVolumeMT: baseConfidence,
      avgGapBetweenShipments: baseConfidence,
      shipmentsPerYear: baseConfidence,
      swiftCadence: baseConfidence,
      supplierCadence: baseConfidence,
      peakShipmentMonth: baseConfidence,
    };
  }

  private async getSourceIds(opportunityId: string): Promise<string[]> {
    const bolRecords = await prismaService.prisma.bOLRecord.findMany({
      where: {
        tradeIntelligence: { opportunityId },
      },
      select: { id: true },
    });
    return bolRecords.map((r: { id: string }) => r.id);
  }

  async generateRMActionPlan(opportunityId: string, companyName: string): Promise<RMActionPlanResult> {
    console.log('[TradeKPI] Generating RM Action Plan for opportunity:', opportunityId);

    const cache = await prismaService.prisma.rMActionPlanCache.findUnique({
      where: { opportunityId },
    });

    if (cache && cache.expiresAt > new Date()) {
      console.log('[TradeKPI] Cache hit for opportunity:', opportunityId);
      return {
        ...(cache.result as unknown as RMActionPlanResult),
        cached: true,
      };
    }

    const kpis = await this.getRawKPIs(opportunityId);
    const bolRecords = await prismaService.prisma.bOLRecord.findMany({
      where: {
        tradeIntelligence: { opportunityId },
      },
      orderBy: { arrivalDate: 'desc' },
    });

    const lastDate = bolRecords[0]?.arrivalDate || new Date();
    const nextWindowStart = new Date(lastDate.getTime() + (kpis.avgShipmentFrequencyDays?.value as number || 9) * 24 * 60 * 60 * 1000);
    const nextWindowEnd = new Date(nextWindowStart.getTime() + 8 * 24 * 60 * 60 * 1000);

    const prompt = `You are a senior relationship manager (RM) at Bank BRI specializing in Indonesian corporate banking for commodities trade.

Company: ${companyName}
Industry: Animal Feed & Poultry Production (Indonesia)

Trade Intelligence Data:
- Avg Shipment Frequency: ${kpis.avgShipmentFrequencyDays?.value} days
- Last Shipment Date: ${lastDate.toISOString().split('T')[0]}
- Estimated Next Window: ${nextWindowStart.toISOString().split('T')[0]} to ${nextWindowEnd.toISOString().split('T')[0]}
- Total Shipments Visible: ${kpis.visibleContainersCount?.value} containers
- Swift Tonnage YTD: ${kpis.swiftTonnageYTD?.value} MT
- Supplier Cadence: ${JSON.stringify(kpis.supplierCadence?.value)}
- Peak Shipment Month: ${kpis.peakShipmentMonth?.value}
- Annual Trade Value: $${kpis.annualTradeValueUSD?.value}

Generate a structured RM Action Plan with 5 sections:

Section 1 - Timeline (Step by Step):
Create 6 steps: 1) Intelligence Call, 2) Prepare Documentation, 3) Meeting Day, 4) Propose SCF/LC, 5) Penulisan Proposal, 6) Follow-up
Each step should have: step number, action, details, and timeline (e.g., "Today", "1-2 days", "Day 3", etc.)

Section 2 - What to Bring:
List 5 items RM should bring to the meeting (BoL Summary, Shipping Forecast, XAI Scoring, etc.)

Section 3 - Deck Decision:
Provide recommendation (Approve/Review Further/Reject), 3 key factors, and 2 risk indicators

Section 4 - Opening Script (Indonesian):
Write a 2-3 sentence opening script in Indonesian for RM to use when meeting with Japfa treasury

Section 5 - Do's and Don'ts:
List 4-5 DO's and 4-5 DON'Ts for the meeting

Return ONLY valid JSON:
{
  "section1Timeline": [
    {"step": 1, "action": "...", "details": "...", "timeline": "..."},
    ...
  ],
  "section2WhatToBring": ["item1", "item2", ...],
  "section3DeckDecision": {
    "recommendation": "Approve",
    "keyFactors": ["factor1", "factor2", "factor3"],
    "riskIndicators": ["risk1", "risk2"]
  },
  "section4OpeningScript": "Indonesian script...",
  "section5DosAndDonts": {
    "do": ["do1", "do2", ...],
    "dont": ["dont1", "dont2", ...]
  }
}`;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a senior trade finance RM specialist at Bank BRI.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.5,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error('LLM call failed');
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse LLM response');
      }

      const result = JSON.parse(jsonMatch[0]) as RMActionPlanResult;
      result.generatedAt = new Date().toISOString();
      result.cached = false;

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await prismaService.prisma.rMActionPlanCache.upsert({
        where: { opportunityId },
        create: {
          opportunityId,
          result: JSON.parse(JSON.stringify(result)),
          expiresAt,
        },
        update: {
          result: JSON.parse(JSON.stringify(result)),
          generatedAt: new Date(),
          expiresAt,
        },
      });

      console.log('[TradeKPI] RM Action Plan generated and cached for opportunity:', opportunityId);
      return result;
    } catch (error) {
      console.error('[TradeKPI] Failed to generate RM Action Plan:', error);
      throw error;
    }
  }
}

export const tradeKPIService = new TradeKPIService();