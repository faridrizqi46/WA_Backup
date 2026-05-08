'use client';

import { useState } from 'react';

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  date?: string;
}

interface CrawlResult {
  content?: string;
  markdown?: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

interface IngestionResult {
  searchQuery: string;
  searchResults: SearchResult[];
  crawlResults: CrawlResult[];
  totalSearchResults: number;
  totalCrawled: number;
  errors: string[];
}

export default function TestIngestPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IngestionResult | null>(null);
  const [showCrawlDetails, setShowCrawlDetails] = useState(false);

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/ingest?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Ingestion failed');
      }
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa] p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-[#1a2436] mb-6">Data Ingestion</h1>

        <form onSubmit={handleIngest} className="mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter company name to ingest..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#1a2436] text-white rounded-lg hover:bg-[#2a3446] disabled:opacity-50"
            >
              {loading ? 'Ingesting...' : 'Ingest'}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">{error}</div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-[#1a2436] mb-3">Summary</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Search Query</p>
                  <p className="font-medium">{result.searchQuery}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Search Results</p>
                  <p className="font-medium text-blue-600">{result.totalSearchResults}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">URLs Crawled</p>
                  <p className="font-medium text-green-600">{result.totalCrawled}</p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-700">Errors: {result.errors.join(', ')}</p>
                </div>
              )}
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-[#1a2436]">Search Results ({result.searchResults.length})</h2>
                <button
                  onClick={() => setShowCrawlDetails(!showCrawlDetails)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {showCrawlDetails ? 'Hide' : 'Show'} Crawl Details
                </button>
              </div>
              <div className="space-y-3">
                {result.searchResults.map((item, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-semibold text-blue-600 hover:underline"
                    >
                      {item.title}
                    </a>
                    {item.date && (
                      <p className="text-sm text-gray-500 mt-1">{item.date}</p>
                    )}
                    <p className="text-gray-700 mt-2">{item.snippet}</p>
                    <p className="text-sm text-gray-400 mt-2">{item.link}</p>
                    
                    {showCrawlDetails && result.crawlResults[index] && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Crawl Result:</h4>
                        {result.crawlResults[index].error ? (
                          <p className="text-red-600 text-sm">{result.crawlResults[index].error}</p>
                        ) : (
                          <pre className="text-xs overflow-auto max-h-48 whitespace-pre-wrap">
                            {result.crawlResults[index].markdown || result.crawlResults[index].content || 'No content'}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!loading && !result && !error && (
          <p className="text-gray-500 text-center py-8">Enter a company name to search and crawl related news</p>
        )}
      </div>
    </div>
  );
}