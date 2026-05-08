import * as fs from 'fs';
import * as path from 'path';
import { CloudClient } from 'chromadb';

interface ProductParameter {
  id: string;
  name: string;
  description: string;
  embedding?: number[];
}

interface CrawlEmbeddingResult {
  id: string;
  content: string;
  distance: number;
  metadata?: Record<string, string>;
}

export interface ProductSignal {
  productId: string;
  productName: string;
  signals: string[];
  summary: string;
  confidence: 'high' | 'medium' | 'low';
  rawEvidenceCount: number;
}

export interface EvidenceSet {
  productId: string;
  productName: string;
  evidence: CrawlEmbeddingResult[];
}

export interface SignalExtractionResult {
  companyId: string;
  locale: string;
  productSignals: ProductSignal[];
  timestamp: string;
}

type EnvironmentDetails = Record<string, ProductParameter>;

const CRAWL_COLLECTION = 'scrawling-data';

async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key not configured');

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${errorText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function getChromaClient(): Promise<CloudClient> {
  return new CloudClient({
    apiKey: process.env.CHROMA_API_KEY,
    tenant: process.env.CHROMA_TENANT,
    database: process.env.CHROMA_DATABASE,
  });
}

function parseCorporateProductParameters(content: string): EnvironmentDetails {
  const result: EnvironmentDetails = {};
  const sections = content.split(/^---$/m);

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    const lines = trimmed.split('\n');
    let currentProduct: ProductParameter | null = null;

    for (const line of lines) {
      const headerMatch = line.match(/^##\s+(\d+)\.\s+(.+)$/);
      if (headerMatch) {
        const id = headerMatch[1].trim();
        const name = headerMatch[2].trim();
        currentProduct = { id, name, description: '' };
        continue;
      }

      if (currentProduct && line.startsWith('#')) continue;

      if (currentProduct && line.trim() && !line.startsWith('#')) {
        currentProduct.description += (currentProduct.description ? ' ' : '') + line.trim();
      }
    }

    if (currentProduct && currentProduct.id) {
      result[currentProduct.id] = currentProduct;
    }
  }

  return result;
}

export function parseCorporateProductParametersFromFile(
  filePath: string
): EnvironmentDetails {
  const content = fs.readFileSync(filePath, 'utf-8');
  return parseCorporateProductParameters(content);
}

export function getCorporateProductParametersDir(): string {
  return path.join(process.cwd(), 'app', 'doc');
}

export function getCorporateProductParametersFilePath(locale: string = 'EN'): string {
  return path.join(
    process.cwd(),
    'app',
    'doc',
    `Corporate_Product_Parameters_${locale}.md`
  );
}

export function parseCorporateProductParametersByLocale(locale: string = 'EN'): EnvironmentDetails {
  const filePath = getCorporateProductParametersFilePath(locale);
  return parseCorporateProductParametersFromFile(filePath);
}

export async function embedProductParameters(
  locale: string = 'EN'
): Promise<EnvironmentDetails> {
  const products = parseCorporateProductParametersByLocale(locale);
  const embeddedProducts: EnvironmentDetails = {};

  for (const [id, product] of Object.entries(products)) {
    const textToEmbed = `${product.name}. ${product.description}`;
    const embedding = await generateEmbedding(textToEmbed);

    embeddedProducts[id] = {
      ...product,
      embedding,
    };
  }

  return embeddedProducts;
}

export async function retrieveByProductParameters(
  companyIdOrCode: string,
  locale: string = 'EN',
  topK: number = 5
): Promise<EvidenceSet[]> {
  const embeddedProducts = await embedProductParameters(locale);
  const client = await getChromaClient();
  const collection = await client.getOrCreateCollection({
    name: CRAWL_COLLECTION,
  });

  const evidenceSets: EvidenceSet[] = [];

  for (const [productId, product] of Object.entries(embeddedProducts)) {
    if (!product.embedding) continue;

    const crawlResults = await collection.query({
      queryEmbeddings: [product.embedding],
      nResults: topK,
      where: { companyId: companyIdOrCode },
      include: ['documents', 'distances', 'metadatas'],
    });

    const evidence: CrawlEmbeddingResult[] = [];
    if (crawlResults.ids && crawlResults.ids.length > 0) {
      for (let i = 0; i < crawlResults.ids[0].length; i++) {
        evidence.push({
          id: crawlResults.ids[0][i],
          content: crawlResults.documents?.[0][i] || '',
          distance: crawlResults.distances?.[0][i] || 0,
          metadata: crawlResults.metadatas?.[0][i] as Record<string, string>,
        });
      }
    }

    evidenceSets.push({
      productId,
      productName: product.name,
      evidence,
    });
  }

  return evidenceSets;
}

export async function extractSignalsFromEvidence(
  evidenceSets: EvidenceSet[],
  companyId: string = 'unknown',
  locale: string = 'EN'
): Promise<SignalExtractionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key not configured');

  const productSignals: ProductSignal[] = [];

  for (const evidenceSet of evidenceSets) {
    const textEvidence = evidenceSet.evidence.filter(e => {
      const content = e.content || '';
      return !content.match(/\.(png|jpg|jpeg|gif|webp|bmp|svg|image)/i);
    });

    if (textEvidence.length === 0) {
      productSignals.push({
        productId: evidenceSet.productId,
        productName: evidenceSet.productName,
        signals: [],
        summary: 'No text-based evidence found for this product (evidence may be images)',
        confidence: 'low',
        rawEvidenceCount: evidenceSet.evidence.length,
      });
      continue;
    }

    const evidenceText = textEvidence
      .map((e, i) => `[Evidence ${i + 1}]\n${e.content}`)
      .join('\n\n');

    const prompt = `Analyze the following evidence chunks from company documents and extract signals for "${evidenceSet.productName}" product.

Product Definition:
${evidenceSet.productName}

Evidence Chunks:
${evidenceText}

Task:
1. Identify key signals from the evidence that indicate alignment or misalignment with the product
2. Determine confidence level (high/medium/low) based on evidence quality and quantity
3. Provide a summary of findings

Output format - respond with ONLY this exact format (no JSON, no code blocks):

[SIGNALS]
- Signal 1: description
- Signal 2: description
- Signal 3: description
[/SIGNALS]

[SUMMARY]
2-3 sentence summary of findings
[/SUMMARY]

[CONFIDENCE]
high/medium/low
[/CONFIDENCE]`;

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
            {
              role: 'system',
              content: 'You are a financial signal extraction assistant. Always respond with the exact format specified.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${errorText}`);
      }

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content || '';

      const signalsMatch = rawContent.match(/\[SIGNALS\]([\s\S]*?)\[\/SIGNALS\]/);
      const summaryMatch = rawContent.match(/\[SUMMARY\]([\s\S]*?)\[\/SUMMARY\]/);
      const confidenceMatch = rawContent.match(/\[CONFIDENCE\]([\s\S]*?)\[\/CONFIDENCE\]/);

      const signals: string[] = [];
      if (signalsMatch) {
        signalsMatch[1].split('\n').forEach((line: string) => {
          const cleaned = line.replace(/^-\s*/, '').replace(/^Signal \d+:\s*/, '').trim();
          if (cleaned) signals.push(cleaned);
        });
      }

      const confidence = (confidenceMatch?.[1]?.trim().toLowerCase() as 'high' | 'medium' | 'low') || 'low';

      productSignals.push({
        productId: evidenceSet.productId,
        productName: evidenceSet.productName,
        signals,
        summary: summaryMatch?.[1]?.trim() || 'No summary available',
        confidence,
        rawEvidenceCount: evidenceSet.evidence.length,
      });
    } catch (err) {
      productSignals.push({
        productId: evidenceSet.productId,
        productName: evidenceSet.productName,
        signals: [],
        summary: `Error extracting signals: ${err instanceof Error ? err.message : 'Unknown error'}`,
        confidence: 'low',
        rawEvidenceCount: evidenceSet.evidence.length,
      });
    }
  }

  return {
    companyId,
    locale,
    productSignals,
    timestamp: new Date().toISOString(),
  };
}

export async function retrieveAndExtractSignals(
  companyIdOrCode: string,
  locale: string = 'EN',
  topK: number = 5
): Promise<SignalExtractionResult> {
  const evidenceSets = await retrieveByProductParameters(companyIdOrCode, locale, topK);
  return extractSignalsFromEvidence(evidenceSets, companyIdOrCode, locale);
}

export type { ProductParameter, EnvironmentDetails, CrawlEmbeddingResult };
