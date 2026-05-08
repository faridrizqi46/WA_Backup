'use client';

import { CompanyNode } from '@/types';

interface CompanyTreeProps {
  nodes: CompanyNode[];
}

export default function CompanyTree({ nodes }: CompanyTreeProps) {
  return (
    <div className="bg-white rounded-sm">
      <div className="px-6 pt-5 pb-2">
        <h3 className="text-sm font-bold text-gray-900">Company Tree</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-y border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left font-semibold text-gray-700 w-[30%]">Company Name</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 w-[12%]">Ownership Type</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 w-[20%]">City</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 w-[14%]">State or Province</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 w-[12%]">Country</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 w-[12%]">BRI Product</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {nodes.map((node, idx) => {
              const isAnchor = !!node.isAnchor;
              const indentPx = node.indent ? node.indent * 16 : 0;
              const prefixChar = node.prefix ?? null;

              return (
                <tr
                  key={idx}
                  className={isAnchor ? 'bg-blue-500' : 'hover:bg-gray-50 transition-colors'}
                >
                  <td className="px-6 py-2.5">
                    <span
                      style={{ paddingLeft: indentPx ? `${indentPx}px` : undefined }}
                      className={isAnchor ? 'text-white font-semibold' : 'text-gray-800'}
                    >
                      {prefixChar ? <span className="mr-1 text-gray-400">{prefixChar}</span> : null}
                      <span className={isAnchor ? 'text-white' : 'text-gray-800'}>
                        {node.name}
                      </span>
                    </span>
                  </td>
                  <td className={`px-4 py-2.5 ${isAnchor ? 'text-blue-100' : 'text-gray-600'}`}>
                    {node.ownershipType}
                  </td>
                  <td className={`px-4 py-2.5 ${isAnchor ? 'text-blue-100' : 'text-gray-600'}`}>
                    {node.city}
                  </td>
                  <td className={`px-4 py-2.5 ${isAnchor ? 'text-blue-100' : 'text-gray-600'}`}>
                    {node.stateProvince}
                  </td>
                  <td className={`px-4 py-2.5 ${isAnchor ? 'text-blue-100' : 'text-gray-600'}`}>
                    {node.country}
                  </td>
                  <td className="px-4 py-2.5">
                    {node.ibrProduct ? (
                      <span
                        className={
                          isAnchor
                            ? 'text-white font-medium'
                            : node.ibrProduct === 'Non-Bri'
                            ? 'text-gray-400'
                            : 'text-gray-800 font-medium'
                        }
                      >
                        {node.ibrProduct}
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
