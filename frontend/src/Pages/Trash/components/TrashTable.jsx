import React from 'react';

export default function TrashTable({
  trashItems,
  loading,
  selectedIds,
  handleToggleSelect,
  handleSelectAll,
  handleBatchRestore,
  handleBatchDelete,
  handleRestore,
  handlePermanentDelete,
  setPreviewItem,
  isProcessing,
  searchQuery,
  selectedModule,
}) {
  return (
    <>
      {/* Batch Action Toolbar (When items selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-sky-400 rounded-xl py-2 px-4 mb-3 flex justify-between items-center animate-fadeIn shadow-lg">
          <span className="text-xs font-bold text-sky-400">
            ✓ {selectedIds.length} {selectedIds.length === 1 ? 'item' : 'items'} selected
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleBatchRestore}
              className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 py-1.5 px-3.5 rounded-md text-xs font-bold cursor-pointer transition-colors"
            >
              ↩ Restore Selected
            </button>
            <button
              type="button"
              onClick={handleBatchDelete}
              className="bg-red-600 hover:bg-red-700 text-white border-0 py-1.5 px-3.5 rounded-md text-xs font-bold cursor-pointer transition-colors"
            >
              🗑️ Delete Selected Permanently
            </button>
          </div>
        </div>
      )}

      {/* Main Trash Data Table & Cards */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 px-5 text-center text-slate-400">
            <div className="w-8 h-8 border-[3px] border-slate-700 border-t-sky-400 rounded-full mx-auto mb-3 animate-spin" />
            <span className="text-sm font-semibold">Loading global trash records...</span>
          </div>
        ) : trashItems.length === 0 ? (
          <div className="py-16 px-5 text-center">
            <div className="text-5xl mb-2.5">✨</div>
            <h3 className="m-0 mb-1.5 text-lg text-white font-bold">Recycle Bin is Clean!</h3>
            <p className="m-0 text-xs text-slate-400">
              {searchQuery
                ? `No trashed items matched "${searchQuery}".`
                : selectedModule === 'all'
                ? 'There are currently no deleted records in the system.'
                : `No deleted items in ${selectedModule}.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-700 text-slate-400 text-[0.75rem] uppercase tracking-wider">
                  <th className="py-2.5 px-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === trashItems.length && trashItems.length > 0}
                      onChange={handleSelectAll}
                      className="cursor-pointer accent-sky-600"
                    />
                  </th>
                  <th className="py-2.5 px-3 w-[70px]">ID</th>
                  <th className="py-2.5 px-3.5 w-[140px]">Module / Type</th>
                  <th className="py-2.5 px-3.5">Record Details &amp; Summary</th>
                  <th className="py-2.5 px-3.5 w-[160px]">Deleted Date</th>
                  <th className="py-2.5 px-3.5 w-[100px]">Deleted By</th>
                  <th className="py-2.5 px-4 w-[190px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trashItems.map((item) => {
                  const itemKey = `${item.module}_${item.id}`;
                  const isSelected = selectedIds.includes(itemKey);
                  return (
                    <tr
                      key={itemKey}
                      className={`border-b border-slate-700/50 transition-colors ${
                        isSelected ? 'bg-sky-600/15' : 'bg-transparent hover:bg-slate-700/30'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 px-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(itemKey)}
                          className="cursor-pointer accent-sky-600"
                        />
                      </td>

                      {/* ID */}
                      <td className="py-2.5 px-3 font-extrabold text-slate-400">#{item.id}</td>

                      {/* Module Badge */}
                      <td className="py-2.5 px-3.5">
                        <span className="bg-slate-900 text-sky-400 border border-slate-700 py-1 px-2 rounded-md text-[0.72rem] font-bold inline-flex items-center gap-1.5 whitespace-nowrap">
                          <span>{item.icon || '📦'}</span>
                          <span>{item.module_label || item.module}</span>
                        </span>
                      </td>

                      {/* Title & Subtitle */}
                      <td className="py-2.5 px-3.5">
                        <div className="font-bold text-slate-100 text-sm flex items-center gap-2">
                          <span>{item.title}</span>
                          <button
                            type="button"
                            onClick={() => setPreviewItem(item)}
                            title="Inspect raw data record"
                            className="bg-transparent border-0 text-sky-400 hover:text-sky-300 cursor-pointer p-0 text-xs underline"
                          >
                            [Inspect]
                          </button>
                        </div>
                        <div className="text-slate-400 text-xs mt-0.5">{item.subtitle}</div>
                      </td>

                      {/* Deleted Date */}
                      <td className="py-2.5 px-3.5 text-red-400 text-xs whitespace-nowrap">
                        {item.deleted_at ? new Date(item.deleted_at).toLocaleString() : 'Recently'}
                      </td>

                      {/* Deleted By */}
                      <td className="py-2.5 px-3.5 text-slate-300 text-xs">
                        {item.deleted_by || 'Admin'}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-2.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* 1-Click Restore Button */}
                          <button
                            type="button"
                            onClick={() => handleRestore(item)}
                            disabled={isProcessing}
                            title="Restore this record back to active state"
                            className="bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 py-1 px-2.5 rounded-md text-xs font-bold cursor-pointer flex items-center gap-1 shadow-sm shadow-emerald-500/25 disabled:opacity-50 transition-all"
                          >
                            <span>↩</span>
                            <span>Restore</span>
                          </button>

                          {/* Permanent Delete Button */}
                          <button
                            type="button"
                            onClick={() => handlePermanentDelete(item)}
                            disabled={isProcessing}
                            title="Permanently erase this record"
                            className="bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/40 py-1 px-2.5 rounded-md text-xs font-bold cursor-pointer flex items-center gap-1 disabled:opacity-50 transition-colors"
                          >
                            <span>🗑️</span>
                            <span>Wipe</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
