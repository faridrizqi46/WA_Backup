'use client';

import { useState } from 'react';

interface TimelineStep {
  step: number;
  action: string;
  details: string;
  timeline: string;
}

interface DeckDecision {
  recommendation: string;
  keyFactors: string[];
  riskIndicators: string[];
}

interface DosAndDonts {
  do: string[];
  dont: string[];
}

interface RMActionPlanResult {
  section1Timeline: TimelineStep[];
  section2WhatToBring: string[];
  section3DeckDecision: DeckDecision;
  section4OpeningScript: string;
  section5DosAndDonts: DosAndDonts;
  generatedAt: string;
  cached?: boolean;
}

function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="bg-gray-100 px-6 py-3 border-y border-gray-200">
      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-0.5">{label}</p>
      <h4 className="text-sm font-bold text-gray-900">{title}</h4>
    </div>
  );
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function TestRMActionPlanPage() {
  const [oppId, setOppId] = useState('');
  const [result, setResult] = useState<RMActionPlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  const handleTest = async () => {
    if (!oppId.trim()) {
      setError('Please enter opportunity ID');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/kpi/rm-action-plan?opportunityId=${encodeURIComponent(oppId)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to generate RM Action Plan');
      }

      setResult(data);
      setCached(data.cached || false);
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
          <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-1">
            RM Action Plan — Test Page
          </p>
          <h3 className="text-base font-black text-white">
            Meeting Preparation Kit
          </h3>
          <p className="text-[11px] text-blue-300 mt-1">
            Enter Opportunity ID to generate RM action plan
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={oppId}
              onChange={(e) => setOppId(e.target.value)}
              placeholder="Enter Opportunity ID..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleTest()}
            />
            <button
              onClick={handleTest}
              disabled={loading}
              className="px-6 py-2 bg-[#1a2436] text-white rounded-lg disabled:opacity-50 hover:bg-[#2a3446] transition-colors"
            >
              {loading ? 'Generating...' : 'Generate Plan'}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-red-600 text-sm">{error}</p>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Section 1: Timeline */}
            <SectionHeader label="Section 01" title="Step-by-Step RM Action Plan" />
            <div className="bg-white px-6 py-5 divide-y divide-gray-100">
              {result.section1Timeline.map((step, i) => (
                <div key={step.step} className="py-4 first:pt-0 last:pb-0 flex gap-4 items-start">
                  <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                    i === 0 ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {i + 1}
                  </div>
                  <div>
                    <p className={`text-xs font-bold mb-1 ${i === 0 ? 'text-green-700' : 'text-gray-900'}`}>
                      {step.action}
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">{step.details}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">{step.timeline}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Section 2: What to Bring */}
            <SectionHeader label="Section 02" title="What to Bring" />
            <div className="bg-white px-6 py-5">
              <div className="grid grid-cols-3 gap-3">
                {result.section2WhatToBring.map((item, i) => (
                  <div key={i} className="rounded border px-4 py-3"
                    style={{ background: 'linear-gradient(135deg, #003a6d 0%, #00539a 100%)', borderColor: '#00539a' }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#82cfff' }}>
                      ITEM {i + 1}
                    </p>
                    <p className="text-xs font-bold text-white">{item}</p>
                  </div>
                ))}
                <div className="rounded border px-4 py-3"
                  style={{ background: 'linear-gradient(135deg, #2d0709 0%, #520408 100%)', borderColor: '#520408' }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#ff8389' }}>
                    ✕ DO NOT BRING
                  </p>
                  <p className="text-xs font-bold text-white">Generic Product Deck</p>
                </div>
              </div>
            </div>

            {/* Section 3: Deck Decision */}
            <SectionHeader label="Section 03" title="Deck Decision" />
            <div className="bg-white px-6 py-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded border px-5 py-4"
                  style={{ background: 'linear-gradient(135deg, #8d8d8d 0%, #a8a8a8 100%)', borderColor: '#6f6f6f' }}>
                  <p className="text-[10px] font-bold text-black uppercase tracking-widest mb-2">
                    Meeting 1 — No Deck
                  </p>
                  <p className="text-xs font-bold text-black mb-2">
                    {result.section3DeckDecision.recommendation}
                  </p>
                  <p className="text-xs text-black leading-relaxed">
                    Use data-driven approach. Let the BoL printout be your opening.
                  </p>
                </div>
                <div className="rounded border px-5 py-4"
                  style={{ background: 'linear-gradient(135deg, #e5e0df 0%, #f7f3f2 100%)', borderColor: '#cac5c4' }}>
                  <p className="text-[10px] font-bold text-black uppercase tracking-widest mb-2">Key Factors</p>
                  <ul className="text-xs text-black space-y-1">
                    {result.section3DeckDecision.keyFactors.map((factor, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-600">•</span>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="col-span-2 rounded border px-5 py-4"
                  style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-2">Risk Indicators</p>
                  <ul className="text-xs text-red-700 space-y-1">
                    {result.section3DeckDecision.riskIndicators.map((risk, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 4: Opening Script */}
            <SectionHeader label="Section 04" title="Opening Script — Bahasa Indonesia" />
            <div className="bg-white px-6 py-5">
              <div className="bg-gray-50 border border-gray-200 rounded px-5 py-4 text-xs text-gray-800 leading-loose italic">
                <p className="mb-3">
                  "{result.section4OpeningScript}"
                </p>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">
                Adjust tone based on relationship level
              </p>
            </div>

            {/* Section 5: Do / Don't */}
            <SectionHeader label="Section 05" title="Do / Don't in the Meeting" />
            <div className="bg-white px-6 py-5">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-3">✓ Do</p>
                  <div className="space-y-2.5">
                    {result.section5DosAndDonts.do.map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-4 h-4 rounded-full bg-green-100 text-green-600 text-[10px] font-black flex items-center justify-center mt-0.5">✓</span>
                        <p className="text-xs text-gray-700 leading-snug">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-3">✕ Don't</p>
                  <div className="space-y-2.5">
                    {result.section5DosAndDonts.dont.map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-4 h-4 rounded-full bg-red-100 text-red-500 text-[10px] font-black flex items-center justify-center mt-0.5">✕</span>
                        <p className="text-xs text-gray-700 leading-snug">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Source strip */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium border bg-green-50 text-green-700 border-green-200">
                Generated: {new Date(result.generatedAt).toLocaleDateString('id-ID')}
              </span>
              {cached && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium border bg-blue-50 text-blue-700 border-blue-200">
                  Cached Result
                </span>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!result && !loading && !error && (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <p className="text-gray-500">
              Enter an Opportunity ID and click "Generate Plan" to test the RM Action Plan API.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}