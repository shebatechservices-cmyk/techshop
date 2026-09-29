import React from 'react';

export default React.memo(function PurchaseDraftBanner({
  recoveredDraft = null,
  handleRestoreDraft = () => {},
  handleDiscardDraft = () => {},
}) {
  if (!recoveredDraft) return null;

  return (
    <div className="bg-gradient-to-br from-amber-100 to-amber-50 border-[1.5px] border-amber-500 rounded-xl p-3 px-4 flex items-center justify-between gap-3 shadow-md">
      <div className="flex items-center gap-2.5">
        <span className="text-2xl">⚡</span>
        <div>
          <div className="font-extrabold text-sm text-amber-800">
            Unsaved Purchase Draft Found!
          </div>
          <div className="text-xs text-amber-700 mt-0.5">
            Recovered session with <strong>{recoveredDraft.itemCount} item(s)</strong>{' '}
            {recoveredDraft.serialCount > 0
              ? `(${recoveredDraft.serialCount} serial barcodes)`
              : ''}{' '}
            saved at {recoveredDraft.formattedTime}.
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleRestoreDraft}
          className="bg-amber-600 text-white border-0 py-1.5 px-3.5 rounded-md font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-sm hover:bg-amber-700 transition-colors"
        >
          ⚡ Restore Draft
        </button>
        <button
          type="button"
          onClick={handleDiscardDraft}
          className="bg-white/80 text-amber-900 border border-amber-300 py-1.5 px-3 rounded-md font-semibold text-xs cursor-pointer hover:bg-white transition-colors"
        >
          ✕ Discard
        </button>
      </div>
    </div>
  );
});
