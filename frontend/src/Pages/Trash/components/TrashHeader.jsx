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
    <div className="bg-white rounded-xl p-3 px-4 mb-3.5 border border-gray-200 shadow-sm flex justify-between items-center flex-wrap gap-3">
      {/* Left: Title & Badge */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-xl text-red-600 shadow-sm">
          🗑️
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="m-0 text-base sm:text-lg font-bold text-gray-800 tracking-tight">
              Global Trash &amp; Data Recovery
            </h2>
            <span
              className={`py-0.5 px-2.5 rounded-full text-xs font-bold border ${
                totalTrashCount > 0
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
              }`}
            >
              {totalTrashCount} {totalTrashCount === 1 ? 'Record' : 'Records'}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            Centralized data recovery repository • Store and safely restore any deleted user records
          </div>
        </div>
      </div>

      {/* Center: Realtime Search */}
      <div className="min-w-[220px] max-w-[320px] flex-[1_1_220px]">
        <div className="relative flex items-center">
          <span className="absolute left-2.5 text-xs text-gray-400">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search trashed items by title, id, sku, amount..."
            className="w-full py-1.5 pl-8 pr-7 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 text-xs outline-none focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 bg-transparent border-0 text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
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
          className="bg-green-600 hover:bg-green-700 text-white border-0 py-1.5 px-3.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <span>🔄</span>
          <span>Restore All</span>
        </button>

        <button
          type="button"
          onClick={handleEmptyTrash}
          disabled={trashItems.length === 0 || isProcessing}
          title="Permanently wipe all records in this view"
          className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-1.5 px-3.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
          className="bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 py-1.5 px-2.5 rounded-lg text-xs cursor-pointer shadow-sm hover:border-gray-300 transition-all"
        >
          🔁
        </button>
      </div>
    </div>
  );
}
