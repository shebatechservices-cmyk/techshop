import React from 'react';

const DEV_TABS = [
  { id: 'about', label: '🖥️ System & Terminals' },
  { id: 'users_manager', label: '👥 Users & Staff' },
  { id: 'security', label: '🔐 Dev Security & Shortcuts' },
  { id: 'admin_auth', label: '🛡️ Admin Credentials' },
  { id: 'licensing', label: '📜 Licenses' },
  { id: 'force_data', label: '⚠️ Force DB Overrides' },
  { id: 'updates', label: '🔄 Updates' },
  { id: 'maintenance', label: '🧹 Maintenance' },
];

export default function DevModalTabsNav({ activeTab, setActiveTab, usersCount }) {
  return (
    <div className="flex bg-slate-950 border-b border-slate-800 px-4 overflow-x-auto">
      {DEV_TABS.map((tab) => {
        const label = tab.id === 'users_manager' && usersCount !== undefined
          ? `👥 Users & Staff (${usersCount})`
          : tab.label;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-3.5 text-xs font-bold whitespace-nowrap transition-colors border-b-2 cursor-pointer bg-transparent border-0 ${
              activeTab === tab.id
                ? 'border-b-2 border-sky-500 text-sky-400 bg-sky-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
