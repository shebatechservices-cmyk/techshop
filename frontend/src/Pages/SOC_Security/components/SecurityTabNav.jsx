import React from 'react';

export default function SecurityTabNav({ currentTab, onTabChange, logs = [], users = [], roles = [], devices = [], ipRules = [] }) {
  const tabs = [
    { key: 'audit', label: '🛡️ SIEM Audit Trail', count: logs.length },
    { key: 'staff', label: '👥 Staff & Technician Logins', count: users.length },
    { key: 'roles', label: '🔑 Role & Permission Matrix', count: roles.length },
    { key: 'devices', label: '📱 Hardware Device IDs', count: devices.length },
    { key: 'firewall', label: '🌐 IP Firewall & Anti-Spam', count: ipRules.length },
  ];

  return (
    <div className="flex gap-2 border-b border-slate-200 mb-5 flex-wrap">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.key;
        return (
          <button
            type="button"
            key={tab.key}
            onClick={() => onTabChange && onTabChange(tab.key)}
            className={`px-4.5 py-2.5 font-bold text-sm cursor-pointer flex items-center gap-2 -mb-px transition-colors border-0 bg-transparent border-b-2 ${
              isActive
                ? 'text-rose-600 border-rose-600 font-extrabold'
                : 'text-slate-500 hover:text-slate-800 border-transparent font-medium'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-xs font-extrabold ${
                isActive ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
