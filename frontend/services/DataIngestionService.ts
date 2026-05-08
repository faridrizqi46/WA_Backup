import { SearchResult, CrawlResult, IngestionResult } from '@/types';

export interface ExtractedTable {
  title?: string;
  headers: string[];
  rows: string[][];
  sourceUrl?: string;
  tableIndex: number;
}

export class TableExtractor {
  static extractTablesFromHtml(html: string, sourceUrl?: string): ExtractedTable[] {
    const tables: ExtractedTable[] = [];

    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
    let tableMatch;

    let tableIndex = 0;
    while ((tableMatch = tableRegex.exec(html)) !== null) {
      const tableHtml = tableMatch[0];
      const tableContent = tableMatch[1];

      let title: string | undefined;

      const captionMatch = /<caption[^>]*>([\s\S]*?)<\/caption>/i.exec(tableContent);
      if (captionMatch) {
        title = TableExtractor.decodeHtmlEntities(captionMatch[1].replace(/<[^>]+>/g, '').trim());
      }

      const idMatch = /id=["']([^"']+)["']/i.exec(tableHtml);
      if (!title && idMatch) {
        title = TableExtractor.decodeHtmlEntities(idMatch[1].replace(/[-_]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2'));
      }

      const headers: string[] = [];
      const rows: string[][] = [];

      const theadMatch = /<thead[^>]*>([\s\S]*?)<\/thead>/i.exec(tableContent);
      if (theadMatch) {
        const headerCells = theadMatch[1].match(/<th[^>]*>([\s\S]*?)<\/th>/gi) || [];
        for (const cell of headerCells) {
          const text = cell.replace(/<[^>]+>/g, '').trim();
          headers.push(TableExtractor.decodeHtmlEntities(text));
        }
      }

      const tbodyMatch = /<tbody[^>]*>([\s\S]*?)<\/tbody>/i.exec(tableContent);
      const tbodyContent = tbodyMatch ? tbodyMatch[1] : tableContent;

      const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let rowMatch;

      while ((rowMatch = rowRegex.exec(tbodyContent)) !== null) {
        const rowContent = rowMatch[1];
        const cells = rowContent.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
        const rowData: string[] = cells.map(cell => {
          const text = cell.replace(/<[^>]+>/g, '').trim();
          return TableExtractor.decodeHtmlEntities(text);
        });

        const isEmptyRow = rowData.every(cell => cell === '');
        if (rowData.length > 0 && !isEmptyRow) {
          rows.push(rowData);
        }
      }

      if (headers.length === 0) {
        continue;
      }

      tables.push({
        title,
        headers,
        rows,
        sourceUrl,
        tableIndex: tableIndex++,
      });
    }

    return tables;
  }

  static extractTablesFromMultipleHtml(results: { html?: string; url?: string }[]): ExtractedTable[] {
    const allTables: ExtractedTable[] = [];

    for (const result of results) {
      const tables = this.extractTablesFromHtml(result.html || '', result.url);
      allTables.push(...tables);
    }

    return allTables;
  }

  static filterTablesByColumnName(tables: ExtractedTable[], columnNames: string[]): ExtractedTable[] {
    const normalizedColumnNames = columnNames.map(name => name.toLowerCase());

    return tables.filter(table => {
      return table.headers.some(header => {
        const normalizedHeader = header.toLowerCase();
        return normalizedColumnNames.some(colName => normalizedHeader.includes(colName));
      });
    });
  }

  static filterBolTables(tables: ExtractedTable[]): ExtractedTable[] {
    return this.filterTablesByColumnName(tables, [
      'bol', 'bill of lading', 'bill of landing'
    ]).filter(table => !this.isNoDataBolTable(table));
  }

  private static isNoDataBolTable(table: ExtractedTable): boolean {
    const noDataPatterns = [
      'no hts code data',
      'no bol',
      'no data available',
    ];
    const firstRowText = table.rows[0]?.join(' ').toLowerCase() || '';
    return noDataPatterns.some(pattern => firstRowText.includes(pattern));
  }

  static filterAssociationsTables(tables: ExtractedTable[]): ExtractedTable[] {
    return this.filterTablesByColumnName(tables, ['associations']);
  }

  static decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&apos;': "'",
      '&nbsp;': ' ',
      '&copy;': '©',
      '&reg;': '®',
      '&trade;': '™',
    };

    let result = text;
    for (const [entity, char] of Object.entries(entities)) {
      result = result.replace(new RegExp(entity, 'gi'), char);
    }

    result = result.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
    result = result.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

    return result;
  }

  static tablesToMarkdown(table: ExtractedTable): string {
    if (table.headers.length === 0 && table.rows.length === 0) {
      return '';
    }

    const lines: string[] = [];

    if (table.headers.length > 0) {
      lines.push('| ' + table.headers.join(' | ') + ' |');
      lines.push('| ' + table.headers.map(() => '---').join(' | ') + ' |');
    }

    for (const row of table.rows) {
      lines.push('| ' + row.join(' | ') + ' |');
    }

    return lines.join('\n');
  }

  static extractSankeySection(markdown: string): string {
    const sankeyPatterns = [
      /##\s*Sankey\s*Diagram*?[\s\S]*?(?=\n##\s|\n#\s|$)/i,
      /###\s*Sankey\s*Diagram*?[\s\S]*?(?=\n##\s|\n###\s|\n#\s|$)/i,
      /Sankey\s*Diagram*?[\s\S]*?(?=\n##\s|\n#\s|$)/i,
    ];

    for (const pattern of sankeyPatterns) {
      const match = pattern.exec(markdown);
      if (match) {
        return match[0].trim();
      }
    }

    return '';
  }

  static extractSankeyLinks(sankeySection: string): string[] {
    const lines = sankeySection.split('\n').filter(line => line.trim());
    const links: string[] = [];

    for (const line of lines) {
      const cleanedLine = line.replace(/^[-*•]\s*/, '').trim();
      if (cleanedLine && !cleanedLine.startsWith('#') && !cleanedLine.toLowerCase().includes('sankey')) {
        const bracketMatches = [...cleanedLine.matchAll(/\[([^\]]+)\]/g)];
        for (const match of bracketMatches) {
          const content = match[1].trim();
          if (content) {
            links.push(content);
          }
        }
      }
    }

    return links;
  }

  static extractCompanyNamesFromAssociations(associationsTable: ExtractedTable): string[] {
    const companyNameIndex = associationsTable.headers.findIndex(h =>
      h.toLowerCase().includes('company name')
    );

    if (companyNameIndex === -1) {
      return [];
    }

    return associationsTable.rows.map(row => row[companyNameIndex]).filter(name => name && name.trim());
  }

  static buildValueChain(
    sankeyLinks: string[],
    associationsTable: ExtractedTable | null,
    mainCompany: string = 'PT. JAPFA COMFEED INDONESIA TBK'
  ): { company: string; tier1: ValueChainNode[] } {
    const tier1Companies = associationsTable
      ? this.extractCompanyNamesFromAssociations(associationsTable)
      : [];

    const normalizedTier1 = new Set(tier1Companies.map(c => c.toLowerCase().trim()));

    const result: { company: string; tier1: ValueChainNode[] } = {
      company: mainCompany,
      tier1: []
    };

    let currentTier1: ValueChainNode | null = null;

    for (const link of sankeyLinks) {
      const trimmedLink = link.trim();
      if (!trimmedLink) continue;

      const normalizedLink = trimmedLink.toLowerCase().trim();
      if (normalizedLink === mainCompany.toLowerCase()) continue;

      const isTier1 = normalizedTier1.has(normalizedLink);

      if (isTier1) {
        currentTier1 = { company: trimmedLink, tier2: [] };
        result.tier1.push(currentTier1);
      } else if (currentTier1) {
        if (!currentTier1.tier2) {
          currentTier1.tier2 = [];
        }
        currentTier1.tier2.push({ company: trimmedLink });
      } else {
        currentTier1 = { company: trimmedLink, tier2: [] };
        result.tier1.push(currentTier1);
      }
    }

    return result;
  }
}

export interface ValueChainNode {
  company: string;
  tier2?: ValueChainNode[];
}

const SEARCH_API_URL = process.env.SEARCH_API_URL || 'https://www.searchapi.io/api/v1/search';
const SEARCH_API_KEY = process.env.SEARCHAPI_API_KEY || process.env.SEARCH_API_KEY;
const FIRECRAWL_API_URL = 'https://api.firecrawl.dev/v2/scrape';
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

export class DataIngestionService {
  private searchApiUrl: string;
  private searchApiKey: string | undefined;
  private firecrawlApiUrl: string;
  private firecrawlApiKey: string | undefined;

  constructor(
    searchApiUrl?: string,
    searchApiKey?: string,
    firecrawlApiUrl?: string,
    firecrawlApiKey?: string
  ) {
    this.searchApiUrl = searchApiUrl || SEARCH_API_URL;
    this.searchApiKey = searchApiKey || SEARCH_API_KEY;
    this.firecrawlApiUrl = firecrawlApiUrl || FIRECRAWL_API_URL;
    this.firecrawlApiKey = firecrawlApiKey || FIRECRAWL_API_KEY;
  }

  async search(query: string): Promise<SearchResult[]> {
    if (!query.trim()) {
      throw new Error('Query is required');
    }

    console.log(`[SearchAPI] Searching for: ${query}`);

    if (!this.searchApiKey) {
      console.warn('[SearchAPI] API key not set - returning mock results');
      return this.getMockSearchResults(query);
    }

    const params = new URLSearchParams({
      q: query,
      engine: 'google_news',
      num: '10',
    });

    console.log(`[SearchAPI] Request URL: ${this.searchApiUrl}?${params}`);

    try {
      const response = await fetch(`${this.searchApiUrl}?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.searchApiKey}`,
          'Accept': 'application/json',
        },
      });

      console.log(`[SearchAPI] Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[SearchAPI] API error: ${errorText}`);
        throw new Error(`Search API failed with status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[SearchAPI] Got ${data.organic_results?.length || 0} results`);

      const results = data.organic_results || data.results || [];
      return results.map((r: { title?: string; url?: string; link?: string; snippet?: string; date?: string }) => ({
        title: r.title || '',
        link: r.link || r.url || '',
        snippet: r.snippet || '',
        date: r.date || '',
      }));
    } catch (err) {
      console.error(`[SearchAPI] Search failed: ${err}`);
      throw err;
    }
  }

  private getMockSearchResults(query: string): SearchResult[] {
    return [
      {
        title: `News about ${query} - Article 1`,
        link: `https://example.com/news/${query.replace(/\s+/g, '-')}/article-1`,
        snippet: `This is a mock search result for ${query}. In production, this would be actual news from your search API.`,
        date: new Date().toISOString().split('T')[0],
      },
      {
        title: `${query} Business Update - Article 2`,
        link: `https://example.com/news/${query.replace(/\s+/g, '-')}/article-2`,
        snippet: `Mock snippet for ${query}. Configure your SEARCH_API_URL environment variable to get real results.`,
        date: new Date().toISOString().split('T')[0],
      },
      {
        title: `${query} Financial Report - Article 3`,
        link: `https://example.com/news/${query.replace(/\s+/g, '-')}/article-3`,
        snippet: `Another mock result for ${query}. The search API should return results in this format.`,
        date: new Date().toISOString().split('T')[0],
      },
    ];
  }

  async crawlUrl(url: string): Promise<CrawlResult> {
    if (!url.trim()) {
      return { error: 'URL is required' };
    }

    console.log(`[Firecrawl] Starting scrape for URL: ${url}`);

    if (!this.firecrawlApiKey) {
      console.warn('[Firecrawl] API key not configured - returning mock result');
      return {
        markdown: `# Mock Crawl Result for ${url}\n\nThis is mock content since Firecrawl API key is not configured.\n\nTo enable real crawling, set the FIRECRAWL_API_KEY environment variable.`,
        html: `<html><head><title>Mock Article - ${url}</title></head><body><h1>Mock Crawl Result for ${url}</h1><p>This is mock HTML content since Firecrawl API key is not configured.</p></body></html>`,
        metadata: {
          title: `Mock Article - ${url}`,
          description: 'Mock description',
          source: url,
        },
      };
    }

    try {
      console.log(`[Firecrawl] Sending scrape request to ${this.firecrawlApiUrl}`);
      const response = await fetch(this.firecrawlApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.firecrawlApiKey}`,
        },
        body: JSON.stringify({ url, formats: ['markdown', 'html'] }),
      });

      console.log(`[Firecrawl] Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Firecrawl] API error: ${errorText}`);
        return { error: `Firecrawl API error: ${errorText}` };
      }

      const data = await response.json();
      console.log(`[Firecrawl] Response data length: markdown=${data.data?.markdown?.length || 0}, html=${data.data?.html?.length || 0}`);

      if (data.success && data.data) {
        return {
          markdown: data.data.markdown,
          html: data.data.html,
          metadata: data.data.metadata,
        };
      }

      if (data.error) {
        return { error: data.error };
      }

      return { error: 'Unknown response format' };
    } catch (err) {
      console.error(`[Firecrawl] Scrape failed: ${err}`);
      return { error: err instanceof Error ? err.message : 'Failed to scrape URL' };
    }
  }

  async crawlUrls(urls: string[]): Promise<CrawlResult[]> {
    const trimmedUrls = urls.map(u => u.trim()).filter(u => u);
    console.log(`[Firecrawl] Crawling ${trimmedUrls.length} URLs in parallel`);
    
    const results = await Promise.all(
      trimmedUrls.map(url => this.crawlUrl(url))
    );
    
    return results;
  }

  async ingest(companyName: string, maxResults?: number): Promise<IngestionResult> {
    const errors: string[] = [];
    
    let searchResults: SearchResult[] = [];
    try {
      searchResults = await this.search(companyName);
    } catch (err) {
      errors.push(`Search failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    const urlsToCrawl = searchResults
      .slice(0, maxResults)
      .map((result) => result.link);

    let crawlResults: CrawlResult[] = [];
    if (urlsToCrawl.length > 0) {
      try {
        crawlResults = await this.crawlUrls(urlsToCrawl);
      } catch (err) {
        errors.push(`Crawl failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return {
      searchQuery: companyName,
      searchResults,
      crawlResults,
      totalSearchResults: searchResults.length,
      totalCrawled: crawlResults.length,
      errors,
    };
  }

  async ingestWithParallelCrawl(companyName: string, maxResults?: number): Promise<IngestionResult> {
    const errors: string[] = [];
    
    let searchResults: SearchResult[] = [];
    try {
      searchResults = await this.search(companyName);
    } catch (err) {
      errors.push(`Search failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    const urlsToCrawl = searchResults
      .slice(0, maxResults)
      .map((result) => result.link);

    let crawlResults: CrawlResult[] = [];
    if (urlsToCrawl.length > 0) {
      try {
        crawlResults = await Promise.all(
          urlsToCrawl.map((url) => this.crawlUrl(url))
        );
      } catch (err) {
        errors.push(`Crawl failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return {
      searchQuery: companyName,
      searchResults,
      crawlResults,
      totalSearchResults: searchResults.length,
      totalCrawled: crawlResults.length,
      errors,
    };
  }
}

export const dataIngestionService = new DataIngestionService();