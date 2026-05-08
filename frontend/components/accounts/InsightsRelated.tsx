'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { PieChart, Pie, Cell, Sector, ResponsiveContainer } from 'recharts';
import { AccountDetail, AccountOpportunityItem } from '@/types';
import OpportunityDetail from './OpportunityDetail';
import LoanGracePeriodDetail from './LoanGracePeriodDetail';

// ── Types ──────────────────────────────────────────────────────────────────
interface InsightSummary {
  text: string;
  source: string;
  recommendation: string;
  priority: 'High' | 'Medium' | 'Low';
}

interface InsightsSnapshot {
  industryInsights: InsightSummary[];
  clientInsights: InsightSummary[];
  generatedAt: string;
  sources?: string[];
}

// ── Mock AI response (swap real API call here when key is ready) ───────────
const AI_MOCK_INSIGHTS: InsightsSnapshot = {
  industryInsights: [
    { text: 'Poultry sector demand is accelerating into Q2 2026 with Lebaran volumes tracking 12% above the 5-year average. Live-bird prices stabilised at IDR 21,500/kg, easing downstream margin pressure.', source: 'Industry News', recommendation: '', priority: 'Medium' },
    { text: 'The MBG (Free Nutritious Meal) program secured a full-year budget of IDR 71 trillion for 2026, with poultry as primary protein in ~60% of school menus.', source: 'Government Data', recommendation: '', priority: 'High' },
    { text: 'SBM spot prices rose 6.2% YTD on US-China tariff escalation. JAPFA annualised SBM import bill increased ~IDR 380 billion.', source: 'Market Data', recommendation: '', priority: 'High' },
    { text: 'Ministry of Agriculture Decree No. 14/2026 mandates biosecurity certification for all Tier 1 farms by Q4 2026.', source: 'Regulation', recommendation: '', priority: 'Medium' },
  ],
  clientInsights: [
    { text: "JAPFA's Q1 2026 DOC sales grew 18% YoY vs. industry average of 11%, signalling successful Plasma expansion.", source: 'Company Report', recommendation: '', priority: 'High' },
    { text: "Cold-chain subsidiary operated at 91% utilization in Q1 (breakeven: 75%), creating durable moat.", source: 'Company Report', recommendation: '', priority: 'Medium' },
    { text: 'FCR performance averaged 1.71 in Q1 2026. Each 0.01 FCR reduction saves ~IDR 12 billion annually.', source: 'Company Report', recommendation: '', priority: 'Medium' },
    { text: "JAPFA's 'Plasma Plus' IoT programme covers 4,200 farmers, reducing mortality by 23% vs. national average.", source: 'Company Report', recommendation: '', priority: 'Low' },
  ],
  generatedAt: new Date().toISOString(),
};

async function generateInsightsFromAPI(accountId: string): Promise<InsightsSnapshot> {
  const res = await fetch('/api/test-insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId }),
  });
  if (!res.ok) throw new Error('Failed to generate insights');
  return res.json();
}

async function mockGenerateInsights(): Promise<InsightsSnapshot> {
  await new Promise((r) => setTimeout(r, 1800));
  return { ...AI_MOCK_INSIGHTS, generatedAt: new Date().toISOString() };
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatTs(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function splitInsight(text: string): { headline: string; body: string } {
  if (!text) return { headline: '', body: '' };
  const i = text.indexOf('. ');
  if (i === -1) return { headline: text, body: '' };
  return { headline: text.slice(0, i + 1), body: text.slice(i + 1).trim() };
}

function getInsightText(item: string | InsightSummary): string {
  return typeof item === 'string' ? item : (item.text || '');
}

function getInsightSource(item: string | InsightSummary): string {
  return typeof item === 'string' ? '' : (item.source || '');
}

function getInsightPriority(item: string | InsightSummary): string {
  return typeof item === 'string' ? 'Medium' : (item.priority || 'Medium');
}

function InsightCard({ item, type }: { item: InsightSummary; type: 'industry' | 'client' }) {
  const text = item?.text || '';
  if (!text) return null;
  
  const { headline, body } = splitInsight(text);
  const source = item?.source || '';
  const priority = item?.priority || 'Medium';

  return (
    <div className="rounded-xl p-4 flex flex-col gap-2 bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-200 cursor-default">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${type === 'industry' ? 'bg-green-500' : 'bg-blue-500'}`} />
        <span className="text-[10px] font-bold text-gray-400 uppercase">{type}</span>
        {source && (
          <span className="ml-auto text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
            {source}
          </span>
        )}
      </div>
      <div>
        <h4 className="text-sm font-bold text-gray-900 leading-snug">{headline || text}</h4>
        {body && <p className="text-xs text-gray-500 leading-relaxed mt-1">{body}</p>}
      </div>
      <div className="mt-1">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${PRIORITY_COLORS[priority]}`}>
          {priority}
        </span>
      </div>
    </div>
  );
}

const CONFIDENCE_COLOR: Record<string, string> = {
  High: 'text-blue-600',
  Mid: 'text-amber-600',
  Low: 'text-gray-500',
};

const PRIORITY_COLORS = {
  High: 'bg-red-100 text-red-700 border-red-200',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200',
  Low: 'bg-green-100 text-green-700 border-green-200',
};

const URGENCY_ORDER: Record<string, number> = { Urgent: 0, 'This Month': 1, 'This Quarter': 2 };

const URGENCY_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  Urgent:          { bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500',     label: 'Urgent'        },
  'This Month':    { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500',   label: 'This Month'    },
  'This Quarter':  { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'This Quarter'  },
};

function classifyInsight(text: string): { tag: string; accent: string; bg: string; sentiment: string } {
  const t = text.toLowerCase();
  if (/usd.*liabilit|liabilit.*usd|fx risk|hedg|exchange rate/.test(t))
    return { tag: 'FX Risk',      accent: '#dc2626', bg: '#fef2f2', sentiment: '▼' };
  if (/sbm|soybean.*price|tariff|prices.*rose|forecastd.*rise/.test(t))
    return { tag: 'Cost Risk',    accent: '#d97706', bg: '#fffbeb', sentiment: '▼' };
  if (/demand|sales grew|absorb|accelerat|lebaran|ramadan|harvest season|tailwind/.test(t))
    return { tag: 'Demand Signal',accent: '#16a34a', bg: '#f0fdf4', sentiment: '▲' };
  if (/government|mbg|policy|decree|mandate|ministry|regulation|certif/.test(t))
    return { tag: 'Regulatory',   accent: '#2563eb', bg: '#eff6ff', sentiment: '→' };
  if (/iot|digital twin|precision.*feed|sensor|plasma plus/.test(t))
    return { tag: 'Tech Trend',   accent: '#7c3aed', bg: '#f5f3ff', sentiment: '▲' };
  if (/fcr|feed conv|cold.chain|cold storage|utilisation|vertically integrated/.test(t))
    return { tag: 'Operations',   accent: '#0891b2', bg: '#ecfeff', sentiment: '▲' };
  if (/competitor|peer|cpin|malindo|high.beta|benchmark/.test(t))
    return { tag: 'Competitive',  accent: '#6366f1', bg: '#eef2ff', sentiment: '→' };
  return   { tag: 'Market Signal',accent: '#6b7280', bg: '#f9fafb', sentiment: '→' };
}

const RADIAN = Math.PI / 180;

// ── McKinsey-style callout label: value inside slice + name outside with leader line ──
function makeCalloutLabel(
  data: Array<{ name: string; color: string; value: number }>,
  opts: { suffix?: string; maxNameLen?: number } = {}
) {
  const { suffix = '', maxNameLen = 18 } = opts;
  return function CalloutLabel(props: any) {
    const { cx, cy, midAngle, innerRadius, outerRadius, value, percent, index } = props;
    if (!percent || percent < 0.03) return null;

    const sin = Math.sin(-midAngle * RADIAN);
    const cos = Math.cos(-midAngle * RADIAN);
    const onRight = cos >= 0;

    // Value: midpoint inside slice
    const midR = innerRadius + (outerRadius - innerRadius) * 0.5;
    const vx = cx + midR * cos;
    const vy = cy + midR * sin;

    // Leader line: start at slice outer edge → elbow → horizontal tail
    const startR = outerRadius + 7;
    const elbowR = outerRadius + 26;
    const hTail = 12;
    const sx = cx + startR * cos, sy = cy + startR * sin;
    const mx = cx + elbowR * cos, my = cy + elbowR * sin;
    const ex = mx + (onRight ? hTail : -hTail), ey = my;
    const textX = ex + (onRight ? 3 : -3);

    // Sanitise long names
    const raw = data[index]?.name ?? '';
    const clean = raw.replace(/^PT /, '').replace(/ \(Persero\)/g, '').replace(/ Tbk$/, '');
    const clipped = clean.length > maxNameLen ? clean.slice(0, maxNameLen - 1) + '…' : clean;

    // Soft-wrap into 2 lines
    const words = clipped.replace('…', '').split(' ');
    let l1 = '', l2 = '';
    const breakAt = Math.ceil(maxNameLen * 0.56);
    for (const w of words) {
      if (!l1 || (l1 + ' ' + w).length <= breakAt) l1 = l1 ? l1 + ' ' + w : w;
      else l2 = l2 ? l2 + ' ' + w : w;
    }
    if (clean.length > maxNameLen && l2) l2 = l2.trimEnd() + '…';
    const multiline = !!l2;
    const yOff = multiline ? -5 : 0;

    return (
      <g>
        {/* Value inside slice — skip tiny slices */}
        {percent >= 0.08 && (
          <text x={vx} y={vy} fill="white" textAnchor="middle" dominantBaseline="central"
            fontSize={11} fontWeight={700}>{value}{suffix}</text>
        )}
        {/* Leader line */}
        <polyline points={`${sx},${sy} ${mx},${my} ${ex},${ey}`}
          stroke="#d1d5db" fill="none" strokeWidth={0.8}
          strokeLinecap="round" strokeLinejoin="round" />
        {/* Name label (1 or 2 lines) */}
        <text x={textX} y={ey + yOff} textAnchor={onRight ? 'start' : 'end'}
          fill="#4b5563" fontSize={9} dominantBaseline="middle">
          {multiline
            ? <><tspan x={textX} dy={0}>{l1}</tspan><tspan x={textX} dy={10}>{l2}</tspan></>
            : clipped}
        </text>
      </g>
    );
  };
}

// ── Label centred inside a slice ───────────────────────────────────────────
function PieInnerLabel(props: {
  cx: number; cy: number; midAngle: number;
  innerRadius: number; outerRadius: number; percent: number; value: number;
}) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent, value } = props;
  if (percent < 0.07) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={12} fontWeight={700}>
      {value}
    </text>
  );
}

// ── Hovered slice — floats outward + drop-shadow ───────────────────────────
function ActivePieSlice(props: any & { showLabel?: boolean }) {
  const {
    cx, cy, midAngle, innerRadius, outerRadius,
    startAngle, endAngle, fill, value, percent,
    showLabel = false,
  } = props;
  const ox = Math.cos(-midAngle * RADIAN) * 10;
  const oy = Math.sin(-midAngle * RADIAN) * 10;
  // Label position inside the (expanded) slice
  const r = innerRadius + (outerRadius + 8 - innerRadius) * 0.55;
  const lx = cx + r * Math.cos(-midAngle * RADIAN);
  const ly = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <g style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.28))' }}
      transform={`translate(${ox}, ${oy})`}>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      {showLabel && (percent ?? 0) >= 0.07 && (
        <text x={lx} y={ly} fill="white" textAnchor="middle" dominantBaseline="central"
          fontSize={12} fontWeight={700}>
          {value}
        </text>
      )}
    </g>
  );
}

// ── Minimal pie tooltip ────────────────────────────────────────────────────
function PieTooltip({ active, payload, suffix = '' }: any) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="bg-white border border-gray-200 rounded shadow-md px-2.5 py-1.5 text-[11px] pointer-events-none flex items-center gap-2">
      <div className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: entry.payload?.color ?? entry.fill }} />
      <span className="text-gray-700 font-medium max-w-[140px] truncate">{entry.name}</span>
      <span className="text-gray-500 font-semibold">{entry.value}{suffix}</span>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────
export default function InsightsRelated({ account }: { account: AccountDetail }) {
  const ir = account.insightsRelated;
  if (!ir) {
    return (
      <div className="bg-white rounded-sm p-8 text-center text-sm text-gray-400">
        Insights not available for this account.
      </div>
    );
  }

  const CURR_KEY = `insights_current_${account.id}`;
  const HIST_KEY = `insights_history_${account.id}`;

  const [insights, setInsights] = useState<InsightsSnapshot>({
    industryInsights: (ir.defaultInsights.industryInsights as unknown as InsightSummary[]) || [],
    clientInsights: (ir.defaultInsights.clientInsights as unknown as InsightSummary[]) || [],
    generatedAt: '',
  });
  const [history, setHistory] = useState<InsightsSnapshot | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [generating, setGenerating]           = useState(false);
  const [activeProdIdx, setActiveProdIdx]     = useState(-1);
  const [activeWalletIdx, setActiveWalletIdx] = useState(-1);
  const [mounted, setMounted]                 = useState(false);
  const [selectedOpp, setSelectedOpp]         = useState<AccountOpportunityItem | null>(null);
  const [viewVisible, setViewVisible]         = useState(true);

  const contactsScrollRef = useRef<HTMLDivElement>(null);

  // Ref so the async handler always reads the latest insights without stale closure
  const insightsRef = useRef(insights);
  useEffect(() => { insightsRef.current = insights; }, [insights]);

  // Mark mounted (suppresses Recharts SSR mismatch) + load localStorage
  useEffect(() => {
    setMounted(true);
    try {
      const curr = localStorage.getItem(CURR_KEY);
      if (curr) setInsights(JSON.parse(curr));
      const hist = localStorage.getItem(HIST_KEY);
      if (hist) setHistory(JSON.parse(hist));
    } catch { /* ignore parse errors */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigateTo = useCallback((opp: AccountOpportunityItem) => {
    setViewVisible(false);
    setTimeout(() => { setSelectedOpp(opp); setViewVisible(true); }, 180);
  }, []);

  const navigateBack = useCallback(() => {
    setViewVisible(false);
    setTimeout(() => { setSelectedOpp(null); setViewVisible(true); }, 180);
  }, []);

  async function saveInsightsToDatabase(insights: InsightsSnapshot) {
    try {
      const res = await fetch('/api/insights/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: account.id,
          defaultInsights: {
            industryInsights: insights.industryInsights,
            clientInsights: insights.clientInsights,
            generatedAt: insights.generatedAt,
          },
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to save');
      }
      
      console.log('[InsightsRelated] Saved to database');
    } catch (error) {
      console.error('[InsightsRelated] Failed to save insights:', error);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setShowHistory(false);
    try {
      const next = await generateInsightsFromAPI(account.id);
      const prev: InsightsSnapshot = {
        ...insightsRef.current,
        generatedAt: insightsRef.current.generatedAt || new Date().toISOString(),
      };
      localStorage.setItem(HIST_KEY, JSON.stringify(prev));
      localStorage.setItem(CURR_KEY, JSON.stringify(next));
      setHistory(prev);
      setInsights(next);
      
      // Save to database
      await saveInsightsToDatabase(next);
    } catch {
      const next = await mockGenerateInsights();
      const prev: InsightsSnapshot = {
        ...insightsRef.current,
        generatedAt: insightsRef.current.generatedAt || new Date().toISOString(),
      };
      localStorage.setItem(HIST_KEY, JSON.stringify(prev));
      localStorage.setItem(CURR_KEY, JSON.stringify(next));
      setHistory(prev);
      setInsights(next);
      
      // Save mock to database too
      await saveInsightsToDatabase(next);
    } finally {
      setGenerating(false);
    }
  }

  const { productPortion, walletShare, opportunityCount, totalOpportunityAmount, opportunities, contacts } = ir;

  const sortedOpportunities = [...opportunities].sort((a, b) =>
    (URGENCY_ORDER[a.urgency ?? 'This Quarter'] ?? 2) - (URGENCY_ORDER[b.urgency ?? 'This Quarter'] ?? 2)
  );

  const fadeClass = viewVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2';
  const transitionClass = 'transition-all duration-150 ease-in-out';

  // ── Detail view ──────────────────────────────────────────────────────────
  if (selectedOpp) {
    return (
      <div className={`${fadeClass} ${transitionClass}`}>
        {selectedOpp.isLoanAdvisory ? (
          <LoanGracePeriodDetail onBack={navigateBack} />
        ) : (
          <OpportunityDetail opportunity={selectedOpp} onBack={navigateBack} />
        )}
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────
  return (
    <div className={`flex flex-col gap-4 ${fadeClass} ${transitionClass}`}>

      {/* ── Insights block ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-sm px-6 py-5">

        {/* Global AI button row */}
        <div className="flex justify-end mb-5">
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {generating ? (
                <>
                  <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
                      strokeDasharray="15 30" />
                  </svg>
                  Generating…
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  AI Insight
                </>
              )}
            </button>

            {history && (
              <button
                onClick={() => setShowHistory((p) => !p)}
                className="text-[11px] text-gray-400 hover:text-blue-600 transition-colors underline-offset-2 underline"
              >
                {showHistory ? 'Hide history' : '📋 History'}
              </button>
            )}

            {insights.generatedAt && (
              <span className="text-[10px] text-gray-400">
                Updated {formatTs(insights.generatedAt)}
              </span>
            )}
          </div>
        </div>

        {/* History panel */}
        {showHistory && history && (
          <div className="mb-6 border border-amber-200 rounded-md bg-amber-50 px-4 py-3 text-xs">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-amber-800">
                Previous AI Insight · {formatTs(history.generatedAt)}
              </p>
              <button onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-gray-600 text-sm leading-none">X</button>
            </div>
            <p className="font-bold text-gray-600 mb-1.5">Industry</p>
            <ol className="list-decimal list-outside pl-4 space-y-1 text-gray-600 leading-relaxed mb-3">
              {history.industryInsights.map((t, i) => <li key={i}>{getInsightText(t)}</li>)}
            </ol>
            <p className="font-bold text-gray-600 mb-1.5">Client</p>
            <ol className="list-decimal list-outside pl-4 space-y-1 text-gray-600 leading-relaxed">
              {history.clientInsights.map((t, i) => <li key={i}>{getInsightText(t)}</li>)}
            </ol>
          </div>
        )}

        {/* Industry Insights */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-bold text-gray-900">Industry Insights</h3>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {insights.industryInsights.slice(0, 4).map((item, i) => (
              <InsightCard key={i} item={item} type="industry" />
            ))}
          </div>
        </div>

        <hr className="border-gray-100 mb-5" />

        {/* Client Insights */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-bold text-gray-900">Client Insights</h3>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {insights.clientInsights.slice(0, 4).map((item, i) => (
              <InsightCard key={i} item={item} type="client" />
            ))}
          </div>
        </div>
      </div>

      {/* ── Overview ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-sm px-6 py-5">
        <h3 className="text-sm font-bold text-gray-900 mb-5">Overview</h3>

        {mounted ? (
          <div className="grid grid-cols-2 gap-6">

            {/* ── Potential Product Portion ── */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1 px-1">Potential Product Portion</p>
              {/* overflow:visible prevents clip of hover-expanded slice */}
              <div className="relative" style={{ overflow: 'visible' }}>
                <ResponsiveContainer width="100%" height={520}>
                  <PieChart margin={{ top: 38, right: 105, bottom: 38, left: 105 }}>
                    <defs>
                      {productPortion.map((s, i) => (
                        <linearGradient key={i} id={`grad-prod-${i}`} x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor={s.color} stopOpacity={0.45} />
                          <stop offset="100%" stopColor={s.color} stopOpacity={1} />
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie
                      data={productPortion}
                      dataKey="value"
                      cx="50%" cy="50%"
                      innerRadius={130}
                      outerRadius={200}
                      labelLine={false}
                      label={makeCalloutLabel(productPortion, { maxNameLen: 20 })}
                      {...({
                        activeIndex: activeProdIdx,
                        activeShape: (p: any) => <ActivePieSlice {...p} />,
                        onMouseEnter: (_: any, index: number) => setActiveProdIdx(index),
                        onMouseLeave: () => setActiveProdIdx(-1),
                      } as any)}
                    >
                      {productPortion.map((s, i) => (
                        <Cell key={i} fill={`url(#grad-prod-${i})`} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Centre: stat at rest, hovered slice info on hover */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {activeProdIdx !== -1 && activeProdIdx < productPortion.length ? (
                    <div className="text-center">
                      <p className="text-2xl font-black leading-none"
                        style={{ color: productPortion[activeProdIdx].color }}>
                        {productPortion[activeProdIdx].value}
                      </p>
                      <p className="text-[9px] text-gray-500 mt-1 leading-tight max-w-[60px] text-center">
                        {productPortion[activeProdIdx].name}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-4xl font-black text-gray-900">{opportunityCount}</p>
                      <p className="text-[9px] text-gray-400 uppercase tracking-wide mt-0.5">Actions</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Wallet Share Portion ── */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1 px-1">Wallet Share Portion</p>
              <div className="relative" style={{ overflow: 'visible' }}>
                <ResponsiveContainer width="100%" height={520}>
                  <PieChart margin={{ top: 38, right: 105, bottom: 38, left: 105 }}>
                    <defs>
                      {walletShare.map((s, i) => (
                        <linearGradient key={i} id={`grad-wallet-${i}`} x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor={s.color} stopOpacity={0.45} />
                          <stop offset="100%" stopColor={s.color} stopOpacity={1} />
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie
                      data={walletShare}
                      dataKey="value"
                      cx="50%" cy="50%"
                      innerRadius={127}
                      outerRadius={196}
                      labelLine={false}
                      label={makeCalloutLabel(walletShare, { suffix: '%', maxNameLen: 16 })}
                      {...({
                        activeIndex: activeWalletIdx,
                        activeShape: (p: any) => <ActivePieSlice {...p} />,
                        onMouseEnter: (_: any, index: number) => setActiveWalletIdx(index),
                        onMouseLeave: () => setActiveWalletIdx(-1),
                      } as any)}
                    >
                      {walletShare.map((s, i) => (
                        <Cell key={i} fill={`url(#grad-wallet-${i})`} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {activeWalletIdx !== -1 && activeWalletIdx < walletShare.length ? (
                    <div className="text-center">
                      <p className="text-xl font-black leading-none"
                        style={{ color: walletShare[activeWalletIdx].color }}>
                        {walletShare[activeWalletIdx].value}%
                      </p>
                      <p className="text-[9px] text-gray-400 mt-1 leading-tight max-w-[60px] text-center">
                        {walletShare[activeWalletIdx].name}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-3xl font-black text-gray-900">{totalOpportunityAmount}</p>
                      <p className="text-[9px] text-gray-400 uppercase tracking-wide mt-0.5">Revenue</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div style={{ height: 520 }} />
        )}
      </div>

      {/* ── Next Best Actions table ──────────────────────────────────────── */}
      <div className="bg-white rounded-sm">
        <div className="px-6 pt-5 pb-3 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900">Next Best Actions</h3>
              <span className="text-blue-600 text-xs">✦</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              AI-ranked by urgency × revenue impact · {sortedOpportunities.length} actions identified
            </p>
          </div>
          <div className="flex items-center gap-3 pt-0.5">
            <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
              <span className="w-2 h-2 rounded-full bg-red-400" />Urgent
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" />This Month
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />This Quarter
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-y border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600 w-8">#</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 w-[10%]">Urgency</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 w-[22%]">Recommended Action</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 w-[24%]">
                  <span className="flex items-center gap-1">
                    <span className="text-blue-600">✦</span> AI Signal
                  </span>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 w-[10%]">Deadline</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 w-[13%]">Value at Stake</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 w-[7%]">AI Score</th>
                <th className="px-4 py-3 w-6" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedOpportunities.map((opp, i) => {
                const uc = URGENCY_CONFIG[opp.urgency ?? 'This Quarter'];
                const clickable = !!(opp.detail || opp.isLoanAdvisory);
                return (
                  <tr
                    key={i}
                    onClick={clickable ? () => navigateTo(opp) : undefined}
                    className={`transition-colors ${clickable ? 'hover:bg-blue-50 cursor-pointer' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-4 py-3.5 text-gray-400 font-medium">{i + 1}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold ${uc.bg} ${uc.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${uc.dot}`} />
                        {uc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className={`font-semibold leading-snug ${clickable ? 'text-blue-700' : 'text-gray-800'}`}>
                        {opp.recommendedAction ?? opp.offeredProduct}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-gray-700 leading-relaxed">{opp.insight}</td>
                    <td className="px-4 py-3.5 text-gray-700 font-medium whitespace-nowrap">
                      {opp.deadline ?? opp.offerDate}
                    </td>
                    <td className="px-4 py-3.5 text-gray-800 font-semibold">{opp.potentialValue}</td>
                    <td className={`px-4 py-3.5 font-semibold ${CONFIDENCE_COLOR[opp.confidenceLevel]}`}>
                      {opp.confidenceLevel}
                    </td>
                    <td className="px-4 py-3.5 text-right pr-5">
                      {clickable && (
                        <span className="text-blue-400 font-bold text-sm">›</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Related Contacts slider ──────────────────────────────────────── */}
      <div className="bg-white rounded-sm px-6 pt-5 pb-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-gray-900">Related Contacts</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => contactsScrollRef.current?.scrollBy({ left: -940, behavior: 'smooth' })}
              className="w-7 h-7 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-400 transition-colors text-base leading-none"
            >‹</button>
            <button
              onClick={() => contactsScrollRef.current?.scrollBy({ left: 940, behavior: 'smooth' })}
              className="w-7 h-7 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-400 transition-colors text-base leading-none"
            >›</button>
          </div>
        </div>

        <div
          ref={contactsScrollRef}
          className="flex gap-4 overflow-x-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {contacts.map((c, i) => (
            <a
              key={i}
              href={`https://www.google.com/search?q=${encodeURIComponent(c.name + ' JAPFA Comfeed')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 w-[172px] bg-white rounded-xl border border-gray-100 p-5 flex flex-col items-center gap-3 hover:shadow-lg transition-shadow duration-200 cursor-pointer no-underline"
            >
              <div className="w-[88px] h-[88px] rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                {c.photo ? (
                  <Image
                    src={c.photo}
                    alt={c.name}
                    width={88}
                    height={88}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 font-bold text-2xl">
                    {c.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-gray-900 leading-snug">{c.name}</p>
                <p className="text-[10px] text-gray-500 mt-1 leading-snug">{c.title}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

    </div>
  );
}
