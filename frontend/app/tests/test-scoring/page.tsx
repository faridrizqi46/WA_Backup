'use client';

import { useState } from 'react';

interface FeatureScore {
  name: string;
  score: number;
  evidence?: string;
  sources?: string[];
}

interface ParameterRecommendation {
  parameter: string;
  recommended: boolean;
  confidenceScore: number;
  features: FeatureScore[];
  summary: string;
}

interface CompanyRecommendation {
  company: string;
  recommendations: ParameterRecommendation[];
  overallSummary: string;
}

const PARAMETER_LABELS: Record<string, string> = {
  LC: 'Letter of Credit',
  SCF: 'Supply Chain Finance',
};

function getConfidenceColor(score: number): string {
  if (score >= 70) return 'bg-green-100 text-green-700';
  if (score >= 50) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

function getBarColor(score: number): string {
  if (score >= 70) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

function formatFeatureName(name: string): string {
  return name.replace(/([A-Z])/g, ' $1').trim();
}

export default function TestScoringPage() {
  const [company, setCompany] = useState('PT Japfa Comfeed Indonesia TBK');
  const [parameters, setParameters] = useState(['LC', 'SCF']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompanyRecommendation | null>(null);
  const [openParam, setOpenParam] = useState<string | null>(null);
  const [openFeature, setOpenFeature] = useState<string | null>(null);
  const [openaiStatus, setOpenaiStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');
  const [openaiMessage, setOpenaiMessage] = useState('');
  const [mlStatus, setMlStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');
  const [mlMessage, setMlMessage] = useState('');

  const toggleParam = (param: string) => {
    setParameters(prev =>
      prev.includes(param) ? prev.filter(p => p !== param) : [...prev, param]
    );
  };

  const handleRun = async () => {
    if (!company.trim()) {
      setError('Company name is required');
      return;
    }
    if (parameters.length === 0) {
      setError('Select at least one parameter');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, parameters }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run recommendation');
    } finally {
      setLoading(false);
    }
  };

  const checkOpenAI = async () => {
    setOpenaiStatus('checking');
    setOpenaiMessage('');
    try {
      const response = await fetch('/api/health/openai');
      const data = await response.json();
      if (data.status === 'ok') {
        setOpenaiStatus('ok');
        setOpenaiMessage(data.message);
      } else {
        setOpenaiStatus('error');
        setOpenaiMessage(data.message);
      }
    } catch (err) {
      setOpenaiStatus('error');
      setOpenaiMessage('Failed to check OpenAI');
    }
  };

  const checkML = async () => {
    setMlStatus('checking');
    setMlMessage('');
    try {
      const response = await fetch('/api/health/ml');
      const data = await response.json();
      if (data.status === 'ok') {
        setMlStatus('ok');
        setMlMessage(`${data.message} (models: ${(data.loadedModels || []).join(', ')})`);
      } else {
        setMlStatus('error');
        setMlMessage(data.message);
      }
    } catch (err) {
      setMlStatus('error');
      setMlMessage('Failed to check ML service');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 mb-6 rounded-lg shadow-sm">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
            ML Product Recommendation
          </span>
          <h1 className="text-xl font-bold text-gray-900 mt-1">
            Product Scoring Test — XAI Scoring Style
          </h1>
        </div>

        {/* ── Input Form ──────────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter company name..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                Parameters
              </label>
              <div className="flex gap-4">
                {['LC', 'SCF'].map(param => (
                  <label key={param} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={parameters.includes(param)}
                      onChange={() => toggleParam(param)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {PARAMETER_LABELS[param]} ({param})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleRun}
              disabled={loading}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Running...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Run Recommendation
                </span>
              )}
            </button>

            {/* ── Health Check Buttons ──────────────────────────────────────── */}
            <div className="flex gap-3">
              <button
                onClick={checkOpenAI}
                disabled={openaiStatus === 'checking'}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                  openaiStatus === 'checking'
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : openaiStatus === 'ok'
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : openaiStatus === 'error'
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                {openaiStatus === 'checking' ? 'Checking OpenAI...' : 'Check OpenAI API'}
              </button>

              <button
                onClick={checkML}
                disabled={mlStatus === 'checking'}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                  mlStatus === 'checking'
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : mlStatus === 'ok'
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : mlStatus === 'error'
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                {mlStatus === 'checking' ? 'Checking ML Service...' : 'Check ML Service'}
              </button>
            </div>

            {/* ── Status Messages ──────────────────────────────────────────── */}
            {(openaiStatus !== 'idle' || mlStatus !== 'idle') && (
              <div className="flex gap-4">
                {openaiStatus !== 'idle' && (
                  <div className={`flex-1 p-3 rounded-lg text-xs ${
                    openaiStatus === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    <span className="font-semibold">OpenAI:</span> {openaiMessage}
                  </div>
                )}
                {mlStatus !== 'idle' && (
                  <div className={`flex-1 p-3 rounded-lg text-xs ${
                    mlStatus === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    <span className="font-semibold">ML Service:</span> {mlMessage}
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* ── Results ─────────────────────────────────────────────────────── */}
        {result && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">

            {/* Overall Summary */}
            <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 rounded-t-lg">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                Overall Result
              </span>
              <p className="text-sm text-gray-800 mt-1 font-medium">{result.overallSummary}</p>
            </div>

            {/* Recommendations per Parameter */}
            <div className="divide-y divide-gray-100">
              {result.recommendations.map((rec, idx) => {
                const isOpen = openParam === rec.parameter;
                const confColor = getConfidenceColor(rec.confidenceScore * 100);
                const scoreColor = getBarColor(rec.confidenceScore * 100);
                const scorePercent = Math.round(rec.confidenceScore * 100);

                return (
                  <div key={idx}>
                    {/* Parameter Header */}
                    <button
                      onClick={() => setOpenParam(isOpen ? null : rec.parameter)}
                      className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <span className="flex-shrink-0 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white">
                        {rec.parameter}
                      </span>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1.5">
                          <span className="text-lg font-black text-gray-900">
                            {scorePercent}%
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${confColor}`}>
                            {rec.recommended ? 'Recommended' : 'Not Recommended'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-2 rounded-full transition-all duration-500"
                            style={{ width: `${scorePercent}%`, backgroundColor: scoreColor }}
                          />
                        </div>
                      </div>

                      <span className="text-xs text-gray-500 font-medium">
                        {PARAMETER_LABELS[rec.parameter]}
                      </span>

                      <svg
                        className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Expanded Content */}
                    {isOpen && (
                      <div className="px-6 pb-5 bg-gray-50 border-t border-gray-100">

                        {/* Summary */}
                        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                            AI Summary
                          </p>
                          <p className="text-sm text-gray-700 leading-relaxed">{rec.summary}</p>
                        </div>

                        {/* Feature Breakdown */}
                        <div className="mt-4">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                            Feature Scores
                          </p>
                          <div className="space-y-2">
                            {rec.features.map((feat, featIdx) => {
                              const featScore = Math.round(feat.score);
                              const featColor = getBarColor(featScore);
                              const isOpen = openFeature === `${rec.parameter}-${feat.name}`;

                              return (
                                <div key={featIdx} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                  {/* Feature Header */}
                                  <button
                                    onClick={() => setOpenFeature(isOpen ? null : `${rec.parameter}-${feat.name}`)}
                                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                                  >
                                    <span className="text-xs font-medium text-gray-700 w-44 flex-shrink-0 text-right">
                                      {formatFeatureName(feat.name)}
                                    </span>
                                    <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                      <div
                                        className="h-2.5 rounded-full transition-all duration-500"
                                        style={{ width: `${featScore}%`, backgroundColor: featColor }}
                                      />
                                    </div>
                                    <span className="text-xs font-bold text-gray-800 w-8 text-right">
                                      {featScore}
                                    </span>
                                    <svg
                                      className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>

                                  {/* Feature Detail (Collapsed by default) */}
                                  {isOpen && (
                                    <div className="px-4 pb-4 pt-0 border-t border-gray-100 bg-gray-50">
                                      {feat.evidence && (
                                        <div className="mt-3">
                                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                                            Reason
                                          </p>
                                          <p className="text-sm text-gray-700 font-medium">
                                            {feat.evidence}
                                          </p>
                                        </div>
                                      )}
                                      {feat.sources && feat.sources.length > 0 && (
                                        <div className="mt-3">
                                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                                            Sources
                                          </p>
                                          <div className="flex flex-wrap gap-1.5">
                                            {feat.sources.map((src, srcIdx) => (
                                              <span key={srcIdx} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100">
                                                {src}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Company Info Footer */}
            <div className="bg-gray-100 px-6 py-3 border-t border-gray-200 rounded-b-lg">
              <p className="text-xs text-gray-500">
                Analyzed company: <span className="font-semibold text-gray-700">{result.company}</span>
              </p>
            </div>
          </div>
        )}

        {/* ── Empty State ──────────────────────────────────────────────────── */}
        {!result && !loading && !error && (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">
              Enter a company name and click <strong>Run Recommendation</strong> to see ML-powered product scoring results.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
