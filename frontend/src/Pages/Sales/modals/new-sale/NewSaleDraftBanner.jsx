import React from 'react';

/**
 * Banner shown when an unsaved sales draft is recovered from local cache.
 */
export default function NewSaleDraftBanner({
  recoveredDraft,
  handleRestoreDraft,
  handleDiscardDraft,
}) {
  if (!recoveredDraft) return null;

  return (
    <div className="bg-gradient-to-br from-amber-100 to-amber-50 border-[1.5px] border-amber-500 rounded-xl p-3 sm:px-4 mb-4 flex items-center justify-between gap-3 shadow-md">
      <div className="flex items-center gap-2.5">
        <span className="text-2xl">⚡</span>
        <div>
          <div className="font-extrabold text-sm text-amber-900">
            Unsaved Sales Draft Found!
          </div>
          <div className="text-xs text-amber-800 mt-0.5">
            Recovered session with <strong>{recoveredDraft.itemCount} item(s)</strong>{' '}
            {recoveredDraft.serialCount > 0 ? `(${recoveredDraft.serialCount} serial barcodes)` : ''} saved at {recoveredDraft.formattedTime}.
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleRestoreDraft}
          className="bg-amber-600 hover:bg-amber-700 text-white border-0 py-1.5 px-3.5 rounded-md font-bold text-xs cursor-pointer flex items-center gap-1 shadow-sm transition-colors"
        >
          ⚡ Restore Draft
        </button>
        <button
          type="button"
          onClick={handleDiscardDraft}
          className="bg-white/80 hover:bg-white text-amber-900 border border-amber-300 py-1.5 px-3 rounded-md font-semibold text-xs cursor-pointer transition-colors"
        >
          ✕ Discard
        </button>
      </div>
    </div>
  );
}
