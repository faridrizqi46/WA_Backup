'use client';

import { useState, useEffect } from 'react';

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

interface MeetingKitDynamicProps {
  opportunityId?: string;
  preloadedPlan?: RMActionPlanResult | null;
  loading?: boolean;
}

export default function MeetingKitDynamic({ opportunityId = '', preloadedPlan = null, loading: externalLoading = false }: MeetingKitDynamicProps) {
  const [result, setResult] = useState<RMActionPlanResult | null>(preloadedPlan);
  const [loading, setLoading] = useState(!preloadedPlan);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preloadedPlan) {
      setResult(preloadedPlan);
      setLoading(false);
      return;
    }

    if (!opportunityId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/kpi/rm-action-plan?opportunityId=${encodeURIComponent(opportunityId)}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || data.message || 'Failed to generate RM Action Plan');
        }

        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [opportunityId, preloadedPlan]);

  const isLoading = loading || externalLoading;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="bg-[#1e3a6e] px-6 py-5">
        <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-1">
          RM Action Plan
        </p>
        <h3 className="text-base font-black text-white">
          Meeting Preparation Kit
        </h3>
      </div>

      {isLoading && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Generating RM Action Plan...</p>
        </div>
      )}

      {error && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {result && !isLoading && !error && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                  X DO NOT BRING
                </p>
                <p className="text-xs font-bold text-white">Generic Product Deck</p>
              </div>
            </div>
          </div>

          <SectionHeader label="Section 03" title="Deck Decision" />
          <div className="bg-white px-6 py-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded border px-5 py-4"
                style={{ background: 'linear-gradient(135deg, #8d8d8d 0%, #a8a8a8 100%)', borderColor: '#6f6f6f' }}>
                <p className="text-[10px] font-bold text-black uppercase tracking-widest mb-2">
                  Meeting 1 - No Deck
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
                      <span className="text-green-600">*</span>
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
                      <span className="text-red-500">*</span>
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <SectionHeader label="Section 04" title="Opening Script - Bahasa Indonesia" />
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

          <SectionHeader label="Section 05" title="Do / Don't in the Meeting" />
          <div className="bg-white px-6 py-5">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-3">DO</p>
                <div className="space-y-2.5">
                  {result.section5DosAndDonts.do.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-4 h-4 rounded-full bg-green-100 text-green-600 text-[10px] font-black flex items-center justify-center mt-0.5">OK</span>
                      <p className="text-xs text-gray-700 leading-snug">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-3">DONT</p>
                <div className="space-y-2.5">
                  {result.section5DosAndDonts.dont.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-4 h-4 rounded-full bg-red-100 text-red-500 text-[10px] font-black flex items-center justify-center mt-0.5">NO</span>
                      <p className="text-xs text-gray-700 leading-snug">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium border bg-green-50 text-green-700 border-green-200">
              Generated: {new Date(result.generatedAt).toLocaleDateString('id-ID')}
            </span>
            {result.cached && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium border bg-blue-50 text-blue-700 border-blue-200">
                Cached Result
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}