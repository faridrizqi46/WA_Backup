'use client';

import Link from 'next/link';

const TABS = [
  { label: 'Home',          href: '/',             live: true  },
  { label: 'Opportunities', href: '/opportunities', live: false },
  { label: 'Accounts',      href: '/accounts',      live: false },
  { label: 'Contacts',      href: '/contacts',      live: false },
  { label: 'GIS',           href: '/gis',           live: false },
];

interface TabNavProps {
  activeTab?: string;
}

export default function TabNav({ activeTab }: TabNavProps) {
  const active = activeTab ?? 'Home';

  return (
    <nav className="bg-white border-b border-gray-200 px-6">
      <ul className="flex gap-0">
        {TABS.map((tab) => (
          <li key={tab.label}>
            {tab.live ? (
              <Link
                href={tab.href}
                className={`block px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  active === tab.label
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </Link>
            ) : (
              <div className="relative group">
                <span className="block px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-400 cursor-not-allowed select-none">
                  {tab.label}
                </span>
                <span className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 bg-gray-800 text-white text-[10px] px-2 py-1 rounded
                  opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-50">
                  Coming Soon
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
