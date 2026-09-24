import React from 'react';

export default function FundTransferModal({
  isOpen,
  onClose,
  transferForm,
  setTransferForm,
  wallets = [],
  transferLoading,
  transferError,
  onSubmit,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center z-[10000] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 relative z-[10001]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 m-0">Fund Transfer</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {transferError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs mb-4">
            {transferError}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              From Account / Wallet <span className="text-red-500">*</span>
            </label>
            <select
              value={transferForm.from_wallet_id}
              onChange={(e) => setTransferForm({ ...transferForm, from_wallet_id: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Select source wallet</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.account_name} (Balance: ৳ {Number(w.balance).toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              To Account / Wallet <span className="text-red-500">*</span>
            </label>
            <select
              value={transferForm.to_wallet_id}
              onChange={(e) => setTransferForm({ ...transferForm, to_wallet_id: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Select destination wallet</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.account_name} (Balance: ৳ {Number(w.balance).toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transfer Amount (৳) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={transferForm.amount}
              onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transfer Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Daily cash deposit to Bank, Cash to Petty Cash"
              value={transferForm.note}
              onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transaction ID (MFS/Bank Reference)
            </label>
            <input
              type="text"
              placeholder="e.g. TrxID 9X7H4Z2M or Bank ref #"
              value={transferForm.transaction_id}
              onChange={(e) => setTransferForm({ ...transferForm, transaction_id: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={transferLoading}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition disabled:opacity-60 disabled:cursor-not-allowed shadow-xs cursor-pointer"
            >
              {transferLoading ? 'Processing...' : 'Confirm Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
