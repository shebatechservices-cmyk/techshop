import React from 'react';

export default function TrashTabs({
  MODULE_TABS,
  selectedModule,
  setSelectedModule,
  counts,
}) {
  return (
    <div className="bg-slate-900 rounded-xl p-1.5 mb-3.5 border border-slate-800 flex overflow-x-auto gap-1 scrollbar-thin">
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
                ? 'bg-sky-600 text-white font-extrabold'
                : 'bg-transparent text-slate-400 hover:text-slate-200 font-semibold'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            <span
              style={{
                backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : tabCount > 0 ? tab.color : '#334155',
              }}
              className="text-white rounded-full py-px px-1.5 text-[0.64rem] font-extrabold"
            >
              {tabCount}
            </span>
          </button>
        );
      })}
    </div>
  );
}
