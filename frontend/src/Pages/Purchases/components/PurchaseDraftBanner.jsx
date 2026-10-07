import React from 'react';

export default React.memo(function PurchaseDraftBanner({
  recoveredDraft = null,
  handleRestoreDraft = () => {},
  handleDiscardDraft = () => {},
}) {
  if (!recoveredDraft) return null;

  return (
    <div className="bg-gradient-to-r from-amber-50 via-amber-100 to-amber-50 border-[1.5px] border-amber-500 rounded-xl p-3.5 px-4.5 flex items-center justify-between gap-3 shadow-md animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <span className="text-2xl animate-pulse">⚡</span>
        <div>
          <div className="font-extrabold text-sm text-amber-900 flex items-center gap-2">
            <span>Unsaved Purchase Order Draft Found!</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">
              অসংরক্ষিত ড্রাফট
            </span>
          </div>
          <div className="text-xs text-amber-800 mt-0.5">
            Recovered session with <strong>{recoveredDraft.itemCount} item(s)</strong>{' '}
            {recoveredDraft.serialCount > 0
              ? `(${recoveredDraft.serialCount} serial barcodes)`
              : ''}{' '}
            saved at {recoveredDraft.formattedTime}. বিদ্যুৎ চলে যাওয়ার আগের সব প্রোডাক্ট ডাটা সুরক্ষিত আছে।
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleRestoreDraft}
          className="bg-amber-600 hover:bg-amber-700 text-white border-0 py-2 px-3.5 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-sm transition-colors"
          title="Restore unsaved items and details"
        >
          <span>⚡</span>
          <span>Restore Draft (পুনরুদ্ধার করুন)</span>
        </button>
        <button
          type="button"
          onClick={handleDiscardDraft}
          className="bg-white/90 hover:bg-white text-amber-900 border border-amber-300 py-2 px-3 rounded-lg font-semibold text-xs cursor-pointer transition-colors"
          title="Discard draft and start fresh"
        >
          ✕ Discard
        </button>
      </div>
    </div>
  );
});
