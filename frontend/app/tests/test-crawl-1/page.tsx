'use client';

import { useState } from 'react';

interface CrawlResult {
  content?: string;
  markdown?: string;
  metadata?: Record<string, unknown>;
  error?: string;
  jobId?: string;
  status?: string;
}

interface CleanResult {
  originalLength: number;
  cleanedLength: number;
  summary: string;
  keyPoints: string[];
  cleanedContent: string;
  error?: string;
}

interface ProcessedResult extends CrawlResult {
  cleanResult?: CleanResult;
  url: string;
}

export default function TestCrawl1Page() {
  const [urls, setUrls] = useState('');
  const [results, setResults] = useState<ProcessedResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cleaningUrl, setCleaningUrl] = useState<string | null>(null);
  const [expandedResults, setExpandedResults] = useState<Set<number>>(new Set());

  const handleCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urls.trim()) return;

    const urlList = urls.split('\n').filter((u) => u.trim());
    if (urlList.length === 0) return;

    setLoading(true);
    setError(null);
    setResults([]);

    const crawlResults: ProcessedResult[] = [];

    for (const url of urlList) {
      const trimmedUrl = url.trim();
      if (!trimmedUrl) continue;

      setCurrentUrl(trimmedUrl);
      console.log(`[TestCrawl1] Starting crawl for: ${trimmedUrl}`);

      try {
        const response = await fetch('/api/crawl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmedUrl }),
        });

        const data = await response.json();
        console.log(`[TestCrawl1] Crawl result received for ${trimmedUrl}`);
        
        const processedResult: ProcessedResult = { ...data, url: trimmedUrl };
        crawlResults.push(processedResult);
        setResults([...crawlResults]);

        if (data.markdown || data.content) {
          console.log(`[TestCrawl1] Starting LLM clean for: ${trimmedUrl}`);
          setCleaningUrl(trimmedUrl);
          
          try {
            const cleanResponse = await fetch('/api/clean', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                content: data.markdown || data.content,
                url: trimmedUrl 
              }),
            });
            
            const cleanData = await cleanResponse.json();
            console.log(`[TestCrawl1] LLM clean result received for ${trimmedUrl}`);
            
            const updatedResults = [...crawlResults];
            const resultIndex = updatedResults.findIndex(r => r.url === trimmedUrl);
            if (resultIndex !== -1) {
              updatedResults[resultIndex].cleanResult = cleanData;
              crawlResults[resultIndex].cleanResult = cleanData;
            }
            setResults([...updatedResults]);
          } catch (cleanErr) {
            console.error(`[TestCrawl1] LLM clean error for ${trimmedUrl}:`, cleanErr);
          }
          
          setCleaningUrl(null);
        }
      } catch (err) {
        console.error(`[TestCrawl1] Crawl error for ${trimmedUrl}:`, err);
        const errorResult: ProcessedResult = { 
          error: err instanceof Error ? err.message : 'Failed to crawl',
          url: trimmedUrl 
        };
        crawlResults.push(errorResult);
        setResults([...crawlResults]);
      }
    }

    setLoading(false);
    setCurrentUrl(null);
  };

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedResults(newExpanded);
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa] p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-[#1a2436] mb-6">Crawl URLs - Test 1 (with LLM Cleansing)</h1>

        <form onSubmit={handleCrawl} className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter URLs (one per line)
          </label>
          <textarea
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            placeholder="https://example.com/article1&#10;https://example.com/article2"
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-[#1a2436] text-white rounded-lg hover:bg-[#2a3446] disabled:opacity-50"
          >
            {loading ? 'Crawling & Cleaning...' : 'Crawl & Clean'}
          </button>
        </form>

        {loading && (currentUrl || cleaningUrl) && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg text-blue-700">
            {currentUrl && <p>Crawling: {currentUrl}</p>}
            {cleaningUrl && <p>LLM Cleansing: {cleaningUrl}</p>}
          </div>
        )}

        {error && (
          <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">{error}</div>
        )}

        {results.length > 0 && (
          <div className="space-y-6">
            {results.map((result, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-[#1a2436]">Result {index + 1}</h3>
                  <span className="text-xs text-gray-500 break-all">{result.url}</span>
                </div>

                {result.error ? (
                  <p className="text-red-600">{result.error}</p>
                ) : result.jobId && result.status === 'processing' ? (
                  <p className="text-yellow-600">Processing... Job ID: {result.jobId}</p>
                ) : (
                  <div>
                    {result.cleanResult && (
                      <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="font-medium text-green-800 mb-2">LLM Cleansed Summary</h4>
                        <p className="text-sm text-green-700 mb-3">{result.cleanResult.summary}</p>
                        
                        <h5 className="font-medium text-green-800 mb-2">Key Points:</h5>
                        <ul className="list-disc list-inside text-sm text-green-700 mb-3 space-y-1">
                          {result.cleanResult.keyPoints.map((point, i) => (
                            <li key={i}>{point}</li>
                          ))}
                        </ul>

                        <div className="flex justify-between items-center text-xs text-green-600">
                          <span>Original: {result.cleanResult.originalLength} chars → Cleaned: {result.cleanResult.cleanedLength} chars</span>
                          <button
                            onClick={() => toggleExpand(index)}
                            className="text-blue-600 hover:underline"
                          >
                            {expandedResults.has(index) ? 'Hide' : 'Show'} Cleaned Content
                          </button>
                        </div>

                        {expandedResults.has(index) && (
                          <div className="mt-3 p-3 bg-white rounded border border-green-200">
                            <pre className="text-xs whitespace-pre-wrap max-h-64 overflow-auto">{result.cleanResult.cleanedContent}</pre>
                          </div>
                        )}
                      </div>
                    )}

                    {!result.cleanResult && (result.markdown || result.content) && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Raw Content (pending LLM):</p>
                        <pre className="text-xs overflow-auto max-h-32 whitespace-pre-wrap">
                          {(result.markdown || result.content || '').substring(0, 500)}...
                        </pre>
                      </div>
                    )}

                    {result.cleanResult?.error && (
                      <div className="p-3 bg-yellow-50 rounded-lg text-yellow-700 text-sm">
                        LLM Error: {result.cleanResult.error}
                      </div>
                    )}

                    {!result.cleanResult && !result.markdown && !result.content && (
                      <p className="text-gray-500 text-sm">Waiting for crawl result...</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && results.length === 0 && !error && (
          <p className="text-gray-500 text-center py-8">Enter URLs to crawl and clean their content</p>
        )}
      </div>
    </div>
  );
}