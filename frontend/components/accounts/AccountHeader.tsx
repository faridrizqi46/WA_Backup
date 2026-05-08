'use client';

import { AccountDetail } from '@/types';

interface AccountHeaderProps {
  account: AccountDetail;
}

function MetricChip({ label, value, direction }: { label: string; value: string; direction: 'up' | 'down' }) {
  const isUp = direction === 'up';
  const color = isUp ? 'text-green-600' : 'text-red-500';
  const arrow = isUp ? '▲' : '▼';

  return (
    <div className="flex items-center gap-2 border border-gray-200 rounded px-3 py-1.5 bg-white">
      <span className="text-xs text-gray-600 font-medium whitespace-nowrap">{label}</span>
      <span className={`text-xs font-bold ${color} whitespace-nowrap`}>{value}</span>
      <span className={`text-[10px] ${color}`}>{arrow}</span>
    </div>
  );
}

export default function AccountHeader({ account }: AccountHeaderProps) {
  return (
    <div className="bg-[#f0f2f5] border-b border-gray-200">
      {/* Company name card */}
      <div className="mx-6 mt-4 mb-3 border border-blue-400 rounded bg-white px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 21V7a2 2 0 012-2h4V3h6v2h4a2 2 0 012 2v14M9 21v-6h6v6" />
          </svg>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 italic leading-none mb-0.5">Account</p>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight leading-tight">{account.name}</h2>
        </div>
      </div>

      {/* Financial metrics row */}
      <div className="px-6 pb-3 flex flex-wrap gap-2">
        {account.financialMetrics.map((metric) => (
          <MetricChip key={metric.label} label={metric.label} value={metric.value} direction={metric.direction} />
        ))}
      </div>

      {/* Meta info row — stacked label/value */}
      <div className="flex items-start gap-8 px-6 pb-3 text-xs border-t border-gray-200 pt-3">
        <div>
          <p className="text-gray-400 mb-0.5">Legal ID</p>
          <p className="font-semibold text-gray-800">{account.layerId}</p>
        </div>
        <div>
          <p className="text-gray-400 mb-0.5">Company Industry</p>
          <p className="font-semibold text-gray-800">{account.industry}</p>
        </div>
        <div>
          <p className="text-gray-400 mb-0.5">Type</p>
          <p className="font-semibold text-gray-800">{account.type}</p>
        </div>
        <div>
          <p className="text-gray-400 mb-0.5">Segment</p>
          <p className="font-semibold text-gray-800">{account.segment}</p>
        </div>
        <div>
          <p className="text-gray-400 mb-0.5 flex items-center gap-1">
            ESG (S&P Global)
            <svg className="w-3 h-3 text-green-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 5.5-8 5.5-5 0-5 2.5-5 2.5 0-1.5 2-3 5-3z"/>
            </svg>
          </p>
          <p className="font-semibold text-gray-800">{account.cfoCount}</p>
        </div>
      </div>
    </div>
  );
}
