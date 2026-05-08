'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Props {
  onBack: () => void;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export type BorrowerType = 'Parent' | 'Subsidiary';

export interface LoanFacility {
  facilityType: string;
  maxLimitRpM: number;
  maxLimitNote?: string;
  borrowerTag: string;
  borrowerType: BorrowerType;
  expiryDate: string | null;
  expiryYear: number | null;
  bankShortName: string;
  bankFull: string;
  insight: string;
  fullInsight?: string | null;
}

function getTodayMs(): number {
  return Date.now();
}
function daysUntil(dateStr: string | null, todayMs: number): number {
  if (!dateStr) return 999999;
  return Math.round((new Date(dateStr + 'T00:00:00Z').getTime() - todayMs) / 86_400_000);
}
function formatDate(dateStr: string | null, todayMs: number): string {
  if (!dateStr) return 'No expiry';
  const d = new Date(dateStr + 'T00:00:00Z');
  return `${String(d.getUTCDate()).padStart(2,'0')} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
function formatRpM(n: number): string {
  return 'Rp ' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' M';
}
function formatLimit(f: LoanFacility): string {
  return formatRpM(f.maxLimitRpM);
}
function progressColor(days: number): string {
  if (days < 90)  return 'bg-red-400';
  if (days < 180) return 'bg-amber-400';
  return 'bg-green-400';
}
function progressWidth(daysUntilExpiry: number): number {
  return Math.max(0, Math.min(100, Math.round((1 - daysUntilExpiry / 365) * 100)));
}

type FacilityWithBank = LoanFacility & { bankShortName: string; bankFull: string };

// ── Explainability logic ───────────────────────────────────────────────────
function explainFacility(f: FacilityWithBank, days: number, todayMs: number, coExpireCount: number): string {
  const highValue    = f.maxLimitRpM >= 1_000_000;
  const dualCurrency = f.maxLimitNote?.includes('US$') ?? false;
  const rpT          = (f.maxLimitRpM / 1_000_000).toFixed(2);
  const coStr        = coExpireCount > 0
    ? ` alongside ${coExpireCount} co-maturing facilit${coExpireCount === 1 ? 'y' : 'ies'} on the same date`
    : '';

  if (days <= 14) {
    return `Lapsing in ${days} day${days === 1 ? '' : 's'}${coStr} — immediate banker contact required to initiate renewal.`;
  }
  if (days <= 90) {
    let s = `${days}-day window to expiry${coStr} — begin renewal negotiation now`;
    if (highValue) s += ` for this Rp ${rpT}T high-value facility`;
    if (dualCurrency) s += '; USD sublimit adds cross-currency complexity';
    return s + '.';
  }
  if (days <= 180) {
    const months = Math.round(days / 30);
    let s = `Expiring in ~${months} months${coStr}`;
    if (highValue) s += ` — Rp ${rpT}T exposure; early lender engagement recommended`;
    else if (dualCurrency) s += '; proactively address USD sublimit structure at renewal';
    else s += ' — proactive review recommended';
    return s + '.';
  }
  // > 180 days
  if (!f.expiryDate) return 'No expiry date.';
  const d = new Date(f.expiryDate + 'T00:00:00Z');
  const q = Math.floor(d.getUTCMonth() / 3) + 1;
  const yr = d.getUTCFullYear();
  let s = `Queue for Q${q} ${yr} renewal planning`;
  if (highValue)    s += ` — Rp ${rpT}T high-value exposure; flag for early review`;
  else if (dualCurrency) s += '; note USD sublimit structure at renewal';
  else if (coExpireCount > 0) s += coStr;
  return s + '.';
}

// ── Individual expired card (compact, shown when stack is hovered) ──────────
function ExpiredItemCard({ facility: f, index, visible, todayMs }: {
  facility: FacilityWithBank; index: number; visible: boolean; todayMs: number;
}) {
  return (
    <div
      className="shrink-0 w-[220px] h-[150px] flex flex-col justify-between border-2 border-red-200 bg-red-50 rounded-xl p-3"
      style={{
        transform:  visible ? 'translateX(0)' : 'translateX(-20px)',
        opacity:    visible ? 1 : 0,
        transition: `transform 320ms ease-out ${index * 55}ms, opacity 320ms ease-out ${index * 55}ms`,
      }}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-xs font-extrabold text-red-800">{f.bankShortName}</span>
          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
            f.borrowerType === 'Parent' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
          }`}>{f.borrowerType}</span>
        </div>
        <p className="text-[10px] text-gray-700 leading-snug line-clamp-2">{f.facilityType}</p>
        <p className="text-[10px] text-gray-500 truncate">
          Max: <span className="font-semibold">{formatLimit(f)}</span>
        </p>
      </div>
      <div>
        <div className="h-1 w-full bg-red-200 rounded-full overflow-hidden mb-1">
          <div className="h-full w-full bg-red-500 rounded-full" />
        </div>
        <p className="text-[9px] text-red-500 font-semibold text-right">
          ⚠ Expired {formatDate(f.expiryDate, todayMs)}
        </p>
      </div>
    </div>
  );
}

// ── Expired stack row ──────────────────────────────────────────────────────
function ExpiredSection({ facilities, todayMs }: { facilities: FacilityWithBank[]; todayMs: number }) {
  const [expanded, setExpanded] = useState(false);
  const uniqueBanks = [...new Set(facilities.map((f) => f.bankShortName))];

  return (
    <div
      className="flex items-center gap-4"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Compact trigger card */}
      <div
        className={`relative flex flex-col justify-between border-2 rounded-xl p-3 w-[180px] h-[150px] shrink-0 cursor-default
          transition-all duration-200 ease-out
          ${expanded
            ? 'border-red-400 bg-red-100 shadow-xl -translate-y-1'
            : 'border-red-300 bg-red-50'
          }`}
        style={!expanded ? { boxShadow: '5px 5px 0 0 #fecaca, 10px 10px 0 0 #fca5a5' } : undefined}
      >
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-extrabold text-red-700">Expired</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-200 text-red-700">
              {facilities.length}
            </span>
          </div>
          <p className="text-[10px] text-red-400/90 font-medium">{uniqueBanks.join(' · ')}</p>
        </div>
        <div>
          <p className={`text-[10px] mb-2 transition-opacity duration-200 ${expanded ? 'opacity-0' : 'text-red-400'}`}>
            hover to reveal →
          </p>
          <div className="h-1 w-full bg-red-500 rounded-full" />
        </div>
      </div>

      {/* Cards that slide in to the right — CSS Grid 0fr→1fr is the smoothest width animation */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: expanded ? '1fr' : '0fr',
          transition: 'grid-template-columns 350ms ease-out',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflow: 'hidden', minWidth: 0 }}>
          <div className="flex gap-3 pr-1 py-1">
            {facilities.map((f, i) => (
              <ExpiredItemCard key={i} facility={f} index={i} visible={expanded} todayMs={todayMs} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function LoanGracePeriodDetail({ onBack }: Props) {
  const params = useParams();
  const accountId = params.id as string;
  const [mounted, setMounted] = useState(false);
  const [allFacilities, setAllFacilities] = useState<LoanFacility[]>([]);
  const [todayMs, setTodayMs] = useState(() => Date.now());
  const [selectedFacility, setSelectedFacility] = useState<LoanFacility | null>(null);

  useEffect(() => {
    setMounted(true);
    async function load() {
      try {
        const res = await fetch(`/api/loan-facilities/${accountId}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch');
        }
        const data = await res.json();
        const flat = data.groups.flatMap((g: { shortName: string; bank: string; facilities: LoanFacility[] }) =>
          g.facilities.map((f: LoanFacility) => ({ ...f, bankShortName: g.shortName, bankFull: g.bank }))
        );
        flat.sort((a: { expiryDate: string | null }, b: { expiryDate: string | null }) => {
          const dateA = a.expiryDate ? new Date(a.expiryDate).getTime() : Number.MAX_SAFE_INTEGER;
          const dateB = b.expiryDate ? new Date(b.expiryDate).getTime() : Number.MAX_SAFE_INTEGER;
          return dateA - dateB;
        });
        setAllFacilities(flat);
      } catch (e) {
        console.error('Failed to load loan facilities:', e);
      }
    }
    load();
  }, [accountId]);

  useEffect(() => {
    function tick() {
      setTodayMs(Date.now());
    }
    const now = new Date();
    const tomorrowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    const msUntilMidnight = tomorrowMidnight.getTime() - now.getTime();
    const timer = setTimeout(() => {
      tick();
      setInterval(tick, 86_400_000);
    }, msUntilMidnight);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  const expiredFacilities = allFacilities.filter((f) => f.expiryDate && daysUntil(f.expiryDate, todayMs) <= 0);
  const activeFacilities  = allFacilities.filter((f) => !f.expiryDate || daysUntil(f.expiryDate, todayMs) >  0);
  const thisYearFacilities = activeFacilities.filter((f) => f.expiryYear === new Date().getFullYear());
  const nextYearFacilities = activeFacilities.filter((f) => f.expiryYear === new Date().getFullYear() + 1);
  const totalShown = thisYearFacilities.length + nextYearFacilities.length;
  const totalMaxLimitRpM = allFacilities.reduce((sum, f) => sum + (f.maxLimitRpM || 0), 0);
  const totalMaxLimitDisplay = totalMaxLimitRpM >= 1_000_000
    ? `Rp ${(totalMaxLimitRpM / 1_000_000).toFixed(2)} T`
    : `Rp ${(totalMaxLimitRpM / 1_000).toFixed(0)} M`;

  function makeFacilityCard(f: LoanFacility, onClick: () => void) {
    const days          = daysUntil(f.expiryDate, todayMs);
    const pct           = progressWidth(days);
    const color         = progressColor(days);
    const urgent        = days < 90;
    const isExpired     = f.expiryDate && daysUntil(f.expiryDate, todayMs) <= 0;

    return (
      <div
        onClick={isExpired ? undefined : onClick}
        className={`flex flex-col justify-between border rounded-xl p-4 w-[280px] h-[300px] shrink-0
          transition-all duration-200 ease-out ${isExpired ? 'cursor-default opacity-75' : 'cursor-pointer hover:-translate-y-1.5 hover:shadow-lg'}
          ${urgent
            ? 'border-amber-200 bg-amber-50 hover:border-amber-400 hover:bg-amber-100'
            : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
          }`}>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-extrabold text-gray-800">{f.bankShortName}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
              f.borrowerType === 'Parent' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
            }`}>{f.borrowerType}</span>
          </div>
          <p className="text-[11px] text-gray-700 leading-snug line-clamp-2">{f.facilityType}</p>
          <p className="text-[10px] text-gray-400 truncate">{f.borrowerTag}</p>
          <p className="text-[10px] text-gray-500">
            Max Limit: <span className="font-semibold text-gray-700">{formatLimit(f)}</span>
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex gap-1 items-start">
            <span className="text-blue-400 text-[9px] shrink-0 mt-px">✦</span>
            <p className="text-[10px] italic text-blue-500/80 leading-relaxed line-clamp-4">{f.insight}</p>
          </div>
          <div>
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] text-gray-400">{pct}% elapsed</span>
              <span className={`text-[9px] font-semibold ${urgent ? 'text-amber-600' : 'text-gray-400'}`}>
                {isExpired ? 'Expired' : 'Expires'} {formatDate(f.expiryDate, todayMs)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedFacility && selectedFacility.fullInsight) {
    return (
      <FullInsightModal
        facility={selectedFacility}
        onClose={() => setSelectedFacility(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-0 animate-fadeSlideIn">

      {/* Back */}
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

      {/* Header */}
      <section>
        <div className="bg-gray-100 px-6 py-3 border-y border-gray-200">
          <h3 className="text-sm font-bold text-gray-900">Maturing Credit Facility Advisory</h3>
          <p className="text-[10px] text-gray-500 mt-0.5">
            Source: PT JAPFA Comfeed Indonesia Tbk Annual Report 2025, Note 17 — Short-Term Bank Loans (pages 328–333)
          </p>
        </div>
        <div className="bg-white border-b border-gray-200">
          <div className="flex items-stretch divide-x divide-gray-200">
            <SummaryPill label="Facilities Shown" value={String(totalShown)} />
            <SummaryPill label="Total Max Limit"  value={totalMaxLimitDisplay} />
          </div>
        </div>
      </section>

      {/* Cards area */}
      <div className="bg-white px-6 py-5 flex flex-col gap-6">

        {/* Expired row */}
        {mounted && expiredFacilities.length > 0 && (
          <div>
            <p className="text-[10px] text-gray-400 mb-3 font-medium uppercase tracking-wide">
              Expired · {expiredFacilities.length} facilities collapsed
            </p>
            <ExpiredSection facilities={expiredFacilities} todayMs={todayMs} />
          </div>
        )}

        {/* Active — This Year */}
        {thisYearFacilities.length > 0 && (
          <div>
            <p className="text-[10px] text-gray-400 mb-3 font-medium uppercase tracking-wide">
              Active · {thisYearFacilities.length} facilities · {new Date().getFullYear()}
            </p>
            {mounted ? (
              <div className="flex flex-wrap gap-4">
                {thisYearFacilities.map((f, i) => (
                  <div key={i}>{makeFacilityCard(f, () => setSelectedFacility(f))}</div>
                ))}
              </div>
            ) : (
              <div style={{ height: 280 }} />
            )}
          </div>
        )}

        {/* Next Year */}
        {nextYearFacilities.length > 0 && (
          <div>
            <p className="text-[10px] text-gray-400 mb-3 font-medium uppercase tracking-wide">
              Next Year · {nextYearFacilities.length} facilities · {new Date().getFullYear() + 1}
            </p>
            {mounted ? (
              <div className="flex flex-wrap gap-4">
                {nextYearFacilities.map((f, i) => (
                  <div key={i}>{makeFacilityCard(f, () => setSelectedFacility(f))}</div>
                ))}
              </div>
            ) : (
              <div style={{ height: 280 }} />
            )}
          </div>
        )}

      </div>

      {/* PDF */}
      <div className="px-6 py-5 border-t border-gray-200 bg-gray-50">
        <a
          href="/reports/2025-annual-report-pt-japfa-tbk.pdf"
          download="2025-Annual-Report-PT-JAPFA-Tbk.pdf"
          className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2M16 6l-4-4-4 4M12 2v8" />
          </svg>
          Published Annual Report — PT JAPFA Comfeed Indonesia Tbk 2025
        </a>
        <p className="text-[10px] text-gray-400 mt-1 ml-6">
          PT JAPFA Comfeed Indonesia Tbk Annual Report 2025 · Note 17, pages 328–333
        </p>
      </div>

    </div>
  );
}

function SummaryPill({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  const isLong     = value.length > 5;
  const sizeClass  = isLong ? 'text-3xl' : 'text-5xl';
  const colorClass = highlight ? 'text-red-500' : 'text-blue-600';
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-10 gap-3 text-center px-4">
      <p className={`font-black leading-none ${sizeClass} ${colorClass}`}>{value}</p>
      <p className="text-sm text-gray-500 font-medium tracking-wide">{label}</p>
    </div>
  );
}

function FullInsightModal({ facility, onClose }: { facility: LoanFacility; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{facility.bankShortName}</h2>
            <p className="text-sm text-gray-500">{facility.facilityType} · {facility.borrowerTag}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="prose prose-sm max-w-none">
            {facility.fullInsight?.split('\n').map((line, i) => {
              if (line.startsWith('### ')) {
                return <h3 key={i} className="text-base font-bold text-gray-800 mt-4 mb-2">{line.replace('### ', '')}</h3>;
              }
              if (line.startsWith('- ')) {
                return <p key={i} className="text-sm text-gray-700 mb-1">{line}</p>;
              }
              if (line.startsWith('**')) {
                return <p key={i} className="text-sm font-semibold text-gray-800 mt-3 mb-1">{line}</p>;
              }
              if (line.trim() === '') {
                return <div key={i} className="h-2" />;
              }
              return <p key={i} className="text-sm text-gray-700">{line}</p>;
            })}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}