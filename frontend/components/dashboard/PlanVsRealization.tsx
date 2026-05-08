'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { IndustryData } from '@/types';

interface PlanVsRealizationProps {
  data: IndustryData[];
}

const TABS = ['Industries', 'Region', 'History Leads'];

const CHART_PLAN_COLOR = '#9e9e9e';
const CHART_REALIZATION_COLOR = '#1976d2';

function formatMillions(value: number): string {
  if (value >= 1) return `${value.toFixed(2)} M`;
  return `${(value * 1000).toFixed(0)} K`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomLabel(props: any) {
  const { x, y, width, value } = props;
  if (!value || width < 5) return null;
  return (
    <text x={x + width + 4} y={y + 10} fontSize={10} fill="#555" textAnchor="start">
      {formatMillions(value)}
    </text>
  );
}

export default function PlanVsRealization({ data }: PlanVsRealizationProps) {
  const [activeTab, setActiveTab] = useState('Industries');

  const chartHeight = data.length * 38 + 40;

  return (
    <div className="bg-white rounded-sm mb-4">
      <div className="px-6 pt-5 pb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">Plan vs Realization</h2>
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b border-gray-200 px-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? 'border-blue-500 bg-blue-500 text-white rounded-t'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="px-4 pt-4 pb-2">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 0, right: 80, left: 230, bottom: 0 }}
            barCategoryGap="30%"
            barGap={2}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={220}
              tick={{ fontSize: 11, fill: '#555' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => (typeof value === 'number' ? formatMillions(value) : value)}
              contentStyle={{ fontSize: 12 }}
            />
            <Bar dataKey="realization" fill={CHART_REALIZATION_COLOR} name="Realization" radius={[0, 2, 2, 0]}>
              <LabelList content={<CustomLabel />} />
            </Bar>
            <Bar dataKey="plan" fill={CHART_PLAN_COLOR} name="Plan" radius={[0, 2, 2, 0]}>
              <LabelList content={<CustomLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center justify-end gap-4 mt-3 pr-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_PLAN_COLOR }} />
            <span className="text-xs text-gray-500">Plan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_REALIZATION_COLOR }} />
            <span className="text-xs text-gray-500">Realization</span>
          </div>
        </div>
      </div>
    </div>
  );
}
