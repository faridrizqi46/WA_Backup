'use client';

import { useState } from 'react';

export default function TestRecommendPage() {
  const [company, setCompany] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRecommend = async () => {
    if (!company.trim()) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get recommendations');
      }

      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa] p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#1a2436] mb-6">
          Product Recommendation Test
        </h1>

        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Enter company name..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3"
          />
          <button
            onClick={handleRecommend}
            disabled={loading}
            className="px-6 py-2 bg-[#1a2436] text-white rounded-lg disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Get Recommendations'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {results && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">{results.company}</h2>

            {results.recommendations.map((rec: any) => (
              <div key={rec.parameter} className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">
                    {rec.parameter === 'LC' ? 'Letter of Credit' : 'Supply Chain Finance'}
                  </h3>
                  <span className={`px-3 py-1 rounded ${
                    rec.recommended ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {rec.recommended ? 'Recommended' : 'Not Recommended'}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-500">Confidence Score</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${rec.confidenceScore * 100}%` }}
                      />
                    </div>
                    <span className="font-semibold">{(rec.confidenceScore * 100).toFixed(0)}%</span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Features</p>
                  <div className="grid grid-cols-2 gap-2">
                    {rec.features.map((f: any) => (
                      <div key={f.name} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm capitalize">{f.name}</span>
                        <span className="font-semibold">{f.score}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Summary</p>
                  <p className="text-sm">{rec.summary}</p>
                </div>
              </div>
            ))}

            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold mb-2">Overall Summary</h3>
              <p className="text-sm">{results.overallSummary}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}