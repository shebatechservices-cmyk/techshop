import React from 'react';

export default function TrashHeader({
  totalTrashCount,
  searchQuery,
  setSearchQuery,
  handleRestoreAll,
  handleEmptyTrash,
  trashItems,
  isProcessing,
  loadCounts,
  loadTrash,
  selectedModule,
}) {
  return (
    <div className="bg-slate-800 rounded-xl p-2.5 px-4 mb-3.5 border border-slate-700 flex justify-between items-center flex-wrap gap-3">
      {/* Left: Title & Badge */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-xl shadow-lg shadow-red-500/30">
          🗑️
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="m-0 text-lg font-extrabold text-white tracking-wide">
              Global Trash &amp; Data Recovery
            </h2>
            <span
              className={`text-white py-0.5 px-2 rounded-full text-xs font-extrabold ${
                totalTrashCount > 0 ? 'bg-red-500' : 'bg-slate-700'
              }`}
            >
              {totalTrashCount} {totalTrashCount === 1 ? 'Record' : 'Records'}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            গ্লোবাল ট্র্যাশ ও ডেটা পুনরুদ্ধার কেন্দ্র • Store and safely restore any deleted user records
          </div>
        </div>
      </div>

      {/* Center: Realtime Search */}
      <div className="min-w-[220px] max-w-[320px] flex-[1_1_220px]">
        <div className="relative flex items-center">
          <span className="absolute left-2.5 text-sm text-slate-400">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search trashed items by title, id, sku, amount..."
            className="w-full py-1.5 pl-8 pr-7 bg-slate-900 border border-slate-600 rounded-lg text-white text-xs outline-none focus:border-sky-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 bg-transparent border-0 text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Right: Global Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleRestoreAll}
          disabled={trashItems.length === 0 || isProcessing}
          title="Restore all records in this view back to their original tables"
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 py-1.5 px-3.5 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <span>🔄</span>
          <span>Restore All</span>
        </button>

        <button
          type="button"
          onClick={handleEmptyTrash}
          disabled={trashItems.length === 0 || isProcessing}
          title="Permanently wipe all records in this view"
          className="bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500 py-1.5 px-3.5 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <span>⚠️</span>
          <span>Empty Trash</span>
        </button>

        <button
          type="button"
          onClick={() => {
            loadCounts();
            loadTrash(selectedModule, searchQuery);
          }}
          title="Sync & refresh trash records"
          className="bg-slate-900 hover:bg-slate-950 text-slate-400 border border-slate-700 py-1.5 px-2.5 rounded-lg text-xs cursor-pointer transition-colors"
        >
          🔁
        </button>
      </div>
    </div>
  );
}
