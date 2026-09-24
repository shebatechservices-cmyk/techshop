import React from 'react';

export default function AddTenderModal({
  isOpen,
  onClose,
  newTenderName,
  setNewTenderName,
  submittingTender,
  handleCreateTender,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-scale-in">
        <div className="bg-gradient-to-r from-slate-900 to-indigo-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-lg">📑</span>
            <div>
              <h3 className="font-bold text-base">Add New Tender</h3>
              <p className="text-xs text-slate-300">Register a new payment classification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleCreateTender} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tender Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Cash, Bank, Mobile Banking (MFS), Digital Card"
              value={newTenderName}
              onChange={(e) => setNewTenderName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              autoFocus
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingTender}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submittingTender ? 'Saving...' : 'Save Tender'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
