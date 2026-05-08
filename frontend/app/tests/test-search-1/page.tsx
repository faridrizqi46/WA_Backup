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

interface ChromaDBEntry {
  id: string;
  content: string;
  metadata?: Record<string, string>;
}

interface RawSearchResponse {
  success: boolean;
  query: string;
  status: number;
  data: unknown;
  summary: {
    hasOrganicResults: boolean;
    organicResultsCount: number;
    hasResults: boolean;
    resultsCount: number;
    topLevelKeys: string[];
  };
}

type Tab = 'ingest' | 'chroma' | 'rawdata';

export default function TestIngestPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IngestionResult | null>(null);
  const [showCrawlDetails, setShowCrawlDetails] = useState(false);
  const [storeToChroma, setStoreToChroma] = useState(true);
  const [storingStatus, setStoringStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('ingest');
  const [chromaData, setChromaData] = useState<ChromaDBEntry[]>([]);
  const [chromaStats, setChromaStats] = useState<{ count: number; name: string } | null>(null);
  const [loadingChroma, setLoadingChroma] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ChromaDBEntry | null>(null);
  const [rawSearchData, setRawSearchData] = useState<RawSearchResponse | null>(null);
  const [loadingRaw, setLoadingRaw] = useState(false);
  const [rawQuery, setRawQuery] = useState('');

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      setStoringStatus(null);
      const response = await fetch(`/api/ingest?q=${encodeURIComponent(query)}&store=${storeToChroma}`);
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

  const handleRawSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawQuery.trim()) return;

    setLoadingRaw(true);
    setRawSearchData(null);

    try {
      const response = await fetch(`/api/search-raw?q=${encodeURIComponent(rawQuery)}`);
      const data = await response.json();
      setRawSearchData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch raw data');
    } finally {
      setLoadingRaw(false);
    }
  };

  const loadChromaData = async () => {
    setLoadingChroma(true);
    try {
      const [statsRes, dataRes] = await Promise.all([
        fetch('/api/query'),
        fetch('/api/query', { method: 'PUT' }),
      ]);
      const statsJson = await statsRes.json();
      const dataJson = await dataRes.json();
      if (statsJson.success) setChromaStats(statsJson.data);
      if (dataJson.success) setChromaData(dataJson.data);
    } catch (err) {
      console.error('Failed to load ChromaDB data:', err);
    } finally {
      setLoadingChroma(false);
    }
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'chroma' && chromaData.length === 0) {
      loadChromaData();
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa] p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-[#1a2436] mb-6">Data Management</h1>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => handleTabChange('ingest')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'ingest'
                ? 'bg-[#1a2436] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Ingest Data
          </button>
          <button
            onClick={() => handleTabChange('chroma')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'chroma'
                ? 'bg-[#1a2436] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            ChromaDB View
          </button>
          <button
            onClick={() => handleTabChange('rawdata')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'rawdata'
                ? 'bg-[#1a2436] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Raw SearchAPI Data
          </button>
        </div>

        {activeTab === 'ingest' && (
          <>
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
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="storeChroma"
                  checked={storeToChroma}
                  onChange={(e) => setStoreToChroma(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="storeChroma" className="text-sm text-gray-600">
                  Store results to ChromaDB
                </label>
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

                {storingStatus && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">{storingStatus}</p>
                  </div>
                )}

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
          </>
        )}

        {activeTab === 'chroma' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-[#1a2436]">ChromaDB Collection</h2>
                <button
                  onClick={loadChromaData}
                  disabled={loadingChroma}
                  className="px-4 py-2 bg-[#1a2436] text-white rounded-lg hover:bg-[#2a3446] disabled:opacity-50"
                >
                  {loadingChroma ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {chromaStats && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Collection Name</p>
                    <p className="font-medium">{chromaStats.name}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Total Embeddings</p>
                    <p className="font-medium text-blue-600">{chromaStats.count}</p>
                  </div>
                </div>
              )}

              {loadingChroma ? (
                <p className="text-gray-500 text-center py-8">Loading ChromaDB data...</p>
              ) : chromaData.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No data in ChromaDB. Run ingestion first.</p>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-700">Stored Embeddings ({chromaData.length})</h3>
                  <div className="space-y-3">
                    {chromaData.map((entry, index) => (
                      <div
                        key={entry.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedEntry?.id === entry.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-gray-500">ID: {entry.id}</p>
                            {entry.metadata?.companyName && (
                              <p className="font-medium text-[#1a2436]">{entry.metadata.companyName}</p>
                            )}
                            {entry.metadata?.title && (
                              <p className="text-sm text-gray-600">{entry.metadata.title}</p>
                            )}
                            {entry.metadata?.url && (
                              <a
                                href={entry.metadata.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {entry.metadata.url}
                              </a>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">#{index + 1}</span>
                        </div>

                        {selectedEntry?.id === entry.id && (
                          <div className="mt-4 pt-4 border-t">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Content Preview:</h4>
                            <pre className="text-xs overflow-auto max-h-64 whitespace-pre-wrap bg-gray-100 p-3 rounded">
                              {entry.content.slice(0, 2000)}
                              {entry.content.length > 2000 && '...'}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'rawdata' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-[#1a2436] mb-4">Raw SearchAPI Response</h2>
              <form onSubmit={handleRawSearch} className="mb-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={rawQuery}
                    onChange={(e) => setRawQuery(e.target.value)}
                    placeholder="Enter company name to test SearchAPI..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={loadingRaw}
                    className="px-6 py-2 bg-[#1a2436] text-white rounded-lg hover:bg-[#2a3446] disabled:opacity-50"
                  >
                    {loadingRaw ? 'Fetching...' : 'Fetch Raw Data'}
                  </button>
                </div>
              </form>

              {error && (
                <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">{error}</div>
              )}

              {rawSearchData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Query</p>
                      <p className="font-medium">{rawSearchData.query}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-medium">{rawSearchData.status}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">organic_results</p>
                      <p className="font-medium text-blue-600">{rawSearchData.summary.organicResultsCount}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">results</p>
                      <p className="font-medium text-green-600">{rawSearchData.summary.resultsCount}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-2">Top-level Keys:</p>
                    <div className="flex flex-wrap gap-2">
                      {rawSearchData.summary.topLevelKeys.map((key) => (
                        <span key={key} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {key}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-md font-medium text-gray-700 mb-2">Full Response:</h3>
                    <pre className="text-xs overflow-auto max-h-96 whitespace-pre-wrap bg-gray-100 p-4 rounded-lg border">
                      {JSON.stringify(rawSearchData.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {!loadingRaw && !rawSearchData && !error && (
                <p className="text-gray-500 text-center py-8">Enter a company name to see raw SearchAPI response</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}