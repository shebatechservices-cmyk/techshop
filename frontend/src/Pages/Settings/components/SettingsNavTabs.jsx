import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

export default function SettingsNavTabs(props) {
  const context = useSettings();
  const visibleTabs = props.visibleTabs ?? context.visibleTabs ?? [];
  const activeTabId = props.activeTabId ?? context.activeTabId ?? 'shop';
  const activeTriggersCount = props.activeTriggersCount ?? context.activeTriggersCount ?? 0;
  return (
    <div className="flex gap-1 bg-slate-200/70 p-1 rounded-xl mb-4 overflow-x-auto items-center">
      {visibleTabs.map((tab) => {
        const isActive = activeTabId === tab.id;
        return (
          <Link
            key={tab.id}
            to={`/${tab.id}`}
            className={`no-underline px-3.5 py-1.5 rounded-lg font-semibold text-xs sm:text-sm cursor-pointer flex items-center gap-1.5 whitespace-nowrap transition-all ${
              isActive
                ? 'bg-white text-sky-600 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <span>{tab.label}</span>
            {tab.id === 'sms' && activeTriggersCount > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                  isActive ? 'bg-sky-100 text-sky-600' : 'bg-slate-300 text-slate-700'
                }`}
              >
                {activeTriggersCount}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
