'use client';

import { AccountOpportunityItem } from '@/types';
import TradeIntelligenceBriefPanel from './TradeIntelligenceBriefPanel';

const CONFIDENCE_PCT: Record<string, number> = {
  High: 82,
  Mid:  55,
  Low:  30,
};

interface Props {
  opportunity: AccountOpportunityItem;
  onBack: () => void;
}

export default function OpportunityDetail({ opportunity, onBack }: Props) {
  const { detail, confidenceLevel } = opportunity;
  const pct = CONFIDENCE_PCT[confidenceLevel] ?? 82;

  return (
    <div className="flex flex-col gap-0 animate-fadeSlideIn">

      {/* ── Back button ────────────────────────────────────────────────── */}
      <div className="px-6 pt-4 pb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors group"
        >
          <svg className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Opportunities
        </button>
      </div>

      {/* ── Trade Intelligence Brief (shown when tradeIntelligence data exists) ── */}
      {opportunity.tradeIntelligence && (
        <TradeIntelligenceBriefPanel
          brief={opportunity.tradeIntelligence}
          opportunityId={opportunity.id}
        />
      )}

      {/* ── Standard sections — hidden when tradeIntelligence panel is present ── */}
      {!opportunity.tradeIntelligence && (
        <>
          {/* Opportunities Detail */}
          <section>
            <div className="bg-gray-100 px-6 py-3 border-y border-gray-200">
              <h3 className="text-sm font-bold text-gray-900">Opportunities Detail</h3>
            </div>
            <div className="bg-white px-6 py-5 flex gap-8">
              <div className="flex-1 flex flex-col gap-0 divide-y divide-gray-200">
                <Field label="Offered Product"      value={opportunity.offeredProduct} />
                <Field label="✦ Insight"            value={opportunity.insight}        />
                <Field label="Offer Generated Date" value={opportunity.offerDate}      />
                <Field label="Reason"               value={opportunity.reason}         />
              </div>
              <div className="flex gap-4 self-start">
                <MetricCard
                  title="Recommendation Strength"
                  value={`${pct}%`}
                  sub="Confidence"
                />
                <MetricCard
                  title="Potential Value"
                  value={detail?.potentialValueDisplay ?? opportunity.potentialValue}
                  sub={detail?.potentialValueUnit ?? ''}
                />
              </div>
            </div>
          </section>

          {/* Business Benefits */}
          {detail && (
            <section>
              <div className="bg-gray-100 px-6 py-3 border-y border-gray-200">
                <h3 className="text-sm font-bold text-gray-900">Business Benefits</h3>
              </div>
              <div className="bg-white">
                <div className="grid grid-cols-3 divide-x divide-y divide-gray-200 border-b border-gray-200">
                  {detail.businessBenefits.map((b, i) => (
                    <div key={i} className="px-8 py-6 text-center">
                      <p className="text-xs font-bold italic text-gray-700 mb-3">{b.label}</p>
                      <p className={`text-4xl font-black ${b.positive ? 'text-green-500' : 'text-red-500'}`}>
                        {b.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Data Sources */}
          {detail && (
            <section>
              <div className="bg-gray-100 px-6 py-3 border-y border-gray-200">
                <h3 className="text-sm font-bold text-gray-900">Data Sources</h3>
              </div>
              <div className="bg-white px-6 py-5 flex flex-col gap-6">
                {detail.dataSources.map((ds, i) => (
                  <div key={i}>
                    <p className="text-sm font-bold text-gray-900 mb-2">{i + 1}. {ds.title}</p>
                    <p className="text-xs text-gray-700 leading-relaxed pl-4 mb-3">{ds.description}</p>
                    <div className="bg-gray-50 border-t border-b border-gray-200 px-4 py-2.5">
                      <p className="text-[10px] text-gray-400 mb-1">Source :</p>
                      {ds.sources.map((src, j) => (
                        <p key={j} className="text-xs text-blue-600 hover:underline cursor-pointer leading-relaxed">
                          {src}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value: string }) {
  const isInsight = label.startsWith('✦');
  return (
    <div className="py-3 first:pt-0">
      <p className={`text-[10px] mb-1 ${isInsight ? 'text-blue-500 font-semibold' : 'text-gray-400'}`}>
        {label}
      </p>
      <p className="text-xs text-gray-800 leading-relaxed">{value}</p>
    </div>
  );
}

function MetricCard({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div className="border border-gray-200 rounded w-44 text-center px-4 py-4 flex flex-col gap-1">
      <p className="text-xs font-semibold italic text-gray-400 leading-snug">{title}</p>
      <p className="text-4xl font-black text-gray-900 leading-none my-2">{value}</p>
      <p className="text-xs font-semibold text-gray-500">{sub}</p>
    </div>
  );
}
