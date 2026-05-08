'use client';

import { useState } from 'react';

interface CrawlResult {
  url: string;
  title?: string;
  markdown?: string;
  html?: string;
  error?: string;
}

interface CleanResult {
  url: string;
  originalLength: number;
  cleanedLength: number;
  cleanedContent: string;
  summary: string;
  keyPoints: string[];
}

interface StoreResult {
  url: string;
  id: string;
  success: boolean;
  error?: string;
}

const COLLECTIONS = [
  { name: 'scrawling-data', label: 'Scrawling Data' },
  { name: 'JapfaAnnualReport2025', label: 'Japfa Annual Report 2025' },
];

export default function TestCrawl3Page() {
  const [urls, setUrls] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('scrawling-data');
  const [step, setStep] = useState<'input' | 'crawling' | 'cleaning' | 'preview' | 'storing' | 'done'>('input');
  const [crawlResults, setCrawlResults] = useState<CrawlResult[]>([]);
  const [cleanResults, setCleanResults] = useState<CleanResult[]>([]);
  const [storeResults, setStoreResults] = useState<StoreResult[]>([]);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ crawled: 0, cleaned: 0, stored: 0 });
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [collectionStats, setCollectionStats] = useState<{ count: number; name: string } | null>(null);
  const [openaiStatus, setOpenaiStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [openaiMessage, setOpenaiMessage] = useState<string>('');
  const [deletePrefix, setDeletePrefix] = useState('');
  const [deleteMessage, setDeleteMessage] = useState<string>('');
  const [accountId, setAccountId] = useState('');

  const testConnection = async () => {
    setConnectionStatus('unknown');
    setError(null);
    try {
      const response = await fetch('/api/query', { method: 'GET' });
      const data = await response.json();
      if (data.success) {
        setConnectionStatus('connected');
        setCollectionStats(data.data);
      } else {
        setConnectionStatus('error');
        setError(data.error);
      }
    } catch (err) {
      setConnectionStatus('error');
      setError(err instanceof Error ? err.message : 'Connection failed');
    }
  };

  const testOpenAI = async () => {
    setOpenaiStatus('unknown');
    setError(null);
    try {
      const response = await fetch('/api/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'This is a test. PT Japfa Comfeed Indonesia is a leading poultry feed company in Indonesia.',
          url: 'test://example'
        }),
      });
      const data = await response.json();
      if (data.cleanedContent) {
        setOpenaiStatus('connected');
        setOpenaiMessage('API key configured & working! Cleaned content received.');
      } else {
        setOpenaiStatus('error');
        setOpenaiMessage(data.error || 'Failed to get cleaned content');
      }
    } catch (err) {
      setOpenaiStatus('error');
      setOpenaiMessage(err instanceof Error ? err.message : 'OpenAI API connection failed');
    }
  };

  const handleDelete = async () => {
    if (!deletePrefix.trim()) {
      setDeleteMessage('Please enter a prefix to delete');
      return;
    }
    setDeleteMessage('Deleting...');
    try {
      const response = await fetch(`/api/vector/delete?collection=${encodeURIComponent(selectedCollection)}&prefix=${encodeURIComponent(deletePrefix)}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setDeleteMessage(`Deleted ${data.deleted} chunks with prefix "${deletePrefix}"`);
      } else {
        setDeleteMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setDeleteMessage(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(`Delete ALL chunks in ${selectedCollection}? This cannot be undone!`)) return;
    setDeleteMessage('Deleting all...');
    try {
      const response = await fetch(`/api/vector/delete?collection=${encodeURIComponent(selectedCollection)}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setDeleteMessage(`Deleted ${data.deleted} chunks`);
      } else {
        setDeleteMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setDeleteMessage(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urls.trim()) return;

    const urlList = urls.split('\n').filter((u) => u.trim());
    if (urlList.length === 0) return;

    setStep('crawling');
    setError(null);
    setCrawlResults([]);
    setCleanResults([]);
    setStoreResults([]);
    setProgress({ crawled: 0, cleaned: 0, stored: 0 });

    const results: CrawlResult[] = [];

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
        results.push({
          url: trimmedUrl,
          title: data.title || trimmedUrl,
          markdown: data.markdown,
          html: data.html,
          error: data.error,
        });
      } catch (err) {
        results.push({
          url: trimmedUrl,
          error: err instanceof Error ? err.message : 'Failed to crawl',
        });
      }

      setCrawlResults([...results]);
      setProgress(p => ({ ...p, crawled: results.filter(r => !r.error).length }));
    }

    setCurrentUrl(null);
    setStep('cleaning');
  };

  const handleClean = async () => {
    setError(null);
    const cleaned: CleanResult[] = [];

    for (const result of crawlResults) {
      if (result.error || !result.markdown) {
        continue;
      }

      setCurrentUrl(result.url);

      try {
        const rawContent = result.markdown;
        const response = await fetch('/api/clean', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: rawContent, url: result.url }),
        });

        let cleanData;
        try {
          cleanData = await response.json();
        } catch {
          throw new Error(`API returned non-JSON response: ${response.status}`);
        }

        if (!response.ok || cleanData.error) {
          throw new Error(cleanData.error || 'Clean API failed');
        }

        cleaned.push({
          url: result.url,
          originalLength: rawContent.length,
          cleanedLength: (cleanData.cleanedContent || rawContent).length,
          cleanedContent: cleanData.cleanedContent || rawContent,
          summary: cleanData.summary || '',
          keyPoints: cleanData.keyPoints || [],
        });
      } catch (err) {
        console.error(`Failed to clean ${result.url}:`, err);
        cleaned.push({
          url: result.url,
          originalLength: (result.markdown || '').length,
          cleanedLength: 0,
          cleanedContent: '',
          summary: '',
          keyPoints: [],
        });
      }

      setCleanResults([...cleaned]);
      setProgress(p => ({ ...p, cleaned: cleaned.filter(c => c.cleanedLength > 0).length }));
    }

    setCurrentUrl(null);
    setStep('preview');
  };

  const handleStore = async () => {
    setError(null);
    const stored: StoreResult[] = [];

    for (const clean of cleanResults) {
      if (!clean.cleanedContent) continue;

      setCurrentUrl(clean.url);

      try {
        const id = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

        const response = await fetch('/api/vector/store', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            content: clean.cleanedContent,
            metadata: {
              url: clean.url,
              summary: clean.summary,
              keyPoints: JSON.stringify(clean.keyPoints),
              collection: selectedCollection,
            },
            collectionName: selectedCollection,
            accountId: accountId || undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to store');
        }

        stored.push({
          url: clean.url,
          id,
          success: true,
        });
      } catch (err) {
        console.error(`Failed to store ${clean.url}:`, err);
        stored.push({
          url: clean.url,
          id: '',
          success: false,
          error: err instanceof Error ? err.message : 'Failed to store',
        });
      }

      setStoreResults([...stored]);
      setProgress(p => ({ ...p, stored: stored.filter(s => s.success).length }));
    }

    setCurrentUrl(null);
    setStep('done');
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa] p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-[#1a2436] mb-6">
          Crawl → Clean → Store to ChromaDB
        </h1>

        {/* Progress Steps */}
        <div className="flex gap-2 mb-6">
          {['input', 'crawling', 'cleaning', 'preview', 'storing', 'done'].map((s, i) => (
            <div
              key={s}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                step === s
                  ? 'bg-blue-600 text-white'
                  : ['crawling', 'cleaning', 'preview', 'storing', 'done'].indexOf(step) > i
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
        )}

        {step === 'input' && (
          <form onSubmit={handleCrawl} className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Collection
              </label>
              <select
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {COLLECTIONS.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">ChromaDB Connection Status</p>
                  {connectionStatus === 'connected' && collectionStats && (
                    <p className="text-xs text-green-600 mt-1">
                      Connected! Collection: <strong>{collectionStats.name}</strong> | Documents: <strong>{collectionStats.count}</strong>
                    </p>
                  )}
                  {connectionStatus === 'error' && (
                    <p className="text-xs text-red-600 mt-1">Failed: {error}</p>
                  )}
                  {connectionStatus === 'unknown' && (
                    <p className="text-xs text-gray-500 mt-1">Not tested yet</p>
                  )}
                </div>
                <button
                  onClick={testConnection}
                  className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Test Connection
                </button>
              </div>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">OpenAI API Status</p>
                  {openaiStatus === 'connected' && (
                    <p className="text-xs text-green-600 mt-1">{openaiMessage}</p>
                  )}
                  {openaiStatus === 'error' && (
                    <p className="text-xs text-red-600 mt-1">Failed: {openaiMessage}</p>
                  )}
                  {openaiStatus === 'unknown' && (
                    <p className="text-xs text-gray-500 mt-1">Not tested yet</p>
                  )}
                </div>
                <button
                  onClick={testOpenAI}
                  className="px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Test OpenAI
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account ID (optional - untuk metadata chunk)
              </label>
              <input
                type="text"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="e.g. acc-123456"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm font-semibold text-red-700 mb-2">Delete Chunks</p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={deletePrefix}
                  onChange={(e) => setDeletePrefix(e.target.value)}
                  placeholder="Prefix to delete (e.g. doc-123456)"
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  onClick={handleDelete}
                  className="px-4 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete by Prefix
                </button>
                <button
                  onClick={handleDeleteAll}
                  className="px-4 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Delete All
                </button>
              </div>
              {deleteMessage && (
                <p className={`text-xs ${deleteMessage.includes('Error') || deleteMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
                  {deleteMessage}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URLs (one per line)
              </label>
              <textarea
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                placeholder="https://example.com/article1&#10;https://example.com/article2"
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2 bg-[#1a2436] text-white rounded-lg hover:bg-[#2a3446]"
            >
              Start Crawl
            </button>
          </form>
        )}

        {/* Crawling Progress */}
        {['crawling', 'cleaning', 'storing'].includes(step) && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
              <span className="font-medium">
                {step === 'crawling' && `Crawling: ${currentUrl}`}
                {step === 'cleaning' && `Cleaning: ${currentUrl}`}
                {step === 'storing' && `Storing: ${currentUrl}`}
              </span>
            </div>
            <div className="mt-3 text-sm text-gray-500">
              Progress: Crawled {progress.crawled}/{crawlResults.length} |
              Cleaned {progress.cleaned}/{cleanResults.length || '?'} |
              Stored {progress.stored}/{cleanResults.filter(c => c.cleanedLength > 0).length}
            </div>
          </div>
        )}

        {/* Clean Step Button */}
        {step === 'cleaning' && cleanResults.length === 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <p className="text-gray-600 mb-4">
              Crawling complete! Ready to clean {crawlResults.filter(r => !r.error).length} documents.
            </p>
            <button
              onClick={handleClean}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Start Cleaning
            </button>
          </div>
        )}

        {/* Preview Step */}
        {step === 'preview' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                Preview Cleaned Data ({cleanResults.filter(c => c.cleanedLength > 0).length} documents)
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('input')}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStore}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Proceed to Store
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Review the cleaned content below before storing to{' '}
              <strong className="text-blue-600">{selectedCollection}</strong>
            </p>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {cleanResults.filter(c => c.cleanedLength > 0).map((result, i) => (
                <details key={i} className="border border-gray-200 rounded-lg p-4">
                  <summary className="font-medium cursor-pointer list-none flex justify-between items-center">
                    <span>{result.url}</span>
                    <span className="text-xs text-gray-500">
                      {result.originalLength} → {result.cleanedLength} chars
                    </span>
                  </summary>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    {result.summary && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-600">Summary:</p>
                        <p className="text-sm text-gray-700">{result.summary}</p>
                      </div>
                    )}
                    {result.keyPoints.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-600">Key Points:</p>
                        <ul className="text-sm text-gray-700 ml-4 list-disc">
                          {result.keyPoints.map((kp, j) => (
                            <li key={j}>{kp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Cleaned Content ({result.cleanedLength} chars):</p>
                      <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-auto max-h-96 whitespace-pre-wrap">
                        {result.cleanedContent}
                      </pre>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* Store Step Button */}
        {step === 'storing' && storeResults.length === 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <p className="text-gray-600 mb-4">
              Cleaning complete! Ready to store {cleanResults.filter(c => c.cleanedLength > 0).length} documents to{' '}
              <strong>{selectedCollection}</strong>.
            </p>
            <button
              onClick={handleStore}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Store to ChromaDB
            </button>
          </div>
        )}

        {/* Crawl Results */}
        {crawlResults.length > 0 && step !== 'preview' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              Crawl Results ({crawlResults.filter(r => !r.error).length}/{crawlResults.length} success)
            </h2>
            <div className="space-y-4">
              {crawlResults.map((result, i) => (
                <div key={i} className={`p-4 rounded-lg border ${result.error ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{result.url}</p>
                      {result.title && <p className="text-sm text-gray-500 mt-1">{result.title}</p>}
                      {result.error && <p className="text-sm text-red-600 mt-1">{result.error}</p>}
                      {!result.error && result.markdown && (
                        <p className="text-xs text-gray-400 mt-1">
                          {result.markdown.length} chars
                        </p>
                      )}
                    </div>
                    {result.error ? (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Failed</span>
                    ) : (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">OK</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clean Results */}
        {cleanResults.length > 0 && step !== 'preview' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              Clean Results ({cleanResults.filter(c => c.cleanedLength > 0).length}/{cleanResults.length} success)
            </h2>
            <div className="space-y-4">
              {cleanResults.map((result, i) => (
                <div key={i} className={`p-4 rounded-lg border ${result.cleanedLength === 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                  <p className="font-medium text-gray-900">{result.url}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {result.originalLength} → {result.cleanedLength} chars
                    {result.summary && <span className="ml-2">| Summary: {result.summary.substring(0, 50)}...</span>}
                  </p>
                  {result.keyPoints.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-600">Key Points:</p>
                      <ul className="text-xs text-gray-500 ml-4 list-disc">
                        {result.keyPoints.slice(0, 3).map((kp, j) => (
                          <li key={j}>{kp.substring(0, 100)}{kp.length > 100 ? '...' : ''}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Store Results */}
        {storeResults.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              Store Results ({storeResults.filter(s => s.success).length}/{storeResults.length} success)
            </h2>
            <div className="space-y-4">
              {storeResults.map((result, i) => (
                <div key={i} className={`p-4 rounded-lg border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{result.url}</p>
                      {result.success && <p className="text-xs text-gray-500 mt-1">ID: {result.id}</p>}
                      {result.error && <p className="text-sm text-red-600 mt-1">{result.error}</p>}
                    </div>
                    {result.success ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Stored</span>
                    ) : (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Failed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Done State */}
        {step === 'done' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-green-600 mb-2">Complete!</h2>
              <p className="text-gray-600 mb-4">
                Successfully stored {storeResults.filter(s => s.success).length} documents to{' '}
                <strong>{selectedCollection}</strong>
              </p>
              <button
                onClick={() => {
                  setStep('input');
                  setUrls('');
                  setCrawlResults([]);
                  setCleanResults([]);
                  setStoreResults([]);
                  setProgress({ crawled: 0, cleaned: 0, stored: 0 });
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Start New
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
