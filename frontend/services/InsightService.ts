import { CloudClient } from 'chromadb';

export interface Signal {
  category: 'Supply Chain' | 'Cost Structure' | 'Revenue Drivers' | 'Risk Factors' | 'Financial Health';
  signal: string;
  confidence: 'High' | 'Medium' | 'Low';
  source: string;
}

export interface InsightResult {
  industryInsights: string[];
  clientInsights: string[];
  generatedAt: string;
  summaries?: InsightSummary[];
  sources?: string[];
}

export interface InsightSummary {
  text: string;
  source: string;
  recommendation: string;
  priority: 'High' | 'Medium' | 'Low';
}

const SIGNAL_CATEGORIES = ['Supply Chain', 'Cost Structure', 'Revenue Drivers', 'Risk Factors', 'Financial Health'] as const;

export class InsightService {
  private chromaHost: string;
  private chromaApiKey: string;
  private chromaTenant: string;
  private chromaDatabase: string;
  private collectionName: string;

  constructor() {
    this.chromaHost = process.env.CHROMA_HOST || 'api.trychroma.com';
    this.chromaApiKey = process.env.CHROMA_API_KEY || '';
    this.chromaTenant = process.env.CHROMA_TENANT || '';
    this.chromaDatabase = process.env.CHROMA_DATABASE || 'test';
    this.collectionName = 'scrawling-data';
  }

  private async getClient(): Promise<CloudClient> {
    return new CloudClient({
      apiKey: this.chromaApiKey,
      tenant: this.chromaTenant,
      database: this.chromaDatabase,
    });
  }

  private deriveAccountId(metadata?: Record<string, string>, collectionName?: string): string {
    if (metadata?.accountId) {
      return metadata.accountId;
    }
    if (metadata?.url) {
      const urlParts = metadata.url.split('/');
      if (urlParts.length >= 3) {
        const domain = urlParts[2];
        const domainSlug = domain.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9]/g, '');
        return `derived_${domainSlug}`;
      }
    }
    if (collectionName) {
      return `derived_${collectionName}`;
    }
    return 'unknown';
  }

  private async queryChromaDB(query: string, topK: number = 10, collectionName?: string): Promise<{ content: string; metadata?: Record<string, string>; accountId: string }[]> {
    const targetCollection = collectionName || this.collectionName;
    console.log(`[InsightService] Querying collection: ${targetCollection}, topK: ${topK}, query: "${query.substring(0, 50)}..."`);

    const client = await this.getClient();
    const collection = await client.getOrCreateCollection({
      name: targetCollection,
    });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OpenAI API key not configured');

    const embeddingRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query.slice(0, 8000),
      }),
    });

    if (!embeddingRes.ok) throw new Error('Failed to generate embedding');
    const embeddingData = await embeddingRes.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
      include: ['documents', 'metadatas'],
    });

    const chunks: { content: string; metadata?: Record<string, string>; accountId: string }[] = [];
    if (results.documents && results.documents[0]) {
      for (let i = 0; i < results.documents[0].length; i++) {
        const rawMeta = results.metadatas?.[0]?.[i];
        const docContent = results.documents[0][i] ?? '';
        const meta = typeof rawMeta === 'object' && rawMeta !== null ? rawMeta as Record<string, string> : undefined;
        const accountId = this.deriveAccountId(meta, targetCollection);
        chunks.push({
          content: docContent,
          metadata: meta,
          accountId,
        });
      }
    }

    console.log(`[InsightService] Collection ${targetCollection} returned ${chunks.length} chunks`);
    return chunks;
  }

  private async extractSignals(chunks: { content: string; metadata?: Record<string, string> }[]): Promise<Signal[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OpenAI API key not configured');

    const context = chunks.map((c, i) => `[${i + 1}] ${c.content}`).join('\n\n');

    const prompt = `You are a financial analyst. Extract business signals from the following documents about PT Japfa Comfeed Indonesia.

For each document, extract 0-3 relevant business signals.

Documents:
${context.slice(0, 6000)}

Extract signals in JSON format:
{
  "signals": [
    {
      "category": "Supply Chain|Cost Structure|Revenue Drivers|Risk Factors|Financial Health",
      "signal": "Brief factual statement (10-20 words)",
      "confidence": "High|Medium|Low",
      "source": "Brief source description"
    }
  ]
}

Return ONLY valid JSON.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a financial analyst specializing in Indonesian agribusiness.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) throw new Error('Failed to extract signals');
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.signals || [];
      }
    } catch {
      console.error('[InsightService] Failed to parse signal extraction response');
    }

    return [];
  }

  private async deriveInsightsFromSignals(signals: Signal[]): Promise<{ industryInsights: string[]; clientInsights: string[]; summaries: InsightSummary[]; sources: string[] }> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OpenAI API key not configured');

    const signalsText = signals.map(s =>
      `- [${s.category}] ${s.signal} (confidence: ${s.confidence}, source: ${s.source})`
    ).join('\n');

    const prompt = `You are a senior financial analyst at Bank BRI, specializing in Indonesian corporate banking.

Company: PT Japfa Comfeed Indonesia Tbk
Industry: Animal Feed & Poultry Production (Indonesia)

Extracted Signals from company data:
${signalsText}

Based on these signals, generate 4 industry insights and 4 client insights.

For EACH insight, provide:
- text: The insight statement (1-2 sentences)
- source: Where it came from (e.g., "US Customs 2025", "Japfa Annual Report 2025", "Industry News", "ChromaDB")
- recommendation: What BRI should offer/propose based on this insight (specific product/service)
- priority: High/Medium/Low based on revenue potential and urgency

Industry Insights should focus on:
- Broader market trends affecting JAPFA
- Sector-wide opportunities or risks
- Regulatory environment changes
- Competitive landscape

Client Insights should focus on:
- JAPFA-specific opportunities
- Company financial health and performance
- Specific product/service opportunities for BRI
- Risk factors specific to JAPFA

Return JSON format:
{
  "industryInsights": [
    {"text": "insight statement", "source": "source name", "recommendation": "what BRI should offer", "priority": "High/Medium/Low"}
  ],
  "clientInsights": [
    {"text": "insight statement", "source": "source name", "recommendation": "what BRI should offer", "priority": "High/Medium/Low"}
  ]
}

Return ONLY valid JSON.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a senior financial analyst at Bank BRI, specializing in Indonesian corporate banking.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) throw new Error('Failed to generate insights');
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        let industryInsights: InsightSummary[] = [];
        let clientInsights: InsightSummary[] = [];
        
        if (Array.isArray(parsed.industryInsights)) {
          industryInsights = parsed.industryInsights.map((i: any) => ({
            text: i.text || i,
            source: i.source || 'ChromaDB',
            recommendation: i.recommendation || '',
            priority: i.priority || 'Medium',
          }));
        }
        
        if (Array.isArray(parsed.clientInsights)) {
          clientInsights = parsed.clientInsights.map((i: any) => ({
            text: i.text || i,
            source: i.source || 'ChromaDB',
            recommendation: i.recommendation || '',
            priority: i.priority || 'Medium',
          }));
        }
        
        const sources = [
          ...new Set([
            ...industryInsights.map((i: InsightSummary) => i.source),
            ...clientInsights.map((i: InsightSummary) => i.source),
          ].filter(Boolean))
        ];
        
        return {
          industryInsights: industryInsights.map(i => i.text),
          clientInsights: clientInsights.map(i => i.text),
          summaries: [...industryInsights, ...clientInsights],
          sources,
        };
      }
    } catch {
      console.error('[InsightService] Failed to parse insight generation response');
    }

    return { industryInsights: [], clientInsights: [], summaries: [], sources: [] };
  }

  async generateInsights(accountId: string, companyName: string = 'PT Japfa Comfeed Indonesia'): Promise<InsightResult> {
    console.log('[InsightService] Starting insight generation for account:', accountId);

    const industryQuery = `${companyName} industry trends poultry feed Indonesia 2024 2025`;
    const clientQuery = `${companyName} financial performance business strategy`;
    const annualReportQuery = `${companyName} JapfaAnnualReport2025 annual report financial`;

    const [industryChunks, clientChunks, clientAnnualReportChunks] = await Promise.all([
      this.queryChromaDB(industryQuery, 8),
      this.queryChromaDB(clientQuery, 8),
      this.queryChromaDB(annualReportQuery, 5, 'JapfaAnnualReport2025'),
    ]);

    const allClientChunks = [...clientChunks, ...clientAnnualReportChunks];
    const allChunks = [...industryChunks, ...allClientChunks];
    console.log('[InsightService] Retrieved', allChunks.length, 'chunks from ChromaDB (industry:', industryChunks.length, ', client:', allClientChunks.length, '= scrawling-data:', clientChunks.length, ' + JapfaAnnualReport2025:', clientAnnualReportChunks.length, ')');

    const signals = await this.extractSignals(allChunks);
    console.log('[InsightService] Extracted', signals.length, 'signals');

    const { industryInsights, clientInsights, summaries, sources } = await this.deriveInsightsFromSignals(signals);
    console.log('[InsightService] Generated', industryInsights.length, 'industry insights,', clientInsights.length, 'client insights,', summaries?.length || 0, 'summaries');

    return {
      industryInsights,
      clientInsights,
      summaries,
      sources,
      generatedAt: new Date().toISOString(),
    };
  }
}

export const insightService = new InsightService();