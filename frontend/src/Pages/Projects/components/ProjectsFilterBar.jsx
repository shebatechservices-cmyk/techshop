import React from 'react';

export default function ProjectsFilterBar({
  searchQuery,
  setSearchQuery,
  stageFilter,
  setStageFilter,
}) {
  return (
    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex justify-between items-center flex-wrap gap-2.5">
      <div className="relative flex-1 min-w-[260px] max-w-md">
        <input
          type="text"
          placeholder="সার্চ করুন: প্রজেক্ট কোড, টাইটেল, কাস্টমার, ইনভয়েস নং, টেকনিশিয়ান..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {['all', 'assigned', 'accepted', 'in_progress', 'completed'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStageFilter(st)}
            className={`px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              stageFilter === st
                ? 'border border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            {st}
          </button>
        ))}
      </div>
    </div>
  );
}
