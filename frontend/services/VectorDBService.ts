import { CloudClient } from 'chromadb';

export interface EmbeddingResult {
  id: string;
  content: string;
  embedding: number[];
  metadata?: Record<string, string>;
}

export interface QueryResult {
  id: string;
  content: string;
  distance: number;
  metadata?: Record<string, string>;
  source?: string;
}

export class VectorDBService {
  private client: CloudClient | null = null;
  private collectionName: string;
  private apiKey: string | undefined;
  private chromaApiKey: string | undefined;
  private tenant: string | undefined;
  private database: string | undefined;
  private initialized: boolean = false;

  constructor(collectionName: string = 'scrawling-data') {
    this.collectionName = collectionName;
    this.apiKey = process.env.OPENAI_API_KEY;
    this.chromaApiKey = process.env.CHROMA_API_KEY;
    this.tenant = process.env.CHROMA_TENANT;
    this.database = process.env.CHROMA_DATABASE;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('[VectorDB] Initializing ChromaDB Cloud...');

    try {
      this.client = new CloudClient({
        apiKey: this.chromaApiKey,
        tenant: this.tenant,
        database: this.database,
      });

      await this.client.getOrCreateCollection({
        name: this.collectionName,
        metadata: { description: 'Crawl results embeddings' },
      });

      console.log('[VectorDB] Collection ready:', this.collectionName);
      this.initialized = true;
    } catch (error) {
      console.error('[VectorDB] Failed to initialize:', error);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('[VectorDB] Generating embedding for text length:', text.length);

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
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
    const embedding = data.data[0].embedding;

    console.log('[VectorDB] Embedding generated, dimensions:', embedding.length);
    return embedding;
  }

  async storeEmbedding(
    id: string,
    content: string,
    metadata?: Record<string, string>
  ): Promise<void> {
    await this.initialize();

    if (!this.client) {
      throw new Error('ChromaDB client not initialized');
    }

    console.log('[VectorDB] Storing embedding:', id);

    const embedding = await this.generateEmbedding(content);

    const collection = await this.client.getOrCreateCollection({
      name: this.collectionName,
    });

    await collection.add({
      ids: [id],
      embeddings: [embedding],
      documents: [content],
      metadatas: [metadata || {}],
    });

    console.log('[VectorDB] Embedding stored successfully');
  }

  async storeEmbeddingToCollection(
    id: string,
    content: string,
    metadata: Record<string, string>,
    collectionName: string,
    chunkSize: number = 850,
    chunkOverlap: number = 120,
    accountId?: string
  ): Promise<void> {
    await this.initialize();

    if (!this.client) {
      throw new Error('ChromaDB client not initialized');
    }

    const collection = await this.client.getOrCreateCollection({
      name: collectionName,
    });

    console.log(`[VectorDB] Chunking content (${content.length} bytes) with size=${chunkSize}, overlap=${chunkOverlap}...`);

    const chunks = this.splitContent(content, chunkSize, chunkOverlap);
    console.log(`[VectorDB] Split into ${chunks.length} chunks`);

    for (let i = 0; i < chunks.length; i++) {
      const chunkId = chunks.length === 1 ? id : `${id}_chunk_${i}`;
      const chunkMetadata: Record<string, string> = {
        ...metadata,
        chunkIndex: i.toString(),
        totalChunks: chunks.length.toString(),
        chunkSize: chunkSize.toString(),
        chunkOverlap: chunkOverlap.toString(),
      };

      if (accountId) {
        chunkMetadata.accountId = accountId;
      }

      const embedding = await this.generateEmbedding(chunks[i]);

      await collection.add({
        ids: [chunkId],
        embeddings: [embedding],
        documents: [chunks[i]],
        metadatas: [chunkMetadata],
      });
    }

    console.log(`[VectorDB] Stored ${chunks.length} chunks to`, collectionName);
  }

  private splitContent(content: string, chunkSize: number, chunkOverlap: number): string[] {
    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < content.length) {
      let endIndex = startIndex + chunkSize;

      if (endIndex < content.length) {
        const lastSpace = content.lastIndexOf(' ', endIndex);
        const lastNewline = content.lastIndexOf('\n', endIndex);
        const boundary = Math.max(lastSpace, lastNewline);

        if (boundary > startIndex + chunkSize * 0.5) {
          endIndex = boundary;
        }
      }

      const chunk = content.slice(startIndex, endIndex).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      startIndex = startIndex + chunkSize - chunkOverlap;

      if (startIndex >= content.length) {
        break;
      }
    }

    return chunks;
  }

  async queryByCompanyAndParameter(
    company: string,
    parameter: string,
    limit: number = 5
  ): Promise<QueryResult[]> {
    await this.initialize();

    const collection = await this.client!.getOrCreateCollection({
      name: this.collectionName,
    });

    const queryText = `${company} ${parameter} trade finance import export`;
    const queryEmbedding = await this.generateEmbedding(queryText);

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: limit,
      where: {
        companyName: company
      },
      include: ['documents', 'metadatas', 'distances']
    });

    return this.formatQueryResults(results, this.collectionName);
  }

  async queryByCompanyAndParameterMultiCollection(
    company: string,
    parameter: string,
    collections: string[],
    limit: number = 5
  ): Promise<QueryResult[]> {
    const queryText = `${company} ${parameter} trade finance import export`;
    return this.queryByMultiCollectionWithText(company, queryText, collections, limit);
  }

  async queryWithSignals(
    company: string,
    queryText: string,
    collections: string[],
    limit: number = 5
  ): Promise<QueryResult[]> {
    return this.queryByMultiCollectionWithText(company, queryText, collections, limit);
  }

  private async queryByMultiCollectionWithText(
    company: string,
    queryText: string,
    collections: string[],
    limit: number
  ): Promise<QueryResult[]> {
    const allResults: QueryResult[] = [];

    for (const collectionName of collections) {
      const results = await this.queryCollectionWithText(
        company,
        queryText,
        collectionName,
        limit
      );
      allResults.push(...results);
    }

    return allResults
      .sort((a, b) => {
        if (a.distance !== b.distance) {
          return a.distance - b.distance;
        }
        return a.id.localeCompare(b.id);
      })
      .slice(0, limit);
  }

  private async queryCollectionWithText(
    company: string,
    queryText: string,
    collectionName: string,
    limit: number
  ): Promise<QueryResult[]> {
    await this.initialize();

    if (!this.client) {
      throw new Error('ChromaDB client not initialized');
    }

    const collection = await this.client.getOrCreateCollection({
      name: collectionName,
    });

    const queryEmbedding = await this.generateEmbedding(queryText);

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: limit * 3,
      include: ['documents', 'metadatas', 'distances']
    });

    const formatted = this.formatQueryResults(results, collectionName);

    console.log('[VectorDB] === Raw Query Results ===');
    console.log(`[VectorDB] Company: "${company}", Query: "${queryText}"`);
    console.log(`[VectorDB] Collection: "${collectionName}", Total results before filter: ${formatted.length}`);

    formatted.forEach((r, i) => {
      console.log(`  [${i}] id="${r.id}", distance=${r.distance.toFixed(4)}`);
      console.log(`      metadata: ${JSON.stringify(r.metadata)}`);
      console.log(`      content: ${r.content.substring(0, 150).replace(/\n/g, ' ')}...`);
    });

    const companyLower = company.toLowerCase();
    const filtered = formatted.filter(r => {
      const meta = r.metadata || {};
      const storedCompany = (meta.companyName || '').toLowerCase();

      if (!storedCompany || storedCompany.length === 0) {
        const contentLower = (r.content || '').toLowerCase();
        const companyWords = companyLower.split(/[\s\-_.,]+/).filter(w => w.length > 2);
        const hasCompanyMatch = companyWords.some(word => contentLower.includes(word));

        if (!hasCompanyMatch) {
          console.log(`[VectorDB] Content doesn't contain company words, skipping`);
          return false;
        }
        console.log('[VectorDB] No metadata, but content matches company');
        return true;
      }

      return (
        storedCompany.includes(companyLower) ||
        companyLower.includes(storedCompany) ||
        this.fuzzyMatch(companyLower, storedCompany)
      );
    });

    console.log('[VectorDB] Query results:', formatted.length, '| After filter:', filtered.length);
    return filtered.slice(0, limit);
  }

  private fuzzyMatch(query: string, target: string): boolean {
    const words = query.split(/[\s\-_.,]+/).filter(w => w.length > 2);
    return words.some(word => target.includes(word));
  }

  async queryEmbeddings(
    query: string,
    topK: number = 5
  ): Promise<QueryResult[]> {
    await this.initialize();

    if (!this.client) {
      throw new Error('ChromaDB client not initialized');
    }

    console.log('[VectorDB] Querying embeddings, topK:', topK);

    const queryEmbedding = await this.generateEmbedding(query);

    const collection = await this.client.getOrCreateCollection({
      name: this.collectionName,
    });

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
    });

    const queryResults: QueryResult[] = [];

    if (results.ids && results.ids.length > 0) {
      for (let i = 0; i < results.ids[0].length; i++) {
        queryResults.push({
          id: results.ids[0][i],
          content: results.documents?.[0][i] || '',
          distance: results.distances?.[0][i] || 0,
          metadata: results.metadatas?.[0][i] as Record<string, string>,
        });
      }
    }

    console.log('[VectorDB] Query returned', queryResults.length, 'results');
    return queryResults;
  }

  private formatQueryResults(results: any, source?: string): QueryResult[] {
    const formatted: QueryResult[] = [];

    if (!results.ids || results.ids.length === 0) {
      return formatted;
    }

    for (let i = 0; i < results.ids[0].length; i++) {
      formatted.push({
        id: results.ids[0][i],
        content: results.documents?.[0]?.[i] || '',
        distance: results.distances?.[0]?.[i] || 0,
        metadata: results.metadatas?.[0]?.[i],
        source: source,
      });
    }

    return formatted
      .sort((a, b) => {
        if (a.distance !== b.distance) {
          return a.distance - b.distance;
        }
        return a.id.localeCompare(b.id);
      });
  }

  async deleteEmbedding(id: string): Promise<void> {
    await this.initialize();

    if (!this.client) {
      throw new Error('ChromaDB client not initialized');
    }

    const collection = await this.client.getOrCreateCollection({
      name: this.collectionName,
    });

    await collection.delete({ ids: [id] });
    console.log('[VectorDB] Deleted embedding:', id);
  }

  async deleteEmbeddings(ids: string[]): Promise<void> {
    await this.initialize();

    if (!this.client) {
      throw new Error('ChromaDB client not initialized');
    }

    const collection = await this.client.getOrCreateCollection({
      name: this.collectionName,
    });

    await collection.delete({ ids });
    console.log('[VectorDB] Deleted', ids.length, 'embeddings');
  }

  async deleteAllInCollection(collectionName: string): Promise<number> {
    await this.initialize();

    if (!this.client) {
      throw new Error('ChromaDB client not initialized');
    }

    const collection = await this.client.getOrCreateCollection({
      name: collectionName,
    });

    let totalDeleted = 0;
    let hasMore = true;

    while (hasMore) {
      const results = await collection.get({ limit: 300 });
      if (results.ids && results.ids.length > 0) {
        await collection.delete({ ids: results.ids as string[] });
        totalDeleted += results.ids.length;
        console.log('[VectorDB] Deleted batch of', results.ids.length, 'from', collectionName);
      }
      hasMore = (results.ids?.length || 0) === 300;
    }

    console.log('[VectorDB] Total deleted', totalDeleted, 'from', collectionName);
    return totalDeleted;
  }

  async deleteByPrefix(collectionName: string, prefix: string): Promise<number> {
    await this.initialize();

    if (!this.client) {
      throw new Error('ChromaDB client not initialized');
    }

    const collection = await this.client.getOrCreateCollection({
      name: collectionName,
    });

    let totalDeleted = 0;
    let hasMore = true;

    while (hasMore) {
      const results = await collection.get({ limit: 300 });
      const idsToDelete = (results.ids || []).filter((id: string) => id.startsWith(prefix));

      if (idsToDelete.length > 0) {
        await collection.delete({ ids: idsToDelete });
        totalDeleted += idsToDelete.length;
      }

      hasMore = (results.ids?.length || 0) === 300;
    }

    console.log('[VectorDB] Deleted', totalDeleted, 'embeddings with prefix', prefix, 'from', collectionName);
    return totalDeleted;
  }

  async getCollectionStats(): Promise<{ count: number; name: string }> {
    await this.initialize();

    if (!this.client) {
      throw new Error('ChromaDB client not initialized');
    }

    const collection = await this.client.getOrCreateCollection({
      name: this.collectionName,
    });

    const count = await collection.count();

    return {
      count,
      name: this.collectionName,
    };
  }

  async clearCollection(): Promise<void> {
    await this.initialize();

    if (!this.client) {
      throw new Error('ChromaDB client not initialized');
    }

    const collection = await this.client.getOrCreateCollection({
      name: this.collectionName,
    });

    await collection.delete({ where: {} });
    console.log('[VectorDB] Collection cleared');
  }

  async getAllEmbeddings(limit: number = 100): Promise<QueryResult[]> {
    await this.initialize();

    if (!this.client) {
      throw new Error('ChromaDB client not initialized');
    }

    const collection = await this.client.getOrCreateCollection({
      name: this.collectionName,
    });

    const results = await collection.get({ limit });

    const queryResults: QueryResult[] = [];

    if (results.ids && results.ids.length > 0) {
      for (let i = 0; i < results.ids.length; i++) {
        queryResults.push({
          id: results.ids[i],
          content: results.documents?.[i] || '',
          distance: 0,
          metadata: results.metadatas?.[i] as Record<string, string>,
        });
      }
    }

    console.log('[VectorDB] GetAll returned', queryResults.length, 'results');
    return queryResults;
  }

  async queryByCollection(
    query: string,
    collectionName: string,
    topK: number = 5
  ): Promise<QueryResult[]> {
    await this.initialize();

    if (!this.client) {
      throw new Error('ChromaDB client not initialized');
    }

    const queryEmbedding = await this.generateEmbedding(query);

    const collection = await this.client.getOrCreateCollection({
      name: collectionName,
    });

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
    });

    const queryResults: QueryResult[] = [];

    if (results.ids && results.ids.length > 0) {
      for (let i = 0; i < results.ids[0].length; i++) {
        queryResults.push({
          id: results.ids[0][i],
          content: results.documents?.[0][i] || '',
          distance: results.distances?.[0][i] || 0,
          metadata: results.metadatas?.[0][i] as Record<string, string>,
        });
      }
    }

    console.log('[VectorDB] Query by collection returned', queryResults.length, 'results from', collectionName);
    return queryResults;
  }

  async getCollectionData(collectionName: string, limit: number = 100): Promise<QueryResult[]> {
    await this.initialize();

    if (!this.client) {
      throw new Error('ChromaDB client not initialized');
    }

    const collection = await this.client.getOrCreateCollection({
      name: collectionName,
    });

    const results = await collection.get({ limit });

    const queryResults: QueryResult[] = [];

    if (results.ids && results.ids.length > 0) {
      for (let i = 0; i < results.ids.length; i++) {
        queryResults.push({
          id: results.ids[i],
          content: results.documents?.[i] || '',
          distance: 0,
          metadata: results.metadatas?.[i] as Record<string, string>,
        });
      }
    }

    console.log('[VectorDB] getCollectionData returned', queryResults.length, 'results from', collectionName);
    return queryResults;
  }

  async getCollectionsList(): Promise<string[]> {
    await this.initialize();
    if (!this.client) {
      throw new Error('ChromaDB client not initialized');
    }
    const collections = await this.client.listCollections();
    return collections.map((c: { name: string }) => c.name);
  }
}

export const vectorDBService = new VectorDBService();