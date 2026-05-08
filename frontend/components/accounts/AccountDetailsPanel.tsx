'use client';

import { useState } from 'react';
import AccountInformation from './AccountInformation';
import CompanyTree from './CompanyTree';
import KeyHighlight from './KeyHighlight';
import ValueChainDynamic from './ValueChainDynamic';
import InsightsRelated from './InsightsRelated';
import { AccountDetail } from '@/types';

const TABS = ['Details', 'Insights & Related'];

interface AccountDetailsPanelProps {
  account: AccountDetail;
}

export default function AccountDetailsPanel({ account }: AccountDetailsPanelProps) {
  const [active, setActive] = useState('Details');

  console.log('[AccountDetailsPanel] account.id:', account.id);

  return (
    <div>
      {/* Tab strip */}
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

      {/* Tab content */}
      <div className="px-6 py-4 flex flex-col gap-4">
        {active === 'Details' && (
          <>
            <AccountInformation account={account} />
            <CompanyTree nodes={account.companyTree} />
            <KeyHighlight text={account.keyHighlight} />
            <ValueChainDynamic accountId={account.id} />
            {console.log('[AccountDetailsPanel] Rendering ValueChainDynamic with accountId:', account.id)}
          </>
        )}
        {active === 'Insights & Related' && (
          <InsightsRelated account={account} />
        )}
      </div>
    </div>
  );
}
