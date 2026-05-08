'use client';

import { useState } from 'react';

interface InsightSummary {
  text: string;
  source: string;
  recommendation: string;
  priority: 'High' | 'Medium' | 'Low';
}

interface InsightsResult {
  industryInsights: InsightSummary[];
  clientInsights: InsightSummary[];
  summaries?: InsightSummary[];
  sources?: string[];
  generatedAt?: string;
}

function splitInsight(text: string): { headline: string; body: string } {
  if (!text) return { headline: '', body: '' };
  const i = text.indexOf('. ');
  if (i === -1) return { headline: text, body: '' };
  return { headline: text.slice(0, i + 1), body: text.slice(i + 1).trim() };
}

const PRIORITY_COLORS = {
  High: 'bg-red-100 text-red-700 border-red-200',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200',
  Low: 'bg-green-100 text-green-700 border-green-200',
};

function InsightCard({ insight, type }: { insight: InsightSummary; type: 'industry' | 'client' }) {
  const text = insight?.text || '';
  if (!text) return null;
  
  const { headline, body } = splitInsight(text);

  return (
    <div className="rounded-xl p-5 flex flex-col gap-3 bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${type === 'industry' ? 'bg-green-500' : 'bg-blue-500'}`} />
        <span className="text-[10px] font-bold text-gray-400 uppercase">{type}</span>
        {insight.source && (
          <span className="ml-auto text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
            {insight.source}
          </span>
        )}
      </div>
      
      <div>
        <h4 className="text-sm font-bold text-gray-900 leading-snug">{headline || insight.text}</h4>
        {body && <p className="text-xs text-gray-500 leading-relaxed mt-1">{body}</p>}
      </div>
    </div>
  );
}

export default function TestInsightPage() {
  const [result, setResult] = useState<InsightsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/test-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: 'test-japfa', companyName: 'PT Japfa Comfeed Indonesia' }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate insights');
      }

      const data = await res.json();

      if (data.error && !data.industryInsights?.length) {
        throw new Error(data.message || data.error);
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-[#1e3a6e] px-6 py-5 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-1">
                InsightBank AI
              </p>
              <h3 className="text-base font-black text-white">
                Business & Industry Insights Test
              </h3>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white text-[#1e3a6e] font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="15 30" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Generate Insights
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && !loading && !error && (
          <div className="space-y-6">
            {/* Main Results */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* Industry Insights */}
              <div className="bg-gray-100 px-6 py-3 border-y border-gray-200">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-0.5">Industry Insights</p>
                <h4 className="text-sm font-bold text-gray-900">Market Signals & Trends</h4>
              </div>
              <div className="p-6 bg-white">
                <div className="grid grid-cols-2 gap-4">
                  {result.industryInsights.slice(0, 4).map((insight, i) => (
                    <InsightCard key={i} insight={insight} type="industry" />
                  ))}
                </div>
              </div>

              {/* Client Insights */}
              <div className="bg-gray-100 px-6 py-3 border-y border-gray-200">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-0.5">Client Insights</p>
                <h4 className="text-sm font-bold text-gray-900">JAPFA-Specific Opportunities</h4>
              </div>
              <div className="p-6 bg-white">
                <div className="grid grid-cols-2 gap-4">
                  {result.clientInsights.slice(0, 4).map((insight, i) => (
                    <InsightCard key={i} insight={insight} type="client" />
                  ))}
                </div>
              </div>

              {/* Sources */}
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex flex-wrap gap-2">
                <span className="text-[10px] font-medium text-gray-500 uppercase mr-2">Sources:</span>
                {result.sources?.length ? (
                  result.sources.map((source, i) => (
                    <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium border bg-white text-gray-600 border-gray-200">
                      {source}
                    </span>
                  ))
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium border bg-white text-gray-400 border-gray-200">
                    ChromaDB
                  </span>
                )}
              </div>
            </div>

            {/* Generated timestamp */}
            <div className="text-right">
              <p className="text-xs text-gray-400">
                Generated: {result.generatedAt ? new Date(result.generatedAt).toLocaleString('id-ID') : new Date().toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!result && !loading && !error && (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <p className="text-gray-500 mb-4">
              Click "Generate Insights" to test the InsightService API
            </p>
            <p className="text-xs text-gray-400">
              This will query ChromaDB and generate Industry & Client insights using GPT-4o-mini
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Using endpoint: <code className="bg-gray-100 px-1 rounded">/api/test-insights</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}