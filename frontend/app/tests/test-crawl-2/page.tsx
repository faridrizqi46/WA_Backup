'use client';

import { useState } from 'react';
import { TableExtractor, ExtractedTable, ValueChainNode } from '@/services/DataIngestionService';
import { BolRecordMapper } from '@/services/BolRecordMapper';

interface CrawlResult {
  html?: string;
  markdown?: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

interface SankeyData {
  section: string;
  links: string[];
  sourceUrl?: string;
}

interface ValueChainResult {
  company: string;
  tier1: ValueChainNode[];
}

type Tab = 'extract' | 'bol-db' | 'value-chain';

export default function TestCrawl2Page() {
  const [urls, setUrls] = useState('');
  const [tables, setTables] = useState<ExtractedTable[]>([]);
  const [sankeyData, setSankeyData] = useState<SankeyData[]>([]);
  const [valueChain, setValueChain] = useState<ValueChainResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('extract');
  const [bolRecords, setBolRecords] = useState<any[]>([]);
  const [bolLoading, setBolLoading] = useState(false);
  const [bolMessage, setBolMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedTradeIntelligenceId, setSelectedTradeIntelligenceId] = useState('eec0a7c9-5d90-44b7-8892-a01e54c68613');
  const [valueChainNodes, setValueChainNodes] = useState<any[]>([]);
  const [valueChainLoading, setValueChainLoading] = useState(false);
  const [valueChainMessage, setValueChainMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [valueChainAccountId, setValueChainAccountId] = useState('996d571d-5677-4b6f-a5fa-3d84755e70c7');

  const bolTables = TableExtractor.filterBolTables(tables);
  const associationsTables = TableExtractor.filterAssociationsTables(tables);

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urls.trim()) return;

    const urlList = urls.split('\n').filter((u) => u.trim());
    if (urlList.length === 0) return;

    setLoading(true);
    setError(null);
    setTables([]);
    setSankeyData([]);
    setValueChain(null);

    const allTables: ExtractedTable[] = [];
    const allSankeyData: SankeyData[] = [];

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

        const data: CrawlResult = await response.json();

        if (data.error) {
          setError(`Error crawling ${trimmedUrl}: ${data.error}`);
          continue;
        }

        const extractedTables = TableExtractor.extractTablesFromHtml(data.html || '', trimmedUrl);
        allTables.push(...extractedTables);
        setTables([...allTables]);

        const sankeySection = TableExtractor.extractSankeySection(data.markdown || '');
        if (sankeySection) {
          const links = TableExtractor.extractSankeyLinks(sankeySection);
          allSankeyData.push({ section: sankeySection, links, sourceUrl: trimmedUrl });
          setSankeyData([...allSankeyData]);
        }
      } catch (err) {
        setError(`Failed to crawl ${trimmedUrl}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    if (allSankeyData.length > 0 && allTables.length > 0) {
      const associationsTable = TableExtractor.filterAssociationsTables(allTables)[0] || null;
      const allLinks = allSankeyData.flatMap(s => s.links);
      const chain = TableExtractor.buildValueChain(allLinks, associationsTable);
      setValueChain(chain);

      console.log('[DEBUG] Associations Table:', associationsTable);
      console.log('[DEBUG] Associations Headers:', associationsTable?.headers);
      console.log('[DEBUG] Associations Rows:', associationsTable?.rows);
      console.log('[DEBUG] Extracted Tier1 Companies:', associationsTable ? TableExtractor.extractCompanyNamesFromAssociations(associationsTable) : []);
      console.log('[DEBUG] Sankey Links:', allLinks);
    }

    setLoading(false);
    setCurrentUrl(null);
  };

  const tablesToMarkdown = (table: ExtractedTable): string => {
    if (table.headers.length === 0 && table.rows.length === 0) {
      return '';
    }

    const lines: string[] = [];

    if (table.title) {
      lines.push(`<!-- ${table.title} -->`);
    }

    if (table.headers.length > 0) {
      lines.push('| ' + table.headers.join(' | ') + ' |');
      lines.push('| ' + table.headers.map(() => '---').join(' | ') + ' |');
    }

    for (const row of table.rows) {
      lines.push('| ' + row.join(' | ') + ' |');
    }

    return lines.join('\n');
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa] p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-[#1a2436] mb-6">Extract Tables from HTML</h1>

        <div className="flex gap-2 mb-6 border-b border-gray-300">
          <button
            onClick={() => setActiveTab('extract')}
            className={`px-4 py-2 font-medium rounded-t-lg ${
              activeTab === 'extract'
                ? 'bg-white border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Extract Tables
          </button>
          <button
            onClick={() => setActiveTab('bol-db')}
            className={`px-4 py-2 font-medium rounded-t-lg ${
              activeTab === 'bol-db'
                ? 'bg-white border-b-2 border-green-500 text-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            BOL Records (DB)
          </button>
          <button
            onClick={() => setActiveTab('value-chain')}
            className={`px-4 py-2 font-medium rounded-t-lg ${
              activeTab === 'value-chain'
                ? 'bg-white border-b-2 border-orange-500 text-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Value Chain (DB)
          </button>
        </div>

        {activeTab === 'extract' && (
          <div>
            <form onSubmit={handleExtract} className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter URLs (one per line)
              </label>
              <textarea
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                placeholder="https://example.com/article1\nhttps://example.com/article2"
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-[#1a2436] text-white rounded-lg hover:bg-[#2a3446] disabled:opacity-50"
              >
                {loading ? 'Extracting...' : 'Extract Tables'}
              </button>
            </form>

            {loading && currentUrl && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg text-blue-700">
                Currently processing: {currentUrl}
              </div>
            )}

            {error && (
              <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">{error}</div>
            )}

            <div className="mb-4 p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600">
                Total tables extracted: <strong>{tables.length}</strong>
                {bolTables.length > 0 && (
                  <span className="ml-4 text-green-700">
                    BOL/Bill of Lading tables: <strong>{bolTables.length}</strong>
                  </span>
                )}
                {associationsTables.length > 0 && (
                  <span className="ml-4 text-blue-700">
                    Associations tables: <strong>{associationsTables.length}</strong>
                  </span>
                )}
                {sankeyData.length > 0 && (
                  <span className="ml-4 text-purple-700">
                    Sankey Diagrams: <strong>{sankeyData.length}</strong>
                  </span>
                )}
              </p>
            </div>

            {valueChain && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-[#1a2436] mb-4">Value Chain Hierarchy</h2>
                <div className="bg-white p-4 rounded-lg shadow border-2 border-orange-500">
                  <div className="mb-4 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-gray-500">Main Company:</span>
                      <p className="font-bold text-lg text-[#1a2436]">{valueChain.company}</p>
                    </div>
                    <div className="text-right">
                      <label className="block text-xs text-gray-500 mb-1">Account ID for Insert:</label>
                      <input
                        type="text"
                        value={valueChainAccountId}
                        onChange={(e) => setValueChainAccountId(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-mono w-80"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={async () => {
                        if (!valueChain) return;
                        setLoading(true);
                        try {
                          const nodes: { company: string; parentCompany?: string | null; segment: string; clientType: string; tier: number }[] = [];
                          valueChain.tier1.forEach(t1 => {
                            nodes.push({
                              company: t1.company,
                              segment: 'Corporate',
                              clientType: 'Supplier',
                              tier: 1,
                            });
                            if (t1.tier2 && t1.tier2.length > 0) {
                              t1.tier2.forEach(t2 => {
                                nodes.push({
                                  company: t2.company,
                                  parentCompany: t1.company,
                                  segment: 'Corporate',
                                  clientType: 'Supplier',
                                  tier: 2,
                                });
                              });
                            }
                          });
                          const response = await fetch('/api/value-chain', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              accountId: valueChainAccountId,
                              nodes,
                            }),
                          });
                          const result = await response.json();
                          if (!response.ok) throw new Error(result.error);
                          alert(`Inserted ${nodes.length} value chain nodes to database`);
                        } catch (err) {
                          alert(err instanceof Error ? err.message : 'Failed to insert');
                        }
                        setLoading(false);
                      }}
                      disabled={loading}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                    >
                      {loading ? 'Inserting...' : 'Insert All to DB'}
                    </button>
                  </div>
                </div>

                <div className="space-y-4 mt-4">
                  {valueChain.tier1.map((tier1, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">Tier 1</span>
                        <span className="font-medium text-[#1a2436]">{tier1.company}</span>
                      </div>
                      {tier1.tier2 && tier1.tier2.length > 0 && (
                        <div className="ml-6 space-y-1">
                          <span className="text-xs text-gray-500">Tier 2:</span>
                          <div className="flex flex-wrap gap-2">
                            {tier1.tier2.map((tier2, tier2Index) => (
                              <span
                                key={tier2Index}
                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                              >
                                {tier2.company}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">JSON:</p>
                  <pre className="text-xs overflow-auto max-h-48 whitespace-pre-wrap bg-white p-2 rounded border">
                    {JSON.stringify(valueChain, null, 2)}
                  </pre>
                </div>
              </div>
            )}

        {sankeyData.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-[#1a2436] mb-4">Sankey Diagram Data</h2>
                <div className="space-y-6">
                  {sankeyData.map((sankey, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg shadow border-2 border-purple-500">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-[#1a2436]">
                          Sankey Links {index + 1}
                          {sankey.sourceUrl && (
                            <span className="text-xs text-gray-500 ml-2">
                              - {sankey.sourceUrl}
                            </span>
                          )}
                        </h3>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(sankey.links.join('\n'));
                          }}
                          className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                        >
                          Copy Links
                        </button>
                      </div>
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-2">Extracted Links ({sankey.links.length}):</p>
                        <div className="flex flex-wrap gap-2">
                          {sankey.links.map((link, linkIndex) => (
                            <span
                              key={linkIndex}
                              className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded"
                            >
                              {link}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Raw Section:</p>
                        <pre className="text-xs overflow-auto max-h-48 whitespace-pre-wrap bg-white p-2 rounded border">
                          {sankey.section}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bolTables.length > 0 && (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-[#1a2436]">BOL / Bill of Lading Tables</h2>
                  <button
                    onClick={async () => {
                      console.log('Insert BOL clicked', { bolTablesLength: bolTables.length, selectedTradeIntelligenceId: selectedTradeIntelligenceId });
                      if (!selectedTradeIntelligenceId.trim()) {
                        setBolMessage({ type: 'error', text: 'Please enter Trade Intelligence ID above' });
                        return;
                      }
                      setBolLoading(true);
                      setBolMessage(null);
                      try {
                        const records: any[] = [];
                        for (const table of bolTables) {
                          const mapped = BolRecordMapper.extractBolRecordsFromTable(table);
                          console.log('mapped records:', mapped);
                          for (const rec of mapped) {
                            if (rec.arrivalDate && rec.bolNumber) {
                              records.push({
                                tradeIntelligenceId: selectedTradeIntelligenceId.trim(),
                                arrivalDate: new Date(rec.arrivalDate as string).toISOString(),
                                bolNumber: rec.bolNumber || '',
                                containerCount: rec.containerCount || 0,
                                grossWeightKgs: rec.grossWeightKgs || 0,
                                portOfDischarge: rec.portOfDischarge || '',
                                productShort: rec.productShort || '',
                                supplier: rec.supplier || '',
                                supplierConfirmed: !!(rec.supplier && rec.supplier.trim() !== ''),
                                vesselCarrier: rec.vesselCarrier || '',
                              });
                            }
                          }
                        }
                        if (records.length > 0) {
                          const response = await fetch('/api/bol', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              tradeIntelligenceId: selectedTradeIntelligenceId.trim(),
                              records,
                            }),
                          });
                          const result = await response.json();
                          if (!response.ok) throw new Error(result.error);
                          setBolMessage({ type: 'success', text: `Inserted ${records.length} BOL records to database` });
                          setBolRecords([]);
                        } else {
                          setBolMessage({ type: 'error', text: 'No valid BOL records to insert' });
                        }
                      } catch (err) {
                        setBolMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to insert' });
                      }
                      setBolLoading(false);
                    }}
                    disabled={bolLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {bolLoading ? 'Inserting...' : 'Insert All BOL to DB'}
                  </button>
                </div>
                <div className="space-y-6">
                  {bolTables.map((table, index) => (
                    <div key={`bol-${index}`} className="bg-white p-4 rounded-lg shadow border-2 border-green-500">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-[#1a2436]">
                          {table.title ? table.title : `BOL Table ${index + 1}`}
                          {table.sourceUrl && (
                            <span className="text-xs text-gray-500 ml-2">
                              - {table.sourceUrl}
                            </span>
                          )}
                        </h3>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(tablesToMarkdown(table));
                          }}
                          className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                        >
                          Copy Markdown
                        </button>
                      </div>

                      {table.headers.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full border border-gray-300 text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                {table.headers.map((header, i) => (
                                  <th
                                    key={i}
                                    className="px-4 py-2 border border-gray-300 text-left font-semibold"
                                  >
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {table.rows.map((row, rowIndex) => (
                                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  {row.map((cell, cellIndex) => (
                                    <td
                                      key={cellIndex}
                                      className="px-4 py-2 border border-gray-300"
                                    >
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No headers found</p>
                      )}

                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Markdown:</p>
                        <pre className="text-xs overflow-auto max-h-32 whitespace-pre-wrap bg-white p-2 rounded border">
                          {tablesToMarkdown(table)}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {associationsTables.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-[#1a2436] mb-4">Associations Tables</h2>
                <div className="space-y-6">
                  {associationsTables.map((table, index) => (
                    <div key={`assoc-${index}`} className="bg-white p-4 rounded-lg shadow border-2 border-blue-500">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-[#1a2436]">
                          {table.title ? table.title : `Associations Table ${index + 1}`}
                          {table.sourceUrl && (
                            <span className="text-xs text-gray-500 ml-2">
                              - {table.sourceUrl}
                            </span>
                          )}
                        </h3>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(tablesToMarkdown(table));
                          }}
                          className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                        >
                          Copy Markdown
                        </button>
                      </div>

                      {table.headers.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full border border-gray-300 text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                {table.headers.map((header, i) => (
                                  <th
                                    key={i}
                                    className="px-4 py-2 border border-gray-300 text-left font-semibold"
                                  >
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {table.rows.map((row, rowIndex) => (
                                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  {row.map((cell, cellIndex) => (
                                    <td
                                      key={cellIndex}
                                      className="px-4 py-2 border border-gray-300"
                                    >
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No headers found</p>
                      )}

                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Markdown:</p>
                        <pre className="text-xs overflow-auto max-h-32 whitespace-pre-wrap bg-white p-2 rounded border">
                          {tablesToMarkdown(table)}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h2 className="text-xl font-bold text-[#1a2436] mb-4">
              All Extracted Tables ({tables.length})
            </h2>
            {tables.length > 0 && (
              <div className="space-y-6">
                {tables.map((table, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-[#1a2436]">
                        {table.title ? table.title : `Table ${index + 1}`}
                        {table.sourceUrl && (
                          <span className="text-xs text-gray-500 ml-2">
                            - {table.sourceUrl}
                          </span>
                        )}
                      </h3>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(tablesToMarkdown(table));
                        }}
                        className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        Copy Markdown
                      </button>
                    </div>

                    {table.headers.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full border border-gray-300 text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              {table.headers.map((header, i) => (
                                <th
                                  key={i}
                                  className="px-4 py-2 border border-gray-300 text-left font-semibold"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {table.rows.map((row, rowIndex) => (
                              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                {row.map((cell, cellIndex) => (
                                  <td
                                    key={cellIndex}
                                    className="px-4 py-2 border border-gray-300"
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No headers found</p>
                    )}

                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Markdown:</p>
                      <pre className="text-xs overflow-auto max-h-32 whitespace-pre-wrap bg-white p-2 rounded border">
                        {tablesToMarkdown(table)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && tables.length === 0 && !error && (
              <p className="text-gray-500 text-center py-8">
                Enter URLs above to extract tables from their HTML content
              </p>
            )}
          </div>
        )}

        {activeTab === 'bol-db' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-[#1a2436] mb-4">BOL Records in Database</h2>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Trade Intelligence ID:</strong>
              </p>
              <input
                type="text"
                value={selectedTradeIntelligenceId}
                onChange={(e) => setSelectedTradeIntelligenceId(e.target.value)}
                placeholder="eec0a7c9-5d90-44b7-8892-a01e54c68613"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="mb-4 flex gap-4 items-end">
              <button
                onClick={async () => {
                  if (!selectedTradeIntelligenceId.trim()) return;
                  setBolLoading(true);
                  setBolMessage(null);
                  try {
                    const response = await fetch(`/api/bol?tradeIntelligenceId=${encodeURIComponent(selectedTradeIntelligenceId.trim())}`);
                    const records = await response.json();
                    if (!response.ok) throw new Error(records.error);
                    setBolRecords(records);
                    setBolMessage({ type: 'success', text: `Found ${records.length} BOL records` });
                  } catch (err) {
                    setBolMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to fetch' });
                  }
                  setBolLoading(false);
                }}
                disabled={bolLoading || !selectedTradeIntelligenceId.trim()}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {bolLoading ? 'Loading...' : 'Load Records'}
              </button>
              <button
                onClick={async () => {
                  if (!selectedTradeIntelligenceId.trim()) return;
                  if (!confirm('Are you sure you want to delete all BOL records for this Trade Intelligence ID?')) return;
                  setBolLoading(true);
                  setBolMessage(null);
                  try {
                    const response = await fetch(`/api/bol?tradeIntelligenceId=${encodeURIComponent(selectedTradeIntelligenceId.trim())}`, {
                      method: 'DELETE',
                    });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.error);
                    setBolRecords([]);
                    setBolMessage({ type: 'success', text: `Deleted ${result.count} BOL records` });
                  } catch (err) {
                    setBolMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete' });
                  }
                  setBolLoading(false);
                }}
                disabled={bolLoading || !selectedTradeIntelligenceId.trim()}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {bolLoading ? 'Deleting...' : 'Clear Data'}
              </button>
            </div>

            {bolMessage && (
              <div className={`mb-4 p-3 rounded-lg ${bolMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {bolMessage.text}
              </div>
            )}

            {bolRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 border border-gray-300 text-left font-semibold">Bol Number</th>
                      <th className="px-4 py-2 border border-gray-300 text-left font-semibold">Supplier</th>
                      <th className="px-4 py-2 border border-gray-300 text-left font-semibold">Arrival Date</th>
                      <th className="px-4 py-2 border border-gray-300 text-left font-semibold">Product</th>
                      <th className="px-4 py-2 border border-gray-300 text-left font-semibold">Container</th>
                      <th className="px-4 py-2 border border-gray-300 text-left font-semibold">Weight (Kgs)</th>
                      <th className="px-4 py-2 border border-gray-300 text-left font-semibold">Vessel</th>
                      <th className="px-4 py-2 border border-gray-300 text-left font-semibold">Port</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bolRecords.map((record) => (
                      <tr key={record.id} className="border-b border-gray-200">
                        <td className="px-4 py-2">{record.bolNumber}</td>
                        <td className="px-4 py-2">{record.supplier}</td>
                        <td className="px-4 py-2">{new Date(record.arrivalDate).toLocaleDateString()}</td>
                        <td className="px-4 py-2">{record.productShort}</td>
                        <td className="px-4 py-2 text-center">{record.containerCount}</td>
                        <td className="px-4 py-2 text-right">{record.grossWeightKgs.toLocaleString()}</td>
                        <td className="px-4 py-2">{record.vesselCarrier}</td>
                        <td className="px-4 py-2">{record.portOfDischarge}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Enter Trade Intelligence ID and click Load Records to view BOL data
              </p>
            )}
          </div>
        )}

        {activeTab === 'value-chain' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-[#1a2436] mb-4">Value Chain Nodes in Database</h2>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Account ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={valueChainAccountId}
                  onChange={(e) => setValueChainAccountId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  placeholder="Enter account ID"
                />
              </div>
            </div>

            <div className="mb-4 flex gap-4 items-end">
              <button
                onClick={async () => {
                  setValueChainLoading(true);
                  setValueChainMessage(null);
                  try {
                    const response = await fetch(`/api/value-chain?accountId=${encodeURIComponent(valueChainAccountId)}&clientType=Supplier`);
                    const nodes = await response.json();
                    if (!response.ok) throw new Error(nodes.error);
                    setValueChainNodes(nodes);
                    setValueChainMessage({ type: 'success', text: `Found ${nodes.length} value chain nodes` });
                  } catch (err) {
                    setValueChainMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to fetch' });
                  }
                  setValueChainLoading(false);
                }}
                disabled={valueChainLoading}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {valueChainLoading ? 'Loading...' : 'Load Nodes'}
              </button>
              <button
                onClick={async () => {
                  if (!confirm('Delete all Supplier nodes (tier 1) for this account?')) return;
                  setValueChainLoading(true);
                  setValueChainMessage(null);
                  try {
                    const response = await fetch(`/api/value-chain?accountId=${encodeURIComponent(valueChainAccountId)}&clientType=Supplier`, {
                      method: 'DELETE',
                    });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.error);
                    setValueChainNodes(prev => prev.filter(n => n.clientType !== 'Supplier'));
                    setValueChainMessage({ type: 'success', text: `Deleted ${result.count} Supplier nodes` });
                  } catch (err) {
                    setValueChainMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete' });
                  }
                  setValueChainLoading(false);
                }}
                disabled={valueChainLoading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {valueChainLoading ? 'Deleting...' : 'Clear Supplier Nodes'}
              </button>
            </div>

            {valueChainMessage && (
              <div className={`mb-4 p-3 rounded-lg ${valueChainMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {valueChainMessage.text}
              </div>
            )}

            {valueChainNodes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 border border-gray-300 text-left font-semibold">Company</th>
                      <th className="px-4 py-2 border border-gray-300 text-left font-semibold">Tier</th>
                      <th className="px-4 py-2 border border-gray-300 text-left font-semibold">Segment</th>
                      <th className="px-4 py-2 border border-gray-300 text-left font-semibold">Client Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {valueChainNodes.map((node, index) => (
                      <tr key={node.id || index} className="border-b border-gray-200">
                        <td className="px-4 py-2">{node.company}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            node.tier === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            Tier {node.tier}
                          </span>
                        </td>
                        <td className="px-4 py-2">{node.segment}</td>
                        <td className="px-4 py-2">{node.clientType}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Click Load Nodes to view value chain data
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}