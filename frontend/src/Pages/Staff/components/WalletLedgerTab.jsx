import React from 'react';

export default function WalletLedgerTab({ transactions = [] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {transactions.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          <span className="text-3xl block mb-2">📜</span>
          <span>No recorded wallet transactions or payouts yet.</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/90 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Description / Reference</th>
                <th className="py-3 px-4 text-right">Amount (৳)</th>
                <th className="py-3 px-4 text-right">Balance After (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx) => {
                const isCredit = tx.credit === true;
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] font-semibold text-slate-500">
                      #TX-{tx.id}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isCredit
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {isCredit ? '+ Credit / Commission' : '- Payout / Debit'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {tx.note || tx.reference || 'Wallet Adjustment'}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold ${
                        isCredit ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isCredit ? '+' : '-'}৳{parseFloat(tx.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      ৳{parseFloat(tx.balance_after || 0).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
