import React from 'react';

export default function LedgerTransactionTable({
  wallets = [],
  filteredTransactions = [],
  txSearchQuery = '',
  setTxSearchQuery = () => {},
  selectedTxTypeFilter = 'all',
  setSelectedTxTypeFilter = () => {},
  selectedWalletFilter = 'all',
  setSelectedWalletFilter = () => {},
  loadAccountsData = () => {},
  loading = false,
  setSelectedTxForDetails = () => {},
  handleReverseTransaction = () => {}
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
      {/* Central Transaction Ledger Header & Filter Toolbar */}
      <div className="flex justify-between items-center flex-wrap gap-2 mb-2.5">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 m-0">
            Central Account Ledger
          </h3>
          <span className="text-[0.72rem] text-slate-500">
            Complete audit trail of all cash, bank, and digital ledger movements
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <input
            type="text"
            placeholder="Search ledger..."
            value={txSearchQuery}
            onChange={(e) => setTxSearchQuery(e.target.value)}
            className="w-44 py-1 px-2.5 rounded-md border border-slate-300 text-xs outline-none bg-white focus:border-sky-500"
          />

          {/* Filter Pills */}
          <div className="flex bg-slate-100 p-0.5 rounded-md gap-0.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'credit', label: '🟢 Inflow' },
              { id: 'debit', label: '🔴 Outflow' },
              { id: 'transfer', label: '🔵 Transfer' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedTxTypeFilter(tab.id)}
                className={`py-1 px-2 rounded border-0 text-[0.74rem] cursor-pointer transition-colors ${
                  selectedTxTypeFilter === tab.id
                    ? 'bg-sky-600 text-white font-bold'
                    : 'bg-transparent text-slate-500 font-semibold hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            value={selectedWalletFilter}
            onChange={(e) => setSelectedWalletFilter(e.target.value)}
            className="py-1 px-2 rounded-md border border-slate-300 text-xs bg-white text-slate-700 cursor-pointer outline-none"
          >
            <option value="all">All Accounts</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.account_name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={loadAccountsData}
            disabled={loading}
            className="bg-white hover:bg-slate-50 border border-slate-300 py-1 px-2 rounded-md text-xs text-slate-600 cursor-pointer font-semibold transition-colors disabled:opacity-50"
            title="Refresh Ledger"
          >
            🔄
          </button>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="text-center py-7 text-slate-400 text-xs">
          No transaction records found matching the filter criteria.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-200 text-slate-500 text-[0.74rem] uppercase font-bold">
                <th className="py-2 px-3">Date & Time</th>
                <th className="py-2 px-3">Account / Drawer</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Reference</th>
                <th className="py-2 px-3">Note / Description</th>
                <th className="py-2 px-3 text-right">Amount</th>
                <th className="py-2 px-3 text-right">Running Balance</th>
                <th className="py-2 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => {
                const isCredit =
                  tx.transaction_type === 'credit' ||
                  ['credit', 'in', 'deposit', 'due_receive', 'advance_receive', 'sale_revenue'].includes(
                    tx.type
                  );
                return (
                  <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                    <td className="py-2 px-3 text-slate-500 text-[0.76rem] whitespace-nowrap">
                      {new Date(tx.created_at || tx.timestamp || tx.date).toLocaleString('en-GB', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap">
                      {tx.account_name || tx.wallet_name || `A/C #${tx.account_id || tx.wallet_id}`}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span
                        className={`text-[0.7rem] font-bold py-0.5 px-1.5 rounded uppercase ${
                          isCredit ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {isCredit ? 'Inflow' : 'Outflow'}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-semibold text-sky-700 text-xs">
                        {tx.reference || '—'}
                      </div>
                      {tx.transaction_id && (
                        <div className="text-[0.7rem] text-slate-400 font-mono">
                          TrxID: {tx.transaction_id}
                        </div>
                      )}
                    </td>
                    <td
                      className="py-2 px-3 text-slate-600 text-xs max-w-[220px] whitespace-nowrap overflow-hidden text-ellipsis"
                      title={tx.note || tx.description || '—'}
                    >
                      {tx.note || tx.description || '—'}
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-bold whitespace-nowrap font-mono ${
                        isCredit ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {isCredit ? '+ ' : '- '}৳{' '}
                      {Number(tx.amount || 0).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-2 px-3 text-right font-semibold text-slate-900 whitespace-nowrap font-mono">
                      {tx.balance_after !== null && tx.balance_after !== undefined
                        ? `৳ ${Number(tx.balance_after || 0).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : '—'}
                    </td>
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedTxForDetails(tx)}
                          className="py-0.5 px-2 bg-white hover:bg-slate-50 border border-slate-300 rounded text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                          title="View Details"
                        >
                          📄 Details
                        </button>
                        {tx.is_reversible && (
                          <button
                            type="button"
                            onClick={() => handleReverseTransaction(tx)}
                            className="py-0.5 px-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded text-rose-600 text-xs font-semibold cursor-pointer transition-colors"
                            title="Reverse Transaction"
                          >
                            ↩️ Reverse
                          </button>
                        )}
                      </div>
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
