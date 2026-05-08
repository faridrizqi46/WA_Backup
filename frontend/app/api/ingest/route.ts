import { NextRequest, NextResponse } from 'next/server';
import { dataIngestionService } from '@/services/DataIngestionService';
import { prismaService } from '@/services/PrismaService';
import { vectorDBService } from '@/services/VectorDBService';
import { llmService } from '@/services/LLMService';
import { IngestionResult } from '@/types';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const maxResults = searchParams.get('max');
  const storeResults = searchParams.get('store') === 'true';
  const industries = searchParams.get('industries') || 'General';

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  try {
    console.log(`[API /ingest] Starting ingestion for: ${query}, store: ${storeResults}`);

    const max = maxResults ? parseInt(maxResults, 10) : undefined;
    const result: IngestionResult = await dataIngestionService.ingest(query, max);

    if (storeResults) {
      console.log(`[API /ingest] Storing results in Prisma + ChromaDB (with LLM cleaning)`);

      const company = await prismaService.getOrCreateCompany(query, industries);
      if (!company) {
        return NextResponse.json({ error: 'Failed to create or find company' }, { status: 500 });
      }

      for (let i = 0; i < result.searchResults.length; i++) {
        const searchResult = result.searchResults[i];
        const crawlResult = result.crawlResults[i];

        if (!crawlResult || crawlResult.error) continue;

        try {
          const rawContent = crawlResult.markdown || crawlResult.content || '';

          if (rawContent.length < 50) continue;

          console.log(`[API /ingest] Cleaning content with LLM for: ${searchResult.title}`);
          const cleanResult = await llmService.cleanContent(rawContent, searchResult.link);

          const contentToStore = cleanResult.cleanedContent || rawContent;
          const summary = cleanResult.summary || '';
          const keyPoints = cleanResult.keyPoints || [];

          console.log(`[API /ingest] Content cleaned: ${rawContent.length} -> ${contentToStore.length} chars`);

          const storedCrawlResult = await prismaService.createCrawlResult({
            companyId: company.id,
            url: searchResult.link,
            title: searchResult.title,
            content: contentToStore,
          });

          console.log(`[API /ingest] Stored crawl result: ${storedCrawlResult.id}`);

          try {
            console.log(`[API /ingest] Storing embedding for: ${storedCrawlResult.id}`);
            await vectorDBService.storeEmbedding(storedCrawlResult.id, contentToStore, {
              companyId: company.id,
              companyName: query,
              url: searchResult.link,
              title: searchResult.title,
              summary: summary,
              keyPoints: JSON.stringify(keyPoints),
            });
            console.log(`[API /ingest] Stored embedding for: ${storedCrawlResult.id}`);
          } catch (embedErr) {
            console.error(`[API /ingest] Failed to store embedding:`, embedErr);
          }
        } catch (storeErr) {
          console.error(`[API /ingest] Failed to store result:`, storeErr);
        }
      }

      console.log(`[API /ingest] Storage complete`);
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[API /ingest] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to ingest data' },
      { status: 500 }
    );
  }
}