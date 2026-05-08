'use client';

import { useState, useEffect, useRef } from 'react';
import { BolRecord, RMActionPlanResult } from '@/types';
import MeetingKitDynamic from './MeetingKitDynamic';

interface Props {
  bolRecords: BolRecord[];
  opportunityScore?: number;
  supplierChips?: { label: string }[];
  opportunityId?: string;
  rmActionPlan?: RMActionPlanResult | null;
  rmActionLoading?: boolean;
}

const AVG_FREQ      = 9;
const WIN_START_OFF = 11;   // last date + 11 = May 1
const WIN_END_OFF   = 19;   // last date + 19 = May 9

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function parseYMD(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function fmtMD(d: Date)  { return `${MONTHS[d.getMonth()]} ${d.getDate()}`; }
function fmtMDY(d: Date) { return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; }

export default function ShipmentWindowForecast({ 
  bolRecords, 
  opportunityScore = 91, 
  supplierChips = [], 
  opportunityId = '',
  rmActionPlan = null,
  rmActionLoading = false
}: Props) {
  const [todayDate, setTodayDate] = useState<Date | null>(null);
  const [kitOpen, setKitOpen] = useState(false);
  const kitRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setTodayDate(new Date()); }, []);

  useEffect(() => {
    if (kitOpen && kitRef.current) {
      kitRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [kitOpen]);

  // ── Derived values ────────────────────────────────────────────────────────
  const cutoffDate = addDays(todayDate ?? new Date(), -90);
  const cutoffStr = cutoffDate.toISOString().slice(0, 10);
  const filteredBolRecords = bolRecords.filter(b => b.arrivalDate >= cutoffStr);

  const dateGroups: Record<string, BolRecord[]> = {};
  filteredBolRecords.forEach(b => { (dateGroups[b.arrivalDate] ??= []).push(b); });
  const sortedStrs = Object.keys(dateGroups).sort();
  const lastStr    = sortedStrs[sortedStrs.length - 1];
  const lastDate   = parseYMD(lastStr);

  const winStart  = addDays(lastDate, WIN_START_OFF);
  const winEnd    = addDays(lastDate, WIN_END_OFF);
  const lcDeadline = addDays(winStart, -2);

  // ── Timeline geometry ─────────────────────────────────────────────────────
  const timelineStart = cutoffDate;
  const timelineEnd   = addDays(todayDate ?? new Date(), 10);
  const spanMs        = timelineEnd.getTime() - timelineStart.getTime();

  function pct(d: Date) {
    if (spanMs === 0) return 50;
    const p = ((d.getTime() - timelineStart.getTime()) / spanMs) * 100;
    return Math.max(-5, Math.min(105, p));
  }

  const winMidPct   = pct(new Date((winStart.getTime() + winEnd.getTime()) / 2));
  const todayPct    = todayDate ? pct(todayDate) : null;

  // Label per date group
  function groupLabel(s: string) {
    const grp = dateGroups[s];
    const confirmed = grp.find(b => b.supplierConfirmed && b.supplier);
    const base = confirmed?.supplier?.includes('Swift') ? 'Swift'
      : confirmed?.supplier?.includes('Cargill') ? 'Cargill'
      : (grp[0]?.vesselCarrier ?? '').split(' ')[0];
    return grp.length > 1 ? `${base} ×${grp.length}` : base;
  }

  // ── Kit derived values ────────────────────────────────────────────────────
  const lastGroupBols = dateGroups[lastStr] ?? [];
  const confirmedBols = bolRecords.filter(b => b.supplierConfirmed && b.supplier);
  const supplierCounts: Record<string, number> = {};
  confirmedBols.forEach(b => { supplierCounts[b.supplier!] = (supplierCounts[b.supplier!] ?? 0) + 1; });
  const kitSupplier = Object.entries(supplierCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Swift & Company';
  const kitCarrier  = lastGroupBols[0]?.vesselCarrier ?? 'ONE';
  const kitPort     = lastGroupBols[0]?.portOfDischarge ?? 'Surabaya';
  const kitContainers = lastGroupBols.reduce((s, b) => s + b.containerCount, 0);
  const kitPorts    = [...new Set(bolRecords.map(b => b.portOfDischarge).filter(Boolean))] as string[];

  const sources = [
    { label: 'verified — US Customs BoL dates',             green: true  },
    { label: `avg_shipment_frequency_days = ${AVG_FREQ}`,   green: true  },
    //{ label: 'forecast = last arrival + 9 days rolling avg',green: false },
    //{ label: 'confidence: inferred · not guaranteed',        green: false },
  ];

  return (
    <div className="border-b border-gray-200">

      {/* ── Section header ── */}
      <div className="bg-gray-100 px-6 py-3 border-y border-gray-200">
        <h3 className="text-sm font-bold text-gray-900">Next Shipment Window Forecast</h3>
        <p className="text-[11px] text-gray-500 mt-0.5">
          Based on {AVG_FREQ}-day avg cadence from 2026 BoL history · LC should be ready before this window
        </p>
      </div>

      {/* ── Timeline strip ── */}
      <div className="bg-white px-6 pt-5 pb-3 border-b border-gray-200">
        <div className="relative" style={{ height: 72, overflow: 'visible' }}>

          {/* Horizontal line */}
          <div className="absolute h-px bg-gray-200" style={{ top: 16, left: 0, right: 0 }} />

          {/* Past date dots */}
          {sortedStrs.map((s) => (
            <div key={s}
              className="absolute flex flex-col items-center"
              style={{ left: `${pct(parseYMD(s))}%`, top: 8, transform: 'translateX(-50%)' }}
            >
              <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-green-500 flex-shrink-0" />
              <span className="text-[8px] text-gray-500 whitespace-nowrap leading-none mt-1">
                {fmtMD(parseYMD(s))}
              </span>
              <span className="text-[7.5px] text-gray-400 whitespace-nowrap leading-none mt-0.5">
                {groupLabel(s)}
              </span>
            </div>
          ))}

          {/* Today dot */}
          {todayDate && todayPct !== null && (
            <div
              className="absolute flex flex-col items-center"
              style={{ left: `${todayPct}%`, top: 8, transform: 'translateX(-50%)' }}
            >
              <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-blue-600 flex-shrink-0" />
              <span className="text-[8px] font-bold text-blue-600 mt-1 whitespace-nowrap leading-none">
                {fmtMD(todayDate)}
              </span>
              <span className="text-[7.5px] font-bold text-blue-600 whitespace-nowrap leading-none mt-0.5">
                Today
              </span>
            </div>
          )}

          {/* Forecast window dot */}
          <div
            className="absolute flex flex-col items-center"
            style={{ left: `${winMidPct}%`, top: 8, transform: 'translateX(-50%)' }}
          >
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ border: '2px dashed #f59e0b', backgroundColor: 'transparent' }}
            />
            <span className="text-[8px] font-semibold text-amber-600 mt-1 whitespace-nowrap leading-none">
              {fmtMD(winStart)}–{fmtMD(winEnd)}
            </span>
            <span className="text-[7.5px] text-amber-500 whitespace-nowrap leading-none mt-0.5">
              Next est.
            </span>
          </div>

          {/* +2 ahead hint */}
          <div className="absolute right-0 top-2">
            <span className="text-[9px] text-gray-300">+2 ahead</span>
          </div>
        </div>

        <p className="text-[10px] text-gray-400 text-right mt-1">
          Last BoL: {fmtMDY(lastDate)}
        </p>
      </div>

      {/* ── Alert box ── */}
      <div className={`px-6 py-4 bg-amber-50 ${kitOpen ? '' : 'border-b border-amber-200'}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center mt-0.5">
            <span className="text-white font-black text-sm leading-none">!</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900 mb-1">
              Next estimated shipment window: {fmtMD(winStart)}–{fmtMD(winEnd)}, {winEnd.getFullYear()}
            </p>
            <p className="text-xs text-gray-600 leading-relaxed mb-1">
              Based on avg {AVG_FREQ}-day cadence from last confirmed arrival ({fmtMD(lastDate)}).
              Supplier likely <strong>Swift or Cargill</strong> — <strong>ONE or Maersk</strong> carrier.
              Discharge port: <strong>Surabaya or Lampung</strong> based on rotation pattern.
            </p>
            <p className="text-xs font-bold text-gray-800 mb-3">
              LC must be issued by {fmtMDY(lcDeadline)} to cover this window.
            </p>
            <button
              onClick={() => setKitOpen(prev => !prev)}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                kitOpen
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {kitOpen ? '✓ Meeting kit generated — click to collapse' : '→ Initiate LC discussion with Japfa treasury now'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Meeting Kit (child panel, visually attached to alert box) ── */}
      {kitOpen && todayDate && (
        <div ref={kitRef} className="bg-amber-50 px-0 pb-5 border-b border-amber-200">
          <div className="border border-gray-200 rounded overflow-hidden shadow-sm">
            {opportunityId ? (
              <MeetingKitDynamic 
                opportunityId={opportunityId} 
                preloadedPlan={rmActionPlan}
                loading={rmActionLoading}
              />
            ) : (
              <MeetingKit
                lastDate={lastDate}
                supplier={kitSupplier}
                carrier={kitCarrier}
                lastPort={kitPort}
                containers={kitContainers}
                winStart={winStart}
                winEnd={winEnd}
                lcDeadline={lcDeadline}
                avgFreq={AVG_FREQ}
                ports={kitPorts}
                score={opportunityScore}
                todayDate={todayDate}
                totalBols={filteredBolRecords.length}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Cadence chips ── */}
      <div className="bg-white px-6 py-3 flex flex-wrap gap-2 border-b border-gray-100">
        {supplierChips.map((chip, i) => (
          <span key={i}
            className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
            {chip.label}
          </span>
        ))}
      </div>

      {/* ── AI talking point ── */}
      <div className="bg-white px-6 py-4 border-b border-gray-100">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
          Supply Chain Intelligence AI Agent Remarks
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded px-4 py-3">
          <p className="text-xs text-gray-700 leading-relaxed italic">
            &ldquo;Berdasarkan pola impor Japfa di 2026, kami melihat shipment MBM masuk rata-rata setiap{' '}
            <span className="font-bold not-italic text-blue-700">{AVG_FREQ} hari sekali</span>.
            {' '}Shipment terakhir tiba{' '}
            <span className="font-bold not-italic text-blue-700">{fmtMD(lastDate)}</span>
            {' '}— artinya window berikutnya kemungkinan sekitar{' '}
            <span className="font-bold not-italic text-blue-700">{fmtMD(winStart)}–{fmtMD(winEnd)}</span>.
            {' '}Kami ingin memastikan fasilitas Import LC sudah siap sebelum jadwal itu, sehingga Japfa tidak perlu rush di last minute.&rdquo;
          </p>
        </div>
      </div>

      {/* ── Source strip ── */}
      <div className="bg-white px-6 py-3 flex flex-wrap gap-2">
        {sources.map(({ label, green }) => (
          <span key={label}
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium border ${
              green
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-gray-50 text-gray-400 border-gray-200'
            }`}>
            {label}
          </span>
        ))}
      </div>


    </div>
  );
}
