'use client';

import { useState } from 'react';
import { XaiScoring, DataLineageItem } from '@/types';

interface Props {
  xai: XaiScoring;
  dataLineage?: DataLineageItem[];
}

const FLAG_STYLES: Record<string, { pill: string; bar: string; dot: string }> = {
  verified: { pill: 'bg-green-100 text-green-700',  bar: '#22c55e', dot: 'bg-green-500'  },
  inferred: { pill: 'bg-blue-100 text-blue-700',    bar: '#3b82f6', dot: 'bg-blue-500'   },
  estimated:{ pill: 'bg-amber-100 text-amber-700',  bar: '#f59e0b', dot: 'bg-amber-400'  },
};

const RELIABILITY_STYLES: Record<string, string> = {
  highest: 'bg-green-100 text-green-700',
  high:    'bg-emerald-100 text-emerald-700',
  medium:  'bg-amber-100 text-amber-700',
  low:     'bg-gray-100 text-gray-500',
};

type Tab = 'xai' | 'lineage';

export default function XaiScoringPanel({ xai, dataLineage }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('xai');
  const [openIdx, setOpenIdx]     = useState<number | null>(null);

  return (
    <div className="border-b border-gray-200">

      {/* ── Section header ────────────────────────────────────────────── */}
      <div className="bg-gray-100 px-6 py-3 border-y border-gray-200">
        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
          XAI Scoring
        </span>
        <h3 className="text-sm font-bold text-gray-900 mt-0.5">Explainable AI — Opportunity Confidence</h3>
      </div>

      {/* ── Overall score hero ────────────────────────────────────────── */}
      <div className="bg-white px-6 py-5 border-b border-gray-200">
        <div className="flex items-center gap-6">
          <div className="flex-shrink-0 text-center w-24">
            <p className="text-6xl font-black text-green-500 leading-none">{xai.overallScore}</p>
            <p className="text-[10px] text-gray-400 font-semibold mt-1">OUT OF 100</p>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 uppercase tracking-wide">
                {xai.scoreLabel}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full bg-green-500 transition-all duration-700"
                style={{ width: `${xai.overallScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab bar ───────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 flex gap-1 pt-3">
        <TabButton label="Explainable AI" active={activeTab === 'xai'} onClick={() => setActiveTab('xai')} />
        {dataLineage && dataLineage.length > 0 && (
          <TabButton label="Data Lineage" active={activeTab === 'lineage'} onClick={() => setActiveTab('lineage')} />
        )}
      </div>

      {/* ── XAI tab content ───────────────────────────────────────────── */}
      {activeTab === 'xai' && (
        <div className="bg-white">
          <div className="px-6 py-2.5 border-b border-gray-100">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">
              Score Breakdown — Click any dimension to see evidence
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {xai.dimensions.map((dim, i) => {
              const styles = FLAG_STYLES[dim.confidenceFlag] ?? FLAG_STYLES.estimated;
              const isOpen = openIdx === i;

              return (
                <div key={i}>
                  <button
                    onClick={() => setOpenIdx(isOpen ? null : i)}
                    className="w-full px-6 py-3.5 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className="text-xs font-semibold text-gray-800 w-52 flex-shrink-0">
                      {dim.dimension}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${dim.score}%`, backgroundColor: styles.bar }}
                      />
                    </div>
                    <span className="text-sm font-black text-gray-900 w-8 text-right flex-shrink-0">
                      {dim.score}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold w-20 justify-center flex-shrink-0 ${styles.pill}`}>
                      {dim.confidenceFlag}
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 bg-gray-50 border-t border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pt-4">
                        Evidence
                      </p>
                      <ul className="space-y-1.5 mb-4">
                        {dim.evidence.map((ev, j) => (
                          <li key={j} className="flex items-start gap-2.5">
                            <span className={`mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                            <span className="text-xs text-gray-700 leading-relaxed">{ev}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="bg-gray-800 rounded px-4 py-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                          RM Challenge Prep
                        </p>
                        <p className="text-[11px] font-semibold text-amber-300 mb-2 leading-snug">
                          Q: {dim.rmChallenge.challenge}
                        </p>
                        <p className="text-[11px] text-gray-300 leading-relaxed">
                          {dim.rmChallenge.response}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Data Lineage tab content ──────────────────────────────────── */}
      {activeTab === 'lineage' && dataLineage && (
        <div className="bg-white">
          <div className="px-6 py-2.5 border-b border-gray-100">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">
              Data Lineage — Every number is traceable
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {dataLineage.map((item, i) => (
              <div key={i} className="px-6 py-4 flex items-start gap-4">
                <span className={`mt-0.5 flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${RELIABILITY_STYLES[item.reliability]}`}>
                  {item.reliability}
                </span>
                <div>
                  <p className="text-xs font-bold text-gray-900 mb-1">{item.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  );
}
