import React from 'react';

export default function QuickBalanceModal({
  isOpen,
  onClose,
  balanceEditModal,
  setBalanceEditModal,
  updatingBalance,
  handleUpdateBalance,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 animate-scale-in">
        <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
          <h3 className="font-bold text-sm">Quick Ledger Balance</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleUpdateBalance} className="p-5 space-y-3">
          <p className="text-xs text-slate-600">
            Adjust current balance for <strong>{balanceEditModal.account?.account_name}</strong>:
          </p>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Current Balance (৳)</label>
            <input
              type="number"
              step="0.01"
              required
              value={balanceEditModal.newBalance}
              onChange={(e) => setBalanceEditModal({ ...balanceEditModal, newBalance: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-bold font-mono text-emerald-700 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updatingBalance}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              {updatingBalance ? 'Saving...' : 'Update Balance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
