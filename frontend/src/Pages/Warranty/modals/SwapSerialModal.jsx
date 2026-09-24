import React from 'react';

export default function SwapSerialModal({
  swapClaimModal,
  setSwapClaimModal,
  newReplacementSerial,
  setNewReplacementSerial,
  handleSaveSwapSerial,
}) {
  if (!swapClaimModal) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) setSwapClaimModal(null);
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 animate-scaleUp">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>🔄</span> Record New Replacement S/N
          </h3>
          <button
            type="button"
            onClick={() => setSwapClaimModal(null)}
            className="text-slate-400 hover:text-slate-600 transition p-1 text-sm rounded-md"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-4 leading-normal">
          কোম্পানি বা ভেন্ডর যদি নষ্ট মালটির বদলে সম্পূর্ণ নতুন ইউনিট রিপ্লেস করে থাকে, তবে নতুন সিরিয়ালটি বসান:
        </p>

        <form onSubmit={handleSaveSwapSerial} className="space-y-3.5 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700">
            Old Serial (S/N):{' '}
            <strong className="font-mono text-red-600 ml-1">
              {swapClaimModal.serial_code}
            </strong>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              New Replacement Serial (S/N) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Scan or type new unit S/N..."
              value={newReplacementSerial}
              onChange={(e) => setNewReplacementSerial(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border-2 border-emerald-500 font-mono focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSwapClaimModal(null)}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-sm shadow-emerald-600/30 transition cursor-pointer"
            >
              Save & Mark Ready
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
