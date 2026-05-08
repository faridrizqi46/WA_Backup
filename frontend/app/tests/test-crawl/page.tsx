'use client';

import { useState } from 'react';

interface CrawlResult {
  content?: string;
  markdown?: string;
  html?: string;
  metadata?: Record<string, unknown>;
  error?: string;
  jobId?: string;
  status?: string;
}

export default function TestCrawlPage() {
  const [urls, setUrls] = useState('');
  const [results, setResults] = useState<CrawlResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urls.trim()) return;

    const urlList = urls.split('\n').filter((u) => u.trim());
    if (urlList.length === 0) return;

    setLoading(true);
    setError(null);
    setResults([]);

    const crawlResults: CrawlResult[] = [];

    for (const url of urlList) {
      const trimmedUrl = url.trim();
      if (!trimmedUrl) continue;

      setCurrentUrl(trimmedUrl);

      try {
        const response = await fetch('/api/crawl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmedUrl }),
        });

        const data = await response.json();
        crawlResults.push(data);
        setResults([...crawlResults]);
      } catch (err) {
        const errorResult = { error: err instanceof Error ? err.message : 'Failed to crawl' };
        crawlResults.push(errorResult);
        setResults([...crawlResults]);
      }
    }

    setLoading(false);
    setCurrentUrl(null);
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa] p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#1a2436] mb-6">Crawl URLs</h1>

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
            {loading ? 'Crawling...' : 'Crawl'}
          </button>
        </form>

        {loading && currentUrl && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg text-blue-700">
            Currently crawling: {currentUrl}
          </div>
        )}

        {error && (
          <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">{error}</div>
        )}

        {results.length > 0 && (
          <div className="space-y-6">
            {results.map((result, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold text-[#1a2436] mb-3">Result {index + 1}</h3>
                {result.error ? (
                  <p className="text-red-600">{result.error}</p>
                ) : result.jobId && result.status === 'processing' ? (
                  <p className="text-yellow-600">Processing... Job ID: {result.jobId}</p>
                ) : (
                  <div>
                    {result.metadata && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Metadata:</p>
                        <pre className="text-xs overflow-auto max-h-32 whitespace-pre-wrap">{JSON.stringify(result.metadata, null, 2)}</pre>
                      </div>
                    )}
                    {result.markdown && (
                      <div className="p-3 bg-gray-50 rounded-lg mb-3">
                        <p className="text-xs text-gray-500 mb-1">Markdown:</p>
                        <pre className="text-xs overflow-auto max-h-96 whitespace-pre-wrap">{result.markdown}</pre>
                      </div>
                    )}
                    {result.html && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">HTML:</p>
                        <pre className="text-xs overflow-auto max-h-96 whitespace-pre-wrap">{result.html}</pre>
                      </div>
                    )}
                    {result.content && !result.markdown && (
                      <p className="text-gray-700 whitespace-pre-wrap">{result.content}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && results.length === 0 && !error && (
          <p className="text-gray-500 text-center py-8">Enter URLs to crawl their content</p>
        )}
      </div>
    </div>
  );
}
