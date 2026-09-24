import React from 'react';

export default function CashFlowModal({
  isOpen,
  onClose,
  cashFlowMode,
  cashFlowAccount,
  cashFlowForm,
  setCashFlowForm,
  cashFlowLoading,
  cashFlowError,
  onSubmit,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center z-[10000] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 relative z-[10001]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 m-0">
              {cashFlowMode === 'deposit' ? '⬆️ Deposit Cash Into Account' : '⬇️ Withdraw Cash From Account'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-0 font-medium">
              {cashFlowAccount ? cashFlowAccount.account_name : ''} (Balance: ৳{' '}
              {Number(cashFlowAccount ? cashFlowAccount.balance : 0).toLocaleString('en-IN')})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {cashFlowError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs mb-4">
            {cashFlowError}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Amount (৳) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={cashFlowForm.amount}
              onChange={(e) => setCashFlowForm({ ...cashFlowForm, amount: e.target.value })}
              required
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Note / Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Owner capital deposit, Cash withdrawal for emergency"
              value={cashFlowForm.note}
              onChange={(e) => setCashFlowForm({ ...cashFlowForm, note: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reference / Transaction ID (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Bank Voucher #, TrxID"
              value={cashFlowForm.transaction_id}
              onChange={(e) => setCashFlowForm({ ...cashFlowForm, transaction_id: e.target.value })}
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
              disabled={cashFlowLoading}
              className={`px-5 py-2 rounded-lg text-white font-semibold text-sm transition disabled:opacity-60 cursor-pointer shadow-xs ${
                cashFlowMode === 'deposit'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {cashFlowLoading
                ? 'Processing...'
                : cashFlowMode === 'deposit'
                ? 'Confirm Deposit'
                : 'Confirm Withdrawal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
