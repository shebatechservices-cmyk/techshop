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
        <div className="bg-green-50 border border-green-200 rounded-xl py-2 px-4 mb-3.5 flex justify-between items-center animate-fadeIn shadow-sm">
          <span className="text-xs font-bold text-green-800 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-[0.65rem]">✓</span>
            <span>{selectedIds.length} {selectedIds.length === 1 ? 'item' : 'items'} selected</span>
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleBatchRestore}
              className="bg-green-600 hover:bg-green-700 text-white border-0 py-1.5 px-3.5 rounded-md text-xs font-bold cursor-pointer shadow-sm transition-colors"
            >
              ↩ Restore Selected
            </button>
            <button
              type="button"
              onClick={handleBatchDelete}
              className="bg-red-600 hover:bg-red-700 text-white border-0 py-1.5 px-3.5 rounded-md text-xs font-bold cursor-pointer shadow-sm transition-colors"
            >
              🗑️ Delete Selected Permanently
            </button>
          </div>
        </div>
      )}

      {/* Main Trash Data Table & Cards */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 px-5 text-center text-gray-500">
            <div className="w-8 h-8 border-[3px] border-gray-200 border-t-green-600 rounded-full mx-auto mb-3 animate-spin" />
            <span className="text-sm font-semibold">Loading global trash records...</span>
          </div>
        ) : trashItems.length === 0 ? (
          <div className="py-16 px-5 text-center">
            <div className="w-16 h-16 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-2xl mx-auto mb-3 text-green-600">
              ✨
            </div>
            <h3 className="m-0 mb-1.5 text-base sm:text-lg text-gray-800 font-bold">Recycle Bin is Clean!</h3>
            <p className="m-0 text-xs text-gray-500 max-w-md mx-auto">
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
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-[0.72rem] font-bold uppercase tracking-wider">
                  <th className="py-3 px-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === trashItems.length && trashItems.length > 0}
                      onChange={handleSelectAll}
                      className="cursor-pointer accent-green-600 rounded"
                    />
                  </th>
                  <th className="py-3 px-3 w-[70px]">ID</th>
                  <th className="py-3 px-3.5 w-[140px]">Module / Type</th>
                  <th className="py-3 px-3.5">Record Details &amp; Summary</th>
                  <th className="py-3 px-3.5 w-[160px]">Deleted Date</th>
                  <th className="py-3 px-3.5 w-[100px]">Deleted By</th>
                  <th className="py-3 px-4 w-[190px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trashItems.map((item) => {
                  const itemKey = `${item.module}_${item.id}`;
                  const isSelected = selectedIds.includes(itemKey);
                  return (
                    <tr
                      key={itemKey}
                      className={`border-b border-gray-100 transition-colors ${
                        isSelected ? 'bg-green-50/70' : 'bg-transparent hover:bg-gray-50/80'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(itemKey)}
                          className="cursor-pointer accent-green-600 rounded"
                        />
                      </td>

                      {/* ID */}
                      <td className="py-3 px-3 font-bold text-gray-500">#{item.id}</td>

                      {/* Module Badge */}
                      <td className="py-3 px-3.5">
                        <span className="bg-gray-100 text-gray-700 border border-gray-200 py-1 px-2.5 rounded-md text-[0.72rem] font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shadow-xs">
                          <span>{item.icon || '📦'}</span>
                          <span>{item.module_label || item.module}</span>
                        </span>
                      </td>

                      {/* Title & Subtitle */}
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-gray-800 text-sm flex items-center gap-2">
                          <span>{item.title}</span>
                          <button
                            type="button"
                            onClick={() => setPreviewItem(item)}
                            title="Inspect raw data record"
                            className="bg-transparent border-0 text-green-600 hover:text-green-700 cursor-pointer p-0 text-xs font-semibold underline"
                          >
                            [Inspect]
                          </button>
                        </div>
                        <div className="text-gray-500 text-xs mt-0.5">{item.subtitle}</div>
                      </td>

                      {/* Deleted Date */}
                      <td className="py-3 px-3.5 text-red-600 text-xs font-medium whitespace-nowrap">
                        {item.deleted_at ? new Date(item.deleted_at).toLocaleString() : 'Recently'}
                      </td>

                      {/* Deleted By */}
                      <td className="py-3 px-3.5 text-gray-600 text-xs font-medium">
                        {item.deleted_by || 'Admin'}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* 1-Click Restore Button */}
                          <button
                            type="button"
                            onClick={() => handleRestore(item)}
                            disabled={isProcessing}
                            title="Restore this record back to active state"
                            className="bg-green-600 hover:bg-green-700 text-white border-0 py-1 px-2.5 rounded-md text-xs font-semibold cursor-pointer flex items-center gap-1 shadow-sm disabled:opacity-50 transition-all"
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
                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-1 px-2.5 rounded-md text-xs font-semibold cursor-pointer flex items-center gap-1 disabled:opacity-50 transition-colors"
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
