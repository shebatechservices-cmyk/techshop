import React from 'react';

export default function LedgerStatsCards({
  totalBalance = 0,
  wallets = [],
  transactions = []
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2.5 mb-3">
      {/* Total Net Balance */}
      <div className="bg-white py-2.5 px-3.5 rounded-lg border border-slate-200 shadow-sm">
        <span className="text-[0.72rem] text-slate-500 uppercase font-bold">
          Total Net Balance
        </span>
        <h3 className="text-xl mt-0.5 mb-0 text-emerald-600 font-extrabold font-mono">
          ৳ {totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h3>
        <span className="text-[0.7rem] text-slate-400">Across all active financial accounts</span>
      </div>

      {/* Active Accounts */}
      <div className="bg-white py-2.5 px-3.5 rounded-lg border border-slate-200 shadow-sm">
        <span className="text-[0.72rem] text-slate-500 uppercase font-bold">
          Active Accounts
        </span>
        <h3 className="text-xl mt-0.5 mb-0 text-sky-600 font-extrabold">
          {wallets.length} <span className="text-xs font-normal text-slate-500">Configured</span>
        </h3>
        <span className="text-[0.7rem] text-slate-500">
          {wallets.filter((w) => w.account_type === 'cash' || w.account_type === 'drawer').length} Cash · {wallets.filter((w) => w.account_type === 'bank').length} Bank · {wallets.filter((w) => !['cash', 'drawer', 'bank'].includes(w.account_type)).length} MFS
        </span>
      </div>

      {/* Audit & Movements */}
      <div className="bg-white py-2.5 px-3.5 rounded-lg border border-slate-200 shadow-sm">
        <span className="text-[0.72rem] text-slate-500 uppercase font-bold">
          Audit & Movements
        </span>
        <h3 className="text-xl mt-0.5 mb-0 text-slate-900 font-extrabold">
          {transactions.length} <span className="text-xs font-normal text-slate-500">Records</span>
        </h3>
        <span className="text-[0.7rem] text-slate-500">
          {transactions.filter(t => t.transaction_type === 'credit' || ['credit','in','deposit','due_receive','advance_receive','sale_revenue'].includes(t.type)).length} Inflow · {transactions.filter(t => t.source_type === 'transfer' || ['transfer','transfer_in','transfer_out'].includes(t.type)).length} Transfers
        </span>
      </div>
    </div>
  );
}
