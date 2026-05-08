'use client';

import { useState, useEffect } from 'react';
import { TradeIntelligenceBrief, TradeIntelStat, RMActionPlanResult } from '@/types';
import XaiScoringPanel from './XaiScoringPanel';
import ShipmentWindowForecast from './ShipmentWindowForecast';

interface Props {
  brief: TradeIntelligenceBrief;
  opportunityId?: string;
}

interface KPITableRow {
  id: string;
  opportunityId: string;
  name: string;
  value: unknown;
  unit: string;
  property: string;
}

const PAGE_SIZE = 10;

function buildRefURL(bolNumber: string): string {
  const prefix = bolNumber.slice(0, 4);
  const suffix = bolNumber.slice(4);
  if (prefix === 'ONEY') return `https://ecomm.one-line.com/one-ecom/manage-shipment/cargo-tracking?trakNoParam=${suffix}`;
  if (prefix === 'MAEU') return `https://www.maersk.com/tracking/${suffix}`;
  return 'https://www.msc.com/en/track-a-shipment';
}

function getValueDisplay(val: unknown): string {
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'string') return val;
  return '-';
}

export default function TradeIntelligenceBriefPanel({ brief, opportunityId }: Props) {
  const [page, setPage] = useState(0);
  const [kpiRows, setKpiRows] = useState<KPITableRow[]>([]);
  const [rmActionPlan, setRmActionPlan] = useState<RMActionPlanResult | null>(null);
  const [rmActionLoading, setRmActionLoading] = useState(false);

  useEffect(() => {
    if (!opportunityId) return;

    fetch(`/api/kpi/results?opportunityId=${encodeURIComponent(opportunityId)}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setKpiRows(data);
        }
      })
      .catch(console.error);
  }, [opportunityId]);

  useEffect(() => {
    if (!opportunityId) return;

    setRmActionLoading(true);
    fetch(`/api/kpi/rm-action-plan?opportunityId=${encodeURIComponent(opportunityId)}`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setRmActionPlan(data);
        }
      })
      .catch(console.error)
      .finally(() => setRmActionLoading(false));
  }, [opportunityId]);

  const kpiPrimaryStats: TradeIntelStat[] = kpiRows
    .filter(r => r.property === 'primaryStats')
    .map(r => ({ label: r.name, value: getValueDisplay(r.value), unit: r.unit }));

  const kpiSecondaryStats: TradeIntelStat[] = kpiRows
    .filter(r => r.property === 'secondaryStats')
    .map(r => ({ label: r.name, value: getValueDisplay(r.value), unit: r.unit }));

  const supplierChips: { label: string }[] = [];
  const otherRows = kpiRows.filter(r => r.property === 'other');
  const supplierRow = otherRows.find(r => r.name === 'Supplier Shipment');
  if (supplierRow?.value) {
    try {
      const suppliers = Array.isArray(supplierRow.value) ? supplierRow.value : JSON.parse(String(supplierRow.value));
      for (const s of suppliers) {
        supplierChips.push(
          { label: `${s.supplierName}: ${s.details.container} containers` },
          { label: `${s.supplierName}: every ~${s.details.avgGapBetweenShipment} days` }
        );
      }
    } catch { /* ignore */ }
  }

  const useKPIData = kpiRows.length > 0;

  const primaryStats = useKPIData ? kpiPrimaryStats : brief.primaryStats;
  const secondaryStats = useKPIData ? kpiSecondaryStats : brief.secondaryStats;

  const sortedBolRecords = [...brief.bolRecords].sort((a, b) => b.arrivalDate.localeCompare(a.arrivalDate));
  const totalWeight     = sortedBolRecords.reduce((s, b) => s + b.grossWeightKgs, 0);
  const totalContainers = sortedBolRecords.reduce((s, b) => s + b.containerCount, 0);
  const totalPages = Math.ceil(sortedBolRecords.length / PAGE_SIZE);
  const paginatedRecords = sortedBolRecords.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-0">

      {/* ── Header bar ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                Supply Chain Intelligence
              </span>
              <span className="text-blue-500 text-xs">✦</span>
            </div>
            <h2 className="text-base font-bold text-gray-900 leading-snug">{brief.title}</h2>
            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{brief.agentLabel}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Data Range</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">{brief.dataRange}</p>
            <p className="text-[10px] text-gray-400 mt-2 max-w-[220px] leading-snug text-right">
              {brief.coverageNote}
            </p>
          </div>
        </div>
      </div>

      {/* ── Primary stats (4 boxes — first 2 dark navy, rest gray) ────────── */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="grid grid-cols-4 gap-3">
          {primaryStats.map((s, i) => {
            const hero = i < 2;
            return (
              <div
                key={i}
                className={`rounded px-5 py-4 ${
                  hero
                    ? 'bg-[#1e3a6e] border border-[#162f5c]'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <p className={`text-[9px] font-semibold uppercase tracking-widest mb-2 ${
                  hero ? 'text-blue-300' : 'text-gray-400'
                }`}>
                  {s.label}
                </p>
                <p className={`font-black leading-none ${
                  hero ? 'text-4xl text-white' : 'text-3xl text-gray-900'
                }`}>
                  {s.value}
                </p>
                {s.unit && (
                  <p className={`text-[10px] mt-1.5 ${hero ? 'text-blue-300' : 'text-gray-400'}`}>
                    {s.unit}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Secondary stats (4 boxes — gray platform style) ───────────────── */}
      <div className="bg-gray-50 px-6 pb-5 pt-0 border-b border-gray-200">
        <div className="grid grid-cols-4 gap-3">
          {secondaryStats.map((s, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded px-5 py-3">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                {s.label}
              </p>
              <p className="text-xl font-black text-gray-900 leading-none">{s.value}</p>
              {s.unit && <p className="text-[10px] text-gray-400 mt-1">{s.unit}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* ── XAI Scoring ─────────────────────────────────────────────────────── */}
      {brief.xaiScoring && <XaiScoringPanel xai={brief.xaiScoring} dataLineage={brief.dataLineage} />}

      {/* ── Shipment Window Forecast ─────────────────────────────────────────── */}
      <ShipmentWindowForecast bolRecords={brief.bolRecords} opportunityScore={brief.xaiScoring?.overallScore} supplierChips={supplierChips} opportunityId={opportunityId} rmActionPlan={rmActionPlan} rmActionLoading={rmActionLoading} />

      {/* ── BoL Records Table ───────────────────────────────────────────────── */}
      <div>
        <div className="bg-gray-100 px-6 py-3 border-y border-gray-200">
          <h3 className="text-sm font-bold text-gray-900">
            2026 Confirmed Shipments — Japfa · Swift &amp; Related Suppliers
          </h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Sourced from US Customs manifest records · Processed by InsightBank™ BoL Analytics Engine
          </p>
        </div>
        <div className="bg-white overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-500 w-6">#</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500">BoL Number</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500">Arrival</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500">Supplier</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500">Product</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-500">Weight (KGs)</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-500">Containers</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500">Port of Discharge</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500">Carrier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedRecords.map((bol, i) => {
                const refURL = bol.refURL || buildRefURL(bol.bolNumber);
                return (
                  <tr key={`${bol.bolNumber}-${i}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 font-medium">{page * PAGE_SIZE + i + 1}</td>
                    <td className="px-4 py-3">
                      <a
                        href={refURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[11px] text-blue-600 hover:text-blue-800 font-semibold tracking-tight underline"
                      >
                        {bol.bolNumber}
                      </a>
                    </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{bol.arrivalDate}</td>
                  <td className="px-4 py-3">
                    {bol.supplierConfirmed && bol.supplier ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        bol.supplier.includes('Swift')
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {bol.supplier}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500">
                        Unattributed
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{bol.productShort}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {bol.grossWeightKgs.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">{bol.containerCount}</td>
                  <td className="px-4 py-3 text-gray-600">{bol.portOfDischarge ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-[11px]">{bol.vesselCarrier}</td>
                </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-50">
                <td colSpan={5} className="px-4 py-2.5 text-[10px] text-gray-400 italic">
                  {brief.tableSummaryNote}
                </td>
                <td className="px-4 py-2.5 text-right font-black text-gray-800 text-xs">
                  ~{totalWeight.toLocaleString()}
                </td>
                <td className="px-4 py-2.5 text-right font-black text-gray-800 text-xs">
                  {totalContainers}
                </td>
                <td colSpan={2} className="px-4 py-2.5 text-[10px] text-gray-400">—</td>
              </tr>
            </tfoot>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sortedBolRecords.length)} of {sortedBolRecords.length} shipments
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 text-xs border border-gray-300 rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                ‹ Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`px-3 py-1 text-xs border rounded ${
                    i === page ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]' : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="px-3 py-1 text-xs border border-gray-300 rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next ›
              </button>
            </div>
          </div>
        )}
      </div>


    </div>
  );
}