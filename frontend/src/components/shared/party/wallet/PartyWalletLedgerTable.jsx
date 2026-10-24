import React from 'react';

export default function PartyWalletLedgerTable({ transactions = [] }) {
  if (transactions.length === 0) {
    return (
      <div className="mt-5">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
          📒 Wallet Transaction Ledger
        </h4>
        <p className="text-slate-400 text-xs">No wallet transactions recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
        📒 Wallet Transaction Ledger <span className="text-slate-400 font-normal">({transactions.length})</span>
      </h4>
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <th className="p-2.5">#</th>
              <th className="p-2.5">Type</th>
              <th className="p-2.5 text-center">Dr/Cr</th>
              <th className="p-2.5 text-right">Amount</th>
              <th className="p-2.5 text-right">Balance</th>
              <th className="p-2.5">Account</th>
              <th className="p-2.5">Effect</th>
              <th className="p-2.5">Reference</th>
              <th className="p-2.5">Note</th>
              <th className="p-2.5">Date</th>
              <th className="p-2.5 text-center">Audit Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-50/70">
                <td className="p-2.5 text-slate-400">#{tx.id}</td>
                <td className="p-2.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    (tx.type.includes('deposit') || tx.type.includes('salary') || tx.type.includes('bonus'))
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {tx.type}
                  </span>
                </td>
                <td className={`p-2.5 text-center font-extrabold ${tx.credit ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {tx.credit ? 'Cr +' : 'Dr −'}
                </td>
                <td className="p-2.5 text-right font-bold">৳ {Number(tx.amount).toLocaleString('en-BD')}</td>
                <td className="p-2.5 text-right text-slate-500">৳ {Number(tx.balance_after).toLocaleString('en-BD')}</td>
                <td className="p-2.5 text-slate-600">{tx.account_name || (tx.account_effect === 'none' ? '—' : '#') + (tx.account_id || '')}</td>
                <td className="p-2.5 text-slate-500">
                  {tx.cash_drawer_effect === 'in' ? 'Drawer +' : tx.cash_drawer_effect === 'out' ? 'Drawer −' : tx.account_effect === 'none' ? 'No movement' : `${tx.account_effect === 'in' ? 'Acct +' : 'Acct −'}`}
                </td>
                <td className="p-2.5 text-sky-600 font-semibold">{tx.reference || '—'}</td>
                <td className="p-2.5 text-slate-500 max-w-[160px] truncate" title={tx.note}>{tx.note || '—'}</td>
                <td className="p-2.5 text-slate-400 whitespace-nowrap">{new Date(tx.created_at).toLocaleString('en-BD')}</td>
                <td className="p-2.5 text-center whitespace-nowrap">
                  <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                    🔒 Audited
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
