import React from 'react';

export default function TrashTabs({
  MODULE_TABS,
  selectedModule,
  setSelectedModule,
  counts,
}) {
  return (
    <div className="bg-white rounded-xl p-1.5 mb-3.5 border border-gray-200 shadow-sm flex overflow-x-auto gap-1 scrollbar-thin">
      {MODULE_TABS.map((tab) => {
        const tabCount = counts[tab.key] ?? 0;
        const isActive = selectedModule === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSelectedModule(tab.key)}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg border-0 text-xs whitespace-nowrap cursor-pointer transition-all ${
              isActive
                ? 'bg-green-600 text-white font-bold shadow-sm'
                : 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            <span
              className={`rounded-full py-0.5 px-1.5 text-[0.65rem] font-bold ${
                isActive
                  ? 'bg-white/25 text-white'
                  : tabCount > 0
                  ? 'bg-gray-100 text-gray-700 border border-gray-200'
                  : 'bg-gray-50 text-gray-400'
              }`}
            >
              {tabCount}
            </span>
          </button>
        );
      })}
    </div>
  );
}
