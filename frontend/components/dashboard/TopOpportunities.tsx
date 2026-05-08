'use client';

import ConfidenceBadge from '@/components/ui/ConfidenceBadge';
import Link from 'next/link';
import { Opportunity } from '@/types';

interface TopOpportunitiesProps {
  data: Opportunity[];
}

export default function TopOpportunities({ data }: TopOpportunitiesProps) {
  return (
    <div className="bg-white rounded-sm">
      <div className="px-6 pt-5 pb-4">
        <h2 className="text-base font-semibold text-gray-800">Top Opportunities</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left font-semibold text-gray-600 w-[35%]">Offered Product</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 w-[22%]">Account / Company</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-600 w-[14%]">Potential Value</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 w-[15%]">Offer Generated Date</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 w-[14%]">Confidence Level</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((opp, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3 text-blue-600 cursor-pointer hover:underline">{opp.product}</td>
                <td className="px-4 py-3">
                    <Link href={`/accounts/${opp.companySlug}`} className="text-blue-600 cursor-pointer hover:underline">
                      {opp.company}
                    </Link>
                  </td>
                <td className="px-4 py-3 text-right text-gray-700 font-medium">
                  {opp.potentialValue.toFixed(2)} M USD
                </td>
                <td className="px-4 py-3 text-gray-600">{opp.offerDate}</td>
                <td className="px-4 py-3">
                  <ConfidenceBadge level={opp.confidence} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
