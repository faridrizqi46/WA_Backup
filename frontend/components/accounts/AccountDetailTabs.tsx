'use client';

import { useState } from 'react';

const TABS = ['Details', 'Insights & Related'];

interface AccountDetailTabsProps {
  children: (activeTab: string) => React.ReactNode;
}

export default function AccountDetailTabs({ children }: AccountDetailTabsProps) {
  const [active, setActive] = useState('Details');

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-6">
        <ul className="flex gap-0">
          {TABS.map((tab) => (
            <li key={tab}>
              <button
                onClick={() => setActive(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  active === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div>{children(active)}</div>
    </div>
  );
}
