'use client';

import { useState } from 'react';
import {
  RMActionPlanResult,
  TimelineStep,
  DeckDecision,
  DosAndDonts,
} from '@/types';

interface RMActionPlanProps {
  opportunityId: string;
}

export default function RMActionPlan({ opportunityId }: RMActionPlanProps) {
  const [data, setData] = useState<RMActionPlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    section1: true,
    section2: true,
    section3: true,
    section4: true,
    section5: true,
  });

  const fetchActionPlan = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/kpi/rm-action-plan?opportunityId=${opportunityId}`);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.suggestion || result.error || 'Failed to fetch');
      }

      setData(result);
      setCached(result.cached || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const timelineSteps: Record<number, string> = {
    1: 'Intelligence Call',
    2: 'Prepare Documentation',
    3: 'Meeting Day',
    4: 'Propose SCF/LC',
    5: 'Penulisan Proposal',
    6: 'Follow-up',
  };

  return (
    <div className="border-b border-gray-200">
      {/* Header */}
      <div className="bg-gray-100 px-6 py-3 border-y border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">RM Action Plan</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              AI-generated recommendations for relationship manager
            </p>
          </div>
          <div className="flex items-center gap-2">
            {cached && (
              <span className="text-[10px] text-green-600 bg-green-50 px-2 py-1 rounded">
                ✓ Cached
              </span>
            )}
            <button
              onClick={fetchActionPlan}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Generating...' : 'Generate Plan'}
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-400 flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div>
              <p className="text-sm font-bold text-red-700">Failed to Generate Plan</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="px-6 py-8 bg-white text-center">
          <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-2 text-sm text-gray-500">Generating RM Action Plan...</p>
        </div>
      )}

      {/* Content */}
      {!loading && data && (
        <div className="divide-y divide-gray-100">
          {/* Section 1: Timeline */}
          <div className="bg-white">
            <button
              onClick={() => toggleSection('section1')}
              className="w-full px-6 py-3 flex items-center justify-between text-left hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <span className="text-sm font-semibold text-gray-900">Step by Step Timeline</span>
              </div>
              <span className="text-gray-400">{openSections.section1 ? '▲' : '▼'}</span>
            </button>
            {openSections.section1 && (
              <div className="px-6 pb-4">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600 w-8">#</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600 w-32">Step</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Details</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600 w-20">Timeline</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.section1Timeline.map((step: TimelineStep) => (
                        <tr key={step.step}>
                          <td className="px-3 py-2 text-gray-400 font-medium">{step.step}</td>
                          <td className="px-3 py-2 font-medium text-gray-900">
                            {timelineSteps[step.step] || step.action}
                          </td>
                          <td className="px-3 py-2 text-gray-600">{step.details}</td>
                          <td className="px-3 py-2">
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-medium">
                              {step.timeline}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: What to Bring */}
          <div className="bg-white">
            <button
              onClick={() => toggleSection('section2')}
              className="w-full px-6 py-3 flex items-center justify-between text-left hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <span className="text-sm font-semibold text-gray-900">What to Bring</span>
              </div>
              <span className="text-gray-400">{openSections.section2 ? '▲' : '▼'}</span>
            </button>
            {openSections.section2 && (
              <div className="px-6 pb-4">
                <div className="flex flex-wrap gap-2">
                  {data.section2WhatToBring.map((item: string, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-medium"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Deck Decision */}
          <div className="bg-white">
            <button
              onClick={() => toggleSection('section3')}
              className="w-full px-6 py-3 flex items-center justify-between text-left hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <span className="text-sm font-semibold text-gray-900">Deck Decision</span>
              </div>
              <span className="text-gray-400">{openSections.section3 ? '▲' : '▼'}</span>
            </button>
            {openSections.section3 && (
              <div className="px-6 pb-4 space-y-3">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Recommendation</p>
                  <p className={`text-sm font-bold ${
                    data.section3DeckDecision.recommendation === 'Approve'
                      ? 'text-green-600'
                      : data.section3DeckDecision.recommendation === 'Review Further'
                      ? 'text-amber-600'
                      : 'text-red-600'
                  }`}>
                    {data.section3DeckDecision.recommendation}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Key Factors</p>
                  <ul className="space-y-1">
                    {data.section3DeckDecision.keyFactors.map((factor: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                        <span className="text-green-600 mt-0.5">•</span>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Risk Indicators</p>
                  <ul className="space-y-1">
                    {data.section3DeckDecision.riskIndicators.map((risk: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                        <span className="text-red-500 mt-0.5">•</span>
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Opening Script */}
          <div className="bg-white">
            <button
              onClick={() => toggleSection('section4')}
              className="w-full px-6 py-3 flex items-center justify-between text-left hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                  4
                </span>
                <span className="text-sm font-semibold text-gray-900">Opening Script (Indonesian)</span>
              </div>
              <span className="text-gray-400">{openSections.section4 ? '▲' : '▼'}</span>
            </button>
            {openSections.section4 && (
              <div className="px-6 pb-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 leading-relaxed italic">
                    &ldquo;{data.section4OpeningScript}&rdquo;
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Do's and Don'ts */}
          <div className="bg-white">
            <button
              onClick={() => toggleSection('section5')}
              className="w-full px-6 py-3 flex items-center justify-between text-left hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                  5
                </span>
                <span className="text-sm font-semibold text-gray-900">Do&apos;s and Don&apos;ts</span>
              </div>
              <span className="text-gray-400">{openSections.section5 ? '▲' : '▼'}</span>
            </button>
            {openSections.section5 && (
              <div className="px-6 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-green-600 uppercase tracking-wider mb-2 font-semibold">
                      ✓ DO
                    </p>
                    <ul className="space-y-1.5">
                      {data.section5DosAndDonts.do.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                          <span className="text-green-600 mt-0.5">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[10px] text-red-600 uppercase tracking-wider mb-2 font-semibold">
                      ✗ DON'T
                    </p>
                    <ul className="space-y-1.5">
                      {data.section5DosAndDonts.dont.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                          <span className="text-red-500 mt-0.5">✗</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Generated timestamp */}
          <div className="px-6 py-2 bg-gray-50 text-right">
            <p className="text-[10px] text-gray-400">
              Generated: {new Date(data.generatedAt).toLocaleString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !data && !error && (
        <div className="px-6 py-8 text-center bg-white">
          <p className="text-sm text-gray-500">
            Click &ldquo;Generate Plan&rdquo; to get AI-generated RM recommendations.
          </p>
        </div>
      )}
    </div>
  );
}