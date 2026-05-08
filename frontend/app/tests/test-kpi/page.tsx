'use client';

import { useState } from 'react';

interface KPIRow {
  opportunityId: string;
  name: string;
  value: number;
  unit: string;
  property: string;
}

export default function TestKPIPage() {
  const [oppId, setOppId] = useState('');
  const [result, setResult] = useState<KPIRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    if (!oppId.trim()) {
      setError('Please enter opportunity ID');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/kpi/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId: oppId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch KPIs');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const primaryStats = result?.filter(r => r.property === 'primaryStats') || [];
  const secondaryStats = result?.filter(r => r.property === 'secondaryStats') || [];
  const otherStats = result?.filter(r => r.property === 'other') || [];
  const supplierShipmentRow = otherStats.find(r => r.name === 'Supplier Shipment');
  let supplierData: any[] = [];
  if (supplierShipmentRow) {
    const val = supplierShipmentRow.value;
    if (Array.isArray(val)) {
      supplierData = val;
    } else if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        supplierData = Array.isArray(parsed) ? parsed : [];
      } catch {
        supplierData = [];
      }
    }
  }

  const displayValue = (val: any) => {
    if (typeof val === 'number') return val;
    if (Array.isArray(val)) return JSON.stringify(val);
    return val ?? '-';
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa] p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-[#1a2436] mb-6">
          Trade Intelligence KPI Test
        </h1>

        {/* Input Section */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={oppId}
              onChange={(e) => setOppId(e.target.value)}
              placeholder="Enter Opportunity ID..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleTest()}
            />
            <button
              onClick={handleTest}
              disabled={loading}
              className="px-6 py-2 bg-[#1a2436] text-white rounded-lg disabled:opacity-50 hover:bg-[#2a3446] transition-colors"
            >
              {loading ? 'Loading...' : 'Get KPIs'}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-red-600 text-sm">{error}</p>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">

            {/* Primary Stats */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Primary Stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {primaryStats.map((row, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">{row.name}</p>
                    <p className="text-xl font-bold text-[#1a2436]">
                      {row.value}
                      <span className="text-xs font-normal text-gray-400 ml-1">{row.unit}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Secondary Stats */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Secondary Stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {secondaryStats.map((row, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">{row.name}</p>
                    <p className="text-xl font-bold text-[#1a2436]">
                      {row.value}
                      <span className="text-xs font-normal text-gray-400 ml-1">{row.unit}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Other Stats */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Other Stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {otherStats.filter(r => r.name !== 'Supplier Shipment').map((row, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">{row.name}</p>
                    <p className="text-xl font-bold text-[#1a2436]">
                      {row.value}
                      <span className="text-xs font-normal text-gray-400 ml-1">{row.unit}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Supplier Shipments Table */}
            {supplierData.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">
                  Supplier Shipments ({supplierData.length} suppliers)
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Supplier</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">Shipments</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">Containers</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">Avg Frequency (days)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplierData.map((supplier: any, i: number) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3 font-medium text-gray-800">{supplier.supplierName}</td>
                          <td className="py-2 px-3 text-right text-gray-600">{supplier.details.shipment}</td>
                          <td className="py-2 px-3 text-right text-gray-600">{supplier.details.container}</td>
                          <td className="py-2 px-3 text-right text-gray-600">{supplier.details.avgGapBetweenShipment}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Raw JSON */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Raw JSON Result</h2>
              <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto max-h-96 whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!result && !loading && !error && (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <p className="text-gray-500">
              Enter an Opportunity ID and click "Get KPIs" to see trade intelligence metrics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}