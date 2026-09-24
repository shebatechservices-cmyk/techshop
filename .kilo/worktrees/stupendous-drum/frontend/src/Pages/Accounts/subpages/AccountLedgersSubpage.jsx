import React, { useState, useMemo } from 'react';

export default function AccountLedgersSubpage({
  wallets = [],
  transactions = [],
  totalBalance = 0,
  loading = false,
  onOpenAddAccount,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenEditWallet,
  onDeleteWallet,
  onViewTxDetails,
  onReverseTx,
}) {
  const [txSearchQuery, setTxSearchQuery] = useState('');
  const [selectedTxTypeFilter, setSelectedTxTypeFilter] = useState('all');
  const [selectedWalletFilter, setSelectedWalletFilter] = useState('all');

  // Ledger Filter logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type Filter
      if (selectedTxTypeFilter !== 'all') {
        const isCredit =
          tx.transaction_type === 'credit' ||
          ['credit', 'in', 'deposit', 'due_receive', 'advance_receive', 'sale_revenue'].includes(tx.type);
        const isDebit =
          tx.transaction_type === 'debit' ||
          ['debit', 'out', 'withdraw', 'due_payment', 'expense', 'purchase_cost'].includes(tx.type);
        const isTransfer =
          tx.source_type === 'transfer' || ['transfer', 'transfer_in', 'transfer_out'].includes(tx.type);

        if (selectedTxTypeFilter === 'credit' && !isCredit) return false;
        if (selectedTxTypeFilter === 'debit' && !isDebit) return false;
        if (selectedTxTypeFilter === 'transfer' && !isTransfer) return false;
      }

      // Wallet Filter
      if (selectedWalletFilter !== 'all') {
        const wId = Number(selectedWalletFilter);
        if (tx.wallet_id !== wId && tx.account_id !== wId) return false;
      }

      // Search Query
      if (txSearchQuery.trim()) {
        const q = txSearchQuery.toLowerCase();
        const ref = (tx.reference || '').toLowerCase();
        const note = (tx.note || tx.description || '').toLowerCase();
        const wName = (tx.wallet_name || tx.account_name || '').toLowerCase();
        const trxId = (tx.transaction_id || '').toLowerCase();
        return ref.includes(q) || note.includes(q) || wName.includes(q) || trxId.includes(q);
      }

      return true;
    });
  }, [transactions, selectedTxTypeFilter, selectedWalletFilter, txSearchQuery]);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="font-bold text-slate-700 m-0 text-base">Loading accounts and ledger data...</p>
        <p className="text-xs text-slate-400 mt-1 m-0">Synchronizing balances with database</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sleek Horizontal Summary Dashboard Widget (Replacing raw vertical text dumps) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1: Total Net Balance */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-5 rounded-2xl shadow-sm border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Total Net Balance</span>
            <div className="w-9 h-9 rounded-xl bg-white/10 text-emerald-400 flex items-center justify-center text-lg font-bold">
              💰
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 m-0 tracking-tight font-mono">
              ৳ {totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-300 mt-1.5 mb-0">
              Combined real balance across {wallets.length} active accounts
            </p>
          </div>
        </div>

        {/* Metric 2: Total Accounts Breakdown */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Accounts</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-bold">
              🏦
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 m-0 tracking-tight">
              {wallets.length} <span className="text-xs font-semibold text-slate-500">Configured</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 mb-0 font-medium">
              {wallets.filter((w) => w.account_type === 'cash' || w.account_type === 'drawer').length} Cash ·{' '}
              {wallets.filter((w) => w.account_type === 'bank').length} Bank ·{' '}
              {wallets.filter((w) => !['cash', 'drawer', 'bank'].includes(w.account_type)).length} MFS/Other
            </p>
          </div>
        </div>

        {/* Metric 3: Ledger Activity */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ledger Audit Activity</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg font-bold">
              📊
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 m-0 tracking-tight">
              {transactions.length} <span className="text-xs font-semibold text-slate-500">Recorded Entries</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 mb-0 font-medium">
              {
                transactions.filter(
                  (t) =>
                    t.transaction_type === 'credit' ||
                    ['credit', 'in', 'deposit', 'due_receive', 'advance_receive', 'sale_revenue'].includes(t.type)
                ).length
              }{' '}
              Inflow ·{' '}
              {
                transactions.filter(
                  (t) =>
                    t.source_type === 'transfer' || ['transfer', 'transfer_in', 'transfer_out'].includes(t.type)
                ).length
              }{' '}
              Transfers
            </p>
          </div>
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2.5">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 m-0">Payment Accounts & Drawers</h3>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            {wallets.length} Accounts
          </span>
        </div>
        <p className="text-xs text-slate-400 hidden sm:block m-0">
          Click Deposit, Withdraw, or Edit to adjust balances
        </p>
      </div>

      {/* True Card View for Accounts: Strict layout grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 */}
      {wallets.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500 shadow-sm">
          <div className="text-5xl mb-3">🏦</div>
          <h4 className="font-bold text-slate-800 m-0 mb-1 text-base">No Accounts Configured</h4>
          <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
            You have not registered any cash drawers, bank branches, or digital wallets yet.
          </p>
          <button
            type="button"
            onClick={onOpenAddAccount}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm font-medium text-sm inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>➕</span> Create First Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wallets.map((wallet) => {
            const isCash = wallet.account_type === 'cash' || wallet.account_type === 'drawer';
            const isBank = wallet.account_type === 'bank';
            const balNum = Number(wallet.balance || 0);

            const iconConfig = isCash
              ? { icon: '💵', bg: 'bg-emerald-50 text-emerald-600 border-emerald-200', typeLabel: 'Cash Drawer' }
              : isBank
              ? { icon: '🏦', bg: 'bg-blue-50 text-blue-600 border-blue-200', typeLabel: 'Bank Account' }
              : {
                  icon: '📱',
                  bg: 'bg-purple-50 text-purple-600 border-purple-200',
                  typeLabel: wallet.account_type ? wallet.account_type.toUpperCase() : 'MFS / Wallet',
                };

            return (
              <div
                key={wallet.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                {/* Top Section: Icon, Classification & Info */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl font-bold border shadow-xs ${iconConfig.bg}`}
                    >
                      {iconConfig.icon}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                        {iconConfig.typeLabel}
                      </span>
                      {wallet.tender_name && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
                          <span>💳</span> {wallet.tender_name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Account Name & Identifiers */}
                  <div className="mt-3.5">
                    <h4 className="text-base font-bold text-slate-900 m-0 truncate" title={wallet.account_name}>
                      {wallet.account_name}
                    </h4>
                    {wallet.account_number ? (
                      <p className="text-xs text-slate-500 font-mono mt-0.5 m-0 truncate">
                        A/C: {wallet.account_number}
                      </p>
                    ) : wallet.location ? (
                      <p className="text-xs text-slate-500 mt-0.5 m-0 truncate">
                        📍 {wallet.location}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 mt-0.5 m-0">Standard Account</p>
                    )}
                  </div>

                  {/* Available Balance Display */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Available Balance
                    </span>
                    <div
                      className={`text-2xl font-black mt-1 leading-tight tracking-tight font-mono ${
                        balNum < 0 ? 'text-rose-600' : 'text-slate-900'
                      }`}
                    >
                      ৳ {balNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Bottom Section: Beautifully Aligned Action Buttons */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 space-y-2">
                  {/* Primary Actions: Deposit & Withdraw */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenDeposit(wallet)}
                      className="px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-emerald-50 text-emerald-700 hover:border-emerald-300 font-medium text-sm transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      title="Deposit cash into this account"
                    >
                      <span>⬆️</span>
                      <span>Deposit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenWithdraw(wallet)}
                      className="px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-amber-50 text-amber-700 hover:border-amber-300 font-medium text-sm transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      title="Withdraw cash from this account"
                    >
                      <span>⬇️</span>
                      <span>Withdraw</span>
                    </button>
                  </div>

                  {/* Secondary Actions: Edit & Delete */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onOpenEditWallet(wallet)}
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 text-slate-700 font-medium text-xs transition cursor-pointer flex items-center gap-1"
                      title="Edit account details"
                    >
                      <span>✏️</span> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteWallet(wallet)}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-red-50 hover:border-red-300 hover:text-red-600 text-slate-400 font-medium text-xs transition cursor-pointer"
                      title={
                        !wallet.is_deletable
                          ? '⚠️ Has transactions: Click to force remove'
                          : 'Delete this account'
                      }
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Central Transaction Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 m-0">Central Account Ledger</h3>
            <p className="text-xs text-slate-500 mt-0.5 m-0">
              Complete audit trail of all cash, bank, and digital ledger movements
            </p>
          </div>

          {/* Filters Bar: Wrapped in flexbox container */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            {/* Search Input */}
            <input
              type="text"
              placeholder="🔍 Search ledger..."
              value={txSearchQuery}
              onChange={(e) => setTxSearchQuery(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-52"
            />

            {/* Type Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2">
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
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition cursor-pointer shadow-sm ${
                    selectedTxTypeFilter === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Account Filter dropdown */}
            <select
              value={selectedWalletFilter}
              onChange={(e) => setSelectedWalletFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer text-slate-700 font-medium"
            >
              <option value="all">All Accounts</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.account_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            <p className="m-0">No transaction records found matching the filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-sm text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-xs tracking-wider">
                  <th className="py-3 px-4 border border-slate-200">Date & Time</th>
                  <th className="py-3 px-4 border border-slate-200">Account / Drawer</th>
                  <th className="py-3 px-4 border border-slate-200">Type</th>
                  <th className="py-3 px-4 border border-slate-200">Source & Ref</th>
                  <th className="py-3 px-4 border border-slate-200">Note / Details</th>
                  <th className="py-3 px-4 border border-slate-200 text-right">Amount</th>
                  <th className="py-3 px-4 border border-slate-200 text-right">Running Balance</th>
                  <th className="py-3 px-4 border border-slate-200 text-center">Audit & Receipt</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx, idx) => {
                  const isCredit =
                    tx.transaction_type === 'credit' ||
                    ['credit', 'in', 'deposit', 'due_receive', 'advance_receive', 'sale_revenue'].includes(tx.type);
                  const isTransfer =
                    tx.source_type === 'transfer' || ['transfer', 'transfer_in', 'transfer_out'].includes(tx.type);
                  const sourceType = tx.source_type || tx.type || 'manual';

                  return (
                    <tr key={tx.id || idx} className="border-b border-slate-200 hover:bg-slate-50 transition">
                      <td className="py-3 px-4 border border-slate-200 text-slate-600 whitespace-nowrap text-xs">
                        {new Date(tx.created_at || tx.date || Date.now()).toLocaleString('en-GB', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 border border-slate-200 font-semibold text-slate-900 whitespace-nowrap">
                        {tx.wallet_name || tx.account_name || '—'}
                      </td>
                      <td className="py-3 px-4 border border-slate-200">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            isTransfer
                              ? 'bg-sky-100 text-sky-800'
                              : isCredit
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {isTransfer ? 'Transfer' : isCredit ? 'Credit (+)' : 'Debit (-)'}
                        </span>
                      </td>
                      <td className="py-3 px-4 border border-slate-200">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                            {sourceType.replace(/_/g, ' ')}
                          </span>
                          {tx.reference && (
                            <span className="text-xs text-sky-700 font-semibold">{tx.reference}</span>
                          )}
                        </div>
                        {tx.transaction_id && (
                          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                            TrxID: {tx.transaction_id}
                          </div>
                        )}
                      </td>
                      <td
                        className="py-3 px-4 border border-slate-200 text-slate-600 text-xs max-w-xs truncate"
                        title={tx.note || tx.description || '—'}
                      >
                        {tx.note || tx.description || '—'}
                      </td>
                      <td
                        className={`py-3 px-4 border border-slate-200 text-right font-bold whitespace-nowrap font-mono ${
                          isCredit ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {isCredit ? '+ ' : '- '}৳{' '}
                        {Number(tx.amount || 0).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3 px-4 border border-slate-200 text-right font-semibold text-slate-700 whitespace-nowrap font-mono">
                        {tx.balance_after !== null && tx.balance_after !== undefined
                          ? `৳ ${Number(tx.balance_after || 0).toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                          : '—'}
                      </td>
                      <td className="py-3 px-4 border border-slate-200 text-center whitespace-nowrap">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onViewTxDetails(tx)}
                            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 text-slate-700 font-medium text-xs transition cursor-pointer inline-flex items-center gap-1"
                            title="View Immutable Audit Record & Receipt"
                          >
                            📄 Details
                          </button>
                          {tx.is_reversible && onReverseTx && (
                            <button
                              type="button"
                              onClick={() => onReverseTx(tx)}
                              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 text-rose-600 font-medium text-xs transition cursor-pointer inline-flex items-center gap-1"
                              title="Audit Adjustment Reversal"
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
    </div>
  );
}
