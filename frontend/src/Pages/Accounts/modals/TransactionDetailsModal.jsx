import React from 'react';

export default function TransactionDetailsModal({ tx, onClose }) {
  if (!tx) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center z-[10000] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden relative z-[10001]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900 m-0">
              📄 Transaction Audit Record #{tx.id}
            </h3>
            <small className="text-xs text-slate-500">Immutable Central Ledger Entry</small>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          {/* Compliance & Immutability Badge */}
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl mb-4 flex items-center gap-2.5 text-xs text-emerald-800 font-semibold">
            <span className="text-base">🔒</span>
            <span>
              Immutable Audit Trail: Direct edits and deletions are disabled to ensure financial compliance and
              prevent running balance discrepancies.
            </span>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <small className="text-slate-400 block text-[11px] uppercase font-bold">Account / Drawer</small>
              <strong className="text-slate-800 text-sm">
                {tx.wallet_name ||
                  tx.account_name ||
                  `Account #${tx.account_id}`}
              </strong>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <small className="text-slate-400 block text-[11px] uppercase font-bold">Classification</small>
              <span
                className={`inline-block mt-0.5 px-2 py-0.5 rounded-md text-xs font-bold ${
                  tx.transaction_type === 'credit'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {tx.transaction_type === 'credit'
                  ? '🟢 Inflow / Credit (+)'
                  : '🔴 Outflow / Debit (-)'}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <small className="text-slate-400 block text-[11px] uppercase font-bold">Transaction Amount</small>
              <strong
                className={`text-base font-bold font-mono ${
                  tx.transaction_type === 'credit' ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                ৳ {Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <small className="text-slate-400 block text-[11px] uppercase font-bold">
                Running Balance After
              </small>
              <strong className="text-base font-bold text-slate-800 font-mono">
                {tx.balance_after !== null && tx.balance_after !== undefined
                  ? `৳ ${Number(tx.balance_after || 0).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}`
                  : '—'}
              </strong>
            </div>
          </div>

          {/* Secondary Details */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 mb-4 text-xs space-y-1.5">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Date & Time:</span>
              <span className="font-semibold text-slate-800">
                {new Date(
                  tx.created_at || tx.date || Date.now()
                ).toLocaleString('en-GB', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Source Module:</span>
              <span className="font-semibold text-sky-600 uppercase">
                {(tx.source_type || tx.type || 'manual').replace(/_/g, ' ')}
              </span>
            </div>
            {tx.reference && (
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Reference / Voucher:</span>
                <span className="font-bold text-sky-700">{tx.reference}</span>
              </div>
            )}
            {tx.transaction_id && (
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Bank / MFS TrxID:</span>
                <span className="font-semibold text-slate-700 font-mono">
                  {tx.transaction_id}
                </span>
              </div>
            )}
            {tx.created_by && (
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Recorded By:</span>
                <span className="font-semibold text-slate-700">{tx.created_by}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="mb-4">
            <small className="text-slate-500 block text-[11px] font-bold uppercase mb-1">
              TRANSACTION DESCRIPTION / NOTE
            </small>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700">
              {tx.note || tx.description || 'No additional note provided.'}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-xs sm:text-sm transition shadow-xs cursor-pointer"
            >
              Close Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
