'use client';

import { useState, useEffect } from 'react';

interface Company {
  id: string;
  companyName: string;
  industries: string;
  crawlResults?: CrawlResult[];
}

interface CrawlResult {
  id: string;
  companyId: string;
  url: string;
  title: string;
  content?: string;
  createdAt: string;
}

interface QueryResult {
  id: string;
  content: string;
  distance: number;
  metadata?: Record<string, string>;
  crawlResult?: CrawlResult;
}

interface BOLRecord {
  id: string;
  bolNumber: string;
  arrivalDate: string | Date;
  supplier: string | null;
  supplierConfirmed: boolean;
  productShort: string;
  grossWeightKgs: number;
  containerCount: number;
  portOfDischarge: string | null;
  vesselCarrier: string;
  refURL: string | null;
}

const COLLECTIONS = [
  { name: 'scrawling-data', label: 'Scrawling Data' },
  { name: 'JapfaAnnualReport2025', label: 'Japfa Annual Report 2025' },
];

export default function TestVectorPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [query, setQuery] = useState('');
  const [queryResults, setQueryResults] = useState<QueryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'companies' | 'query' | 'chunks' | 'bolrecords'>('companies');
  const [chunks, setChunks] = useState<QueryResult[]>([]);
  const [selectedCollection, setSelectedCollection] = useState('scrawling-data');
  const [chunksCollection, setChunksCollection] = useState('scrawling-data');
  const [chunksLimit, setChunksLimit] = useState(50);
  const [bolRecords, setBolRecords] = useState<BOLRecord[]>([]);

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/companies');
      const data = await response.json();
      if (data.success) {
        setCompanies(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (companyName: string, industries: string) => {
    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, industries }),
      });

      const data = await response.json();
      if (data.success) {
        fetchCompanies();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    }
  };

  const fetchChunks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/vector/list?collection=${encodeURIComponent(chunksCollection)}&limit=${chunksLimit}`);
      const data = await response.json();
      if (data.success) {
        setChunks(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chunks');
    } finally {
      setLoading(false);
    }
  };

  const fetchBolRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/bol-records');
      const data = await response.json();
      if (data.success) {
        setBolRecords(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch BoL records');
    } finally {
      setLoading(false);
    }
  };

  const handleQueryWithCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/vector/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, collectionName: selectedCollection, topK: 10 }),
      });

      const data = await response.json();
      if (data.success) {
        setQueryResults(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa] p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-[#1a2436] mb-6">Vector DB - Search & Query</h1>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setTab('companies')}
            className={`px-4 py-2 rounded-lg ${
              tab === 'companies'
                ? 'bg-[#1a2436] text-white'
                : 'bg-white text-gray-700 border'
            }`}
          >
            Companies
          </button>
          <button
            onClick={() => setTab('query')}
            className={`px-4 py-2 rounded-lg ${
              tab === 'query'
                ? 'bg-[#1a2436] text-white'
                : 'bg-white text-gray-700 border'
            }`}
          >
            Vector Query
          </button>
          <button
            onClick={() => setTab('chunks')}
            className={`px-4 py-2 rounded-lg ${
              tab === 'chunks'
                ? 'bg-[#1a2436] text-white'
                : 'bg-white text-gray-700 border'
            }`}
          >
            View Chunks
          </button>
          <button
            onClick={() => setTab('bolrecords')}
            className={`px-4 py-2 rounded-lg ${
              tab === 'bolrecords'
                ? 'bg-[#1a2436] text-white'
                : 'bg-white text-gray-700 border'
            }`}
          >
            BoL Records
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>
        )}

        {tab === 'companies' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Companies</h2>
              <button
                onClick={fetchCompanies}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {companies.length > 0 ? (
              <div className="grid gap-4">
                {companies.map((company) => (
                  <div
                    key={company.id}
                    className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      selectedCompany?.id === company.id ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedCompany(company)}
                  >
                    <h3 className="font-medium text-lg">{company.companyName}</h3>
                    <p className="text-sm text-gray-500">{company.industries}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {company.crawlResults?.length || 0} crawl results
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No companies found. Click Refresh to load.
              </p>
            )}

            {selectedCompany && selectedCompany.crawlResults && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-3">Crawl Results for {selectedCompany.companyName}</h3>
                <div className="space-y-3">
                  {selectedCompany.crawlResults.map((cr) => (
                    <div key={cr.id} className="p-3 bg-white border rounded">
                      <a
                        href={cr.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {cr.title}
                      </a>
                      <p className="text-xs text-gray-500 mt-1">{cr.url}</p>
                      {cr.content && (
                        <p className="text-sm text-gray-700 mt-2 line-clamp-3">
                          {cr.content.substring(0, 200)}...
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'query' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Search Vector DB</h2>
              <div className="flex gap-3 mb-4">
                <select
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {COLLECTIONS.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <form onSubmit={handleQueryWithCollection} className="flex gap-3">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter search query..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-[#1a2436] text-white rounded-lg hover:bg-[#2a3446] disabled:opacity-50"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </form>
            </div>

            {queryResults.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Results ({queryResults.length})
                </h2>
                <div className="space-y-4">
                  {queryResults.map((result, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {result.metadata?.url ? (
                            <>
                              <h3 className="font-medium text-blue-600">
                                {result.metadata.url}
                              </h3>
                              {result.metadata.summary && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Summary: {result.metadata.summary}
                                </p>
                              )}
                              <p className="text-sm text-gray-700 mt-2">
                                {result.content.substring(0, 300)}...
                              </p>
                            </>
                          ) : result.crawlResult ? (
                            <>
                              <h3 className="font-medium text-blue-600">
                                {result.crawlResult.title}
                              </h3>
                              <p className="text-xs text-gray-500 mt-1">
                                {result.crawlResult.url}
                              </p>
                              {result.crawlResult.content && (
                                <p className="text-sm text-gray-700 mt-2">
                                  {result.crawlResult.content.substring(0, 300)}...
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-sm text-gray-500">
                              ID: {result.id}
                            </p>
                          )}
                        </div>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          Distance: {result.distance.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'chunks' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">View All Chunks</h2>
              <div className="flex gap-3 mb-4">
                <select
                  value={chunksCollection}
                  onChange={(e) => setChunksCollection(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {COLLECTIONS.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={chunksLimit}
                  onChange={(e) => setChunksLimit(parseInt(e.target.value) || 50)}
                  placeholder="Limit"
                  className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={fetchChunks}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Fetch Chunks'}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
            )}

            {chunks.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Chunks ({chunks.length}) in {chunksCollection}
                </h2>
                <div className="space-y-4">
                  {chunks.map((chunk, index) => (
                    <details key={index} className="border border-gray-200 rounded-lg p-4">
                      <summary className="cursor-pointer font-medium">
                        <span className="text-blue-600">{chunk.id}</span>
                        {chunk.metadata?.chunkIndex !== undefined && (
                          <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                            Chunk {parseInt(chunk.metadata.chunkIndex) + 1} of {chunk.metadata.totalChunks}
                          </span>
                        )}
                      </summary>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        {chunk.metadata && Object.keys(chunk.metadata).length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-gray-600 mb-1">Metadata:</p>
                            <div className="bg-gray-50 p-2 rounded text-xs font-mono overflow-auto max-h-32">
                              <pre>{JSON.stringify(chunk.metadata, null, 2)}</pre>
                            </div>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-1">Content ({chunk.content.length} chars):</p>
                          <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-64 whitespace-pre-wrap">
                            {chunk.content}
                          </pre>
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'bolrecords' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">BOL Records</h2>
              <button
                onClick={fetchBolRecords}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {bolRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200">
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">#</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">BoL Number</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Arrival Date</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Supplier</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Supplier Confirmed</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Product Short</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">Gross Weight (KGs)</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">Container Count</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Port of Discharge</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Vessel Carrier</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">refURL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bolRecords.map((record, index) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2 text-gray-400">{index + 1}</td>
                        <td className="px-3 py-2">
                          {record.refURL ? (
                            <a
                              href={record.refURL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline font-mono"
                            >
                              {record.bolNumber}
                            </a>
                          ) : (
                            <span className="font-mono">{record.bolNumber}</span>
                          )}
                        </td>
                        <td className="px-3 py-2">{record.arrivalDate ? new Date(record.arrivalDate).toLocaleDateString('en-CA') : '-'}</td>
                        <td className="px-3 py-2">{record.supplier || '-'}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            record.supplierConfirmed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {record.supplierConfirmed ? 'Confirmed' : 'Unconfirmed'}
                          </span>
                        </td>
                        <td className="px-3 py-2">{record.productShort}</td>
                        <td className="px-3 py-2 text-right font-semibold">{record.grossWeightKgs?.toLocaleString() || '-'}</td>
                        <td className="px-3 py-2 text-right">{record.containerCount}</td>
                        <td className="px-3 py-2">{record.portOfDischarge || '-'}</td>
                        <td className="px-3 py-2">{record.vesselCarrier || '-'}</td>
                        <td className="px-3 py-2">
                          {record.refURL ? (
                            <a
                              href={record.refURL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700 text-[10px] underline break-all"
                            >
                              Open Link
                            </a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No BoL records found. Click Refresh to load.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}