const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export interface FeatureScore {
  name: string;
  score: number;
  evidence?: string;
}

export interface CleanResult {
  originalLength: number;
  cleanedLength: number;
  summary: string;
  keyPoints: string[];
  cleanedContent: string;
  sections: Record<string, string>;
  error?: string;
}

export class LLMService {
  private apiKey: string | undefined;
  private apiUrl: string;

  constructor(apiKey?: string, apiUrl?: string) {
    this.apiKey = apiKey || OPENAI_API_KEY;
    this.apiUrl = apiUrl || OPENAI_API_URL;
  }

  private splitByHeaders(content: string): { key: string; value: string }[] {
    console.log(`[LLM] splitByHeaders: input length = ${content.length}`);
    const startTime = Date.now();

    const sectionPattern = /##\s*(.+)$/gm;
    const matches = [...content.matchAll(sectionPattern)];

    console.log(`[LLM] splitByHeaders: found ${matches.length} section headers`);

    if (matches.length === 0) {
      console.log(`[LLM] splitByHeaders: no headers found, returning single section`);
      return [{ key: '_content', value: content }];
    }

    const sections: { key: string; value: string }[] = [];

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const key = (match[1] || '').trim();
      const matchStart = match.index!;
      const matchEnd = matchStart + match[0].length;

      if (i === 0 && matchStart > 0) {
        const preamble = content.slice(0, matchStart).trim();
        if (preamble) {
          console.log(`[LLM] splitByHeaders: adding preamble (${preamble.length} chars)`);
          sections.push({ key: '_preamble', value: preamble });
        }
      } else if (i > 0) {
        const prevMatchEnd = matches[i - 1].index! + matches[i - 1][0].length;
        const betweenContent = content.slice(prevMatchEnd, matchStart).trim();
        if (betweenContent) {
          const prevKey = (matches[i - 1][1] || '').trim();
          console.log(`[LLM] splitByHeaders: adding content between "${prevKey}" and "${key}" (${betweenContent.length} chars)`);
        }
      }

      const nextMatchStart = i < matches.length - 1 ? matches[i + 1].index! : content.length;
      const sectionValue = content.slice(matchEnd, nextMatchStart).trim();

      if (key && sectionValue) {
        console.log(`[LLM] splitByHeaders: section "${key}" = ${sectionValue.length} chars`);
        sections.push({ key, value: sectionValue });
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`[LLM] splitByHeaders: completed in ${elapsed}ms, ${sections.length} sections created`);

    return sections;
  }

  private cleanTableRows(content: string): string {
    const lines = content.split('\n');
    const cleanedLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('|')) {
        const cells = trimmed.split('|').map(c => c.trim());
        const nonEmptyCells = cells.filter(c => c !== '' && c !== '---');

        if (nonEmptyCells.length === 0) {
          console.log(`[LLM] cleanTableRows: removing empty row: "${trimmed.slice(0, 50)}..."`);
          continue;
        }

        const onlyPipes = cells.filter(c => c === '' || c === '---');
        if (onlyPipes.length === cells.length) {
          console.log(`[LLM] cleanTableRows: removing separator row: "${trimmed.slice(0, 50)}..."`);
          continue;
        }
      }

      cleanedLines.push(line);
    }

    return cleanedLines.join('\n');
  }

  private async cleanSection(section: { key: string; value: string }): Promise<{ key: string; cleanedValue: string }> {
    console.log(`[LLM]   Processing section: "${section.key}" (${section.value.length} chars)`);

    if (section.value.length < 100) {
      console.log(`[LLM]   Skipping "${section.key}" - too short`);
      return { key: section.key, cleanedValue: this.cleanTableRows(section.value) };
    }

    if (!this.apiKey) {
      console.log(`[LLM]   Skipping "${section.key}" - no API key`);
      return { key: section.key, cleanedValue: this.cleanTableRows(section.value.slice(0, 1000)) };
    }

    console.log(`[LLM]   Calling LLM for section: "${section.key}"`);

    const prompt = `Clean this content. Remove navigation, footers, ads, repeated content, HTML artifacts. Preserve markdown tables (| ... |).

[CLEANED]
${section.value.slice(0, 3000)}
[/CLEANED]`;

    try {
      const startTime = Date.now();
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a content cleansing assistant. Preserve all markdown tables.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0,
          max_tokens: 1500,
        }),
      });

      const elapsed = Date.now() - startTime;
      console.log(`[LLM]   LLM response for "${section.key}" in ${elapsed}ms`);

      if (!response.ok) {
        console.log(`[LLM]   Error response for "${section.key}" - keeping original`);
        return { key: section.key, cleanedValue: this.cleanTableRows(section.value) };
      }

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content || '';
      const cleanedMatch = rawContent.match(/\[CLEANED\]([\s\S]*?)\[\/CLEANED\]/);

      let cleanedValue = cleanedMatch ? cleanedMatch[1].trim() : section.value;
      cleanedValue = this.cleanTableRows(cleanedValue);

      console.log(`[LLM]   Completed "${section.key}" - cleaned to ${cleanedValue.length} chars`);

      return { key: section.key, cleanedValue };
    } catch (err) {
      console.log(`[LLM]   Exception for "${section.key}": ${err}`);
      return { key: section.key, cleanedValue: this.cleanTableRows(section.value) };
    }
  }

  async cleanContent(content: string, url?: string): Promise<CleanResult> {
    console.log(`\n[LLM] ═══════════════════════════════════════════`);
    console.log(`[LLM] Starting content cleansing`);
    console.log(`[LLM] Input length: ${content.length} chars`);
    if (url) console.log(`[LLM] Source URL: ${url}`);

    if (!this.apiKey) {
      console.warn('[LLM] API key not configured');
      return this.getMockCleanResult(content);
    }

    const sections = this.splitByHeaders(content);
    console.log(`[LLM] Split into ${sections.length} sections`);
    console.log(`[LLM] Section keys: [${sections.map(s => s.key).join(', ')}]`);
    console.log(`[LLM] Processing all sections in parallel...\n`);

    const cleanedSectionPromises = sections.map(section => this.cleanSection(section));
    const cleanedResults = await Promise.all(cleanedSectionPromises);

    const cleanedSections: Record<string, string> = {};
    for (const result of cleanedResults) {
      cleanedSections[result.key] = result.cleanedValue;
    }

    const combinedCleaned = Object.entries(cleanedSections)
      .map(([key, value]) => (key === '_preamble' || key === '_footer') ? value : `## ${key}\n${value}`)
      .filter(v => v.length > 0)
      .join('\n\n');

    const sectionKeys = sections.map(s => s.key).filter(k => k !== '_preamble' && k !== '_footer');
    const summary = sectionKeys.length > 0
      ? `Document contains ${sectionKeys.length} sections: ${sectionKeys.slice(0, 5).join(', ')}${sectionKeys.length > 5 ? '...' : ''}`
      : 'Content processed successfully';

    const result: CleanResult = {
      originalLength: content.length,
      cleanedLength: combinedCleaned.length,
      summary,
      keyPoints: [],
      cleanedContent: combinedCleaned,
      sections: cleanedSections,
    };

    console.log(`[LLM] Clean complete`);
    console.log(`[LLM] Output: ${combinedCleaned.length} chars, ${Object.keys(cleanedSections).length} sections`);
    console.log(`[LLM] ═══════════════════════════════════════════\n`);

    return result;
  }

  private getMockCleanResult(content: string): CleanResult {
    const sections = this.splitByHeaders(content);
    return {
      originalLength: content.length,
      cleanedLength: Math.floor(content.length * 0.6),
      summary: 'Mock summary - LLM not configured',
      keyPoints: [],
      cleanedContent: content.slice(0, 500),
      sections: {},
    };
  }

  async cleanContents(contents: { content: string; url?: string }[]): Promise<CleanResult[]> {
    const results: CleanResult[] = [];

    console.log(`[LLM] ═══════════════════════════════════════════`);
    console.log(`[LLM] Starting batch cleanse of ${contents.length} contents`);
    console.log(`[LLM] ═══════════════════════════════════════════\n`);

    for (let i = 0; i < contents.length; i++) {
      const item = contents[i];
      const trimmedContent = item.content?.trim() || '';

      console.log(`[LLM] [${i + 1}/${contents.length}] Processing content from: ${item.url || 'unknown'}`);

      if (trimmedContent.length < 50) {
        console.log(`[LLM] [${i + 1}/${contents.length}] SKIPPED - too short (${trimmedContent.length} chars)\n`);
        continue;
      }

      const result = await this.cleanContent(trimmedContent, item.url);

      if (result.cleanedLength < 100) {
        console.log(`[LLM] [${i + 1}/${contents.length}] SKIPPED - cleaned too short (${result.cleanedLength} chars)\n`);
        continue;
      }

      console.log(`[LLM] [${i + 1}/${contents.length}] ACCEPTED - cleaned: ${result.cleanedLength} chars, sections: ${Object.keys(result.sections).length}\n`);
      results.push(result);
    }

    console.log(`[LLM] ═══════════════════════════════════════════`);
    console.log(`[LLM] Batch complete. Accepted: ${results.length}/${contents.length}`);
    console.log(`[LLM] ═══════════════════════════════════════════\n`);

    return results;
  }

  async generateFeaturesFromChunks(
    chunks: { id: string; content: string; distance: number; metadata?: Record<string, string>; source?: string }[],
    parameter: string
  ): Promise<FeatureScore[]> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured - no mock fallback');
    }

    if (!chunks || chunks.length === 0) {
      throw new Error(`No chunks available for parameter ${parameter} - cannot generate features without data. Ensure ChromaDB has embeddings for this company/parameter.`);
    }

    const context = chunks.map((c, idx) => `[Source ${c.source || 'unknown'}:${c.id}] ${c.content}`).join('\n---\n');

    const featureDefinitions = parameter === 'SCF'
      ? `
SCF Features to extract (include 2-3 word reasoning for each score):
1. anchorCertainty (0-100): How certain is this company an anchor buyer in supply chain. Consider value chain position, supplier relationships, and chain hierarchy.
2. tradeRelationship (0-100): Duration and frequency of trading relationships. Higher score if frequent shipments and long-term supplier/customer relationships detected.
3. importExportActivity (0-100): Level of import/export activities. Note that presence of shipment records (BOL) indicates import/export operations.
4. supplyChainRole (0-100): Role in supply chain (anchor, supplier, distributor). Identify tier level and client type from data.
5. workingCapitalPattern (0-100): Cash flow and working capital needs. Look for payment timing, shipment frequency, and financial patterns.
`
      : `
LC Features to extract (include 2-3 word reasoning for each score):
1. internationalTradeActivity (0-100): Level of international trade involvement. Presence of shipments/BOL records indicates import/export activity.
2. transactionValue (0-100): Typical transaction values. Assess from shipment weights, container counts, and transaction frequency.
3. paymentRiskExposure (0-100): Exposure to payment risks. Consider counterparty trust and transaction complexity.
4. counterpartyTrustLevel (0-100): Trust level with counterparties. Look for verified suppliers and confirmed shipment relationships.
5. documentationComplexity (0-100): Complexity of trade documentation. Assess from trade terms and shipment records.
`;

    const prompt = `Based on the following company data, extract feature scores for ${parameter} product recommendation.

${featureDefinitions}

Company data:
${context.slice(0, 4000)}

Return JSON where each feature has score, a brief reason (2-4 words), and sources (array of source IDs from the data that support this score):
{
  "anchorCertainty": {"score": 85, "reason": "Tier 0 anchor detected", "sources": ["src_1", "src_2"]},
  "tradeRelationship": {"score": 72, "reason": "Frequent shipments found", "sources": ["src_3"]}
}`;

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a trade finance analyst. Extract structured feature scores from company data.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0,
          max_tokens: 500,
        }),
      });

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const scores = JSON.parse(jsonMatch[0]);
        return Object.entries(scores)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([name, value]) => {
            if (typeof value === 'object' && value !== null && 'score' in value) {
              const val = value as { score: number; reason?: string; sources?: string[] };
              return {
                name,
                score: typeof val.score === 'number' ? Math.round(val.score) : 0,
                evidence: val.reason || undefined,
                sources: Array.isArray(val.sources) ? val.sources : undefined,
              };
            }
            return {
              name,
              score: typeof value === 'number' ? Math.round(value) : 0,
            };
          });
      }
    } catch (error) {
      console.error('[LLM] Feature generation error:', error);
      throw new Error('Failed to generate features - no mock fallback');
    }

    throw new Error('Failed to parse feature scores from LLM response');
  }

  async generateRecommendationSummary(
    company: string,
    parameter: string,
    features: FeatureScore[],
    chunks: { id: string; content: string; distance: number; metadata?: Record<string, string>; source?: string }[]
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured - no mock fallback');
    }

    const context = chunks.map(c => c.content).join('\n---\n');
    const topFeatures = features.sort((a, b) => b.score - a.score).slice(0, 3);

    const prompt = `Generate a brief summary (2-3 sentences) for ${company}'s ${parameter === 'SCF' ? 'Supply Chain Finance' : 'Letter of Credit'} recommendation.

Key features:
${topFeatures.map(f => `- ${f.name}: ${f.score}`).join('\n')}

Context:
${context.slice(0, 1500)}`;

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a trade finance analyst. Generate concise recommendations.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0,
          max_tokens: 200,
        }),
      });

      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (error) {
      console.error('[LLM] Summary generation error:', error);
      return `${company} demonstrates ${parameter} potential.`;
    }
  }

  private getMockFeatures(parameter: string): FeatureScore[] {
    if (parameter === 'SCF') {
      return [
        { name: 'anchorCertainty', score: 75 },
        { name: 'tradeRelationship', score: 68 },
        { name: 'importExportActivity', score: 82 },
        { name: 'supplyChainRole', score: 70 },
        { name: 'workingCapitalPattern', score: 65 },
      ];
    }
    return [
      { name: 'internationalTradeActivity', score: 78 },
      { name: 'transactionValue', score: 72 },
      { name: 'paymentRiskExposure', score: 60 },
      { name: 'counterpartyTrustLevel', score: 75 },
      { name: 'documentationComplexity', score: 55 },
    ];
  }
}

export const llmService = new LLMService();