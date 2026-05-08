'use client';

import ArrowBadge from '@/components/ui/ArrowBadge';
import { KPIMetrics } from '@/types';

interface KPIRowProps {
  data: KPIMetrics;
}

export default function KPIRow({ data }: KPIRowProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex divide-x divide-gray-200">
        {/* Card 1: Forecasted plan vs realization ($) */}
        <div className="flex-1 px-5 py-4 min-w-0">
          <p className="text-xs text-gray-500 mb-2">Forecasted plan vs realization ($)</p>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500">Realization</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-400 uppercase">USD</span>
            <span className="text-2xl font-bold text-gray-900">{data.revenueRealization} M</span>
            <ArrowBadge direction="up" />
          </div>
          <p className="text-xs text-gray-500 mb-0.5">Plan</p>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400 uppercase">USD</span>
            <span className="text-base font-semibold text-gray-600">{data.revenuePlan} M</span>
          </div>
        </div>

        {/* Card 2: Forecasted plan vs realization (Account) */}
        <div className="flex-1 px-5 py-4 min-w-0">
          <p className="text-xs text-gray-500 mb-2">Forecasted plan vs realization (Account)</p>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500">Realization</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl font-bold text-gray-900">{data.accountRealization}</span>
            <span className="text-sm font-medium text-gray-600">Accounts</span>
            <ArrowBadge direction="up" />
          </div>
          <p className="text-xs text-gray-500 mb-0.5">Plan</p>
          <div className="flex items-center gap-1">
            <span className="text-base font-semibold text-gray-600">{data.accountPlan}</span>
            <span className="text-xs text-gray-500">Account</span>
          </div>
        </div>

        {/* Card 3: Current Quarter vs Previous Quarter */}
        <div className="flex-1 px-5 py-4 min-w-0">
          <p className="text-xs text-gray-500 mb-1">Current Quarter vs Previous Quarter</p>
          <p className="text-xs text-gray-400 mb-2">Current Quarter ({data.currentQuarterLabel})</p>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-400 uppercase">USD</span>
            <span className="text-2xl font-bold text-gray-900">{data.currentQuarter} M</span>
            <ArrowBadge direction="down" />
          </div>
          <p className="text-xs text-gray-400 mb-0.5">Previous Quarter ({data.previousQuarterLabel})</p>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400 uppercase">USD</span>
            <span className="text-base font-semibold text-gray-600">{data.previousQuarter} M</span>
          </div>
        </div>

        {/* Card 4: Generated Leads */}
        <div className="flex-1 px-5 py-4 min-w-0 flex flex-col items-center justify-center">
          <p className="text-xs text-gray-500 mb-3 self-start">Generated Leads (for this month)</p>
          <p className="text-6xl font-black text-gray-900">{data.generatedLeads}</p>
          <p className="text-sm text-gray-500 mt-1">Leads</p>
        </div>

        {/* Card 5: Industry Top Performance */}
        <div className="flex-1 px-5 py-4 min-w-0">
          <p className="text-xs text-gray-500 mb-3">Industry Top Performance</p>
          <ol className="space-y-1">
            {data.topIndustries.map((industry, idx) => (
              <li key={industry} className="text-sm text-gray-700">
                {idx + 1}. {industry}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
