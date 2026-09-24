import React from 'react';

export default function AccountLedgersSubpage({
  wallets = [],
  transactions = [],
  filteredTransactions = [],
  totalBalance = 0,
  loading = false,
  txSearchQuery = '',
  setTxSearchQuery,
  selectedTxTypeFilter = 'all',
  setSelectedTxTypeFilter,
  selectedWalletFilter = 'all',
  setSelectedWalletFilter,
  loadAccountsData,
  setIsAddAccountOpen,
  openCashFlow,
  openEditWallet,
  handleDeleteWallet,
  setSelectedTxForDetails,
  handleReverseTransaction,
}) {
  if (loading) {
    return (
      <div className="p-10 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="font-bold text-slate-900 m-0 text-sm">Loading accounts and ledger data...</p>
        <p className="text-xs text-slate-400 mt-1 mb-0">Synchronizing balances with database</p>
      </div>
    );
  }

  return (
    <div>
      {/* 3. Stats Section */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2.5 mb-3">
        <div className="bg-white py-2.5 px-3.5 rounded-lg border border-slate-200 shadow-sm">
          <span className="text-[0.72rem] text-slate-500 uppercase font-bold">
            Total Net Balance
          </span>
          <h3 className="text-xl mt-0.5 mb-0 text-emerald-600 font-extrabold font-mono">
            ৳ {totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <span className="text-[0.7rem] text-slate-400">Across all active financial accounts</span>
        </div>

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

      {/* Section Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-extrabold text-slate-900 m-0">
            Payment Accounts & Drawers
          </h3>
          <span className="text-[0.7rem] font-bold py-0.5 px-2 rounded-full bg-sky-100 text-sky-700">
            {wallets.length} ACCOUNTS
          </span>
        </div>
      </div>

      {/* 4. Account Cards Grid */}
      {wallets.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-10 px-5 text-center shadow-sm mb-3.5">
          <div className="text-4xl mb-2">🏦</div>
          <h4 className="font-bold text-slate-900 mt-0 mb-1 text-sm">No Accounts Configured</h4>
          <p className="text-xs text-slate-500 mt-0 mb-3 mx-auto max-w-[360px]">
            You have not registered any cash drawers, bank branches, or digital wallets yet.
          </p>
          <button
            type="button"
            onClick={() => setIsAddAccountOpen && setIsAddAccountOpen(true)}
            className="bg-sky-600 hover:bg-sky-700 text-white border-0 py-1.5 px-3.5 rounded-md font-bold text-xs cursor-pointer inline-flex items-center gap-1 transition-colors"
          >
            <span>+</span> Create First Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-2.5 mb-3.5">
          {wallets.map((wallet) => {
            const isCash = wallet.account_type === 'cash' || wallet.account_type === 'drawer';
            const isBank = wallet.account_type === 'bank';
            const balNum = Number(wallet.balance || 0);

            const iconConfig = isCash
              ? { icon: '💵', bgClass: 'bg-emerald-50 text-emerald-600 border-emerald-200', badgeClass: 'bg-emerald-100 text-emerald-700', typeLabel: 'Cash Drawer' }
              : isBank
              ? { icon: '🏦', bgClass: 'bg-blue-50 text-blue-600 border-blue-200', badgeClass: 'bg-blue-100 text-blue-700', typeLabel: 'Bank Account' }
              : {
                  icon: '📱',
                  bgClass: 'bg-purple-50 text-purple-600 border-purple-200',
                  badgeClass: 'bg-purple-100 text-purple-700',
                  typeLabel: wallet.account_type ? wallet.account_type.toUpperCase() : 'MFS / Wallet',
                };

            return (
              <div
                key={wallet.id}
                className="bg-white border border-slate-200 rounded-xl p-3 sm:px-3.5 shadow-sm flex flex-col justify-between gap-2 transition-shadow"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-8.5 h-8.5 rounded-lg border flex items-center justify-center text-base shrink-0 ${iconConfig.bgClass}`}
                      >
                        {iconConfig.icon}
                      </div>
                      <div className="min-w-0">
                        <h4
                          className="m-0 text-xs font-bold text-slate-900 truncate"
                          title={wallet.account_name}
                        >
                          {wallet.account_name}
                        </h4>
                        <span className="text-[0.72rem] text-slate-500">
                          {wallet.account_number ? `#${wallet.account_number}` : wallet.location ? `📍 ${wallet.location}` : iconConfig.typeLabel}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <span
                        className={`text-[0.68rem] font-bold py-0.5 px-1.5 rounded uppercase ${iconConfig.badgeClass}`}
                      >
                        {iconConfig.typeLabel}
                      </span>
                      {wallet.tender_name && (
                        <span className="text-[0.68rem] font-semibold py-0.5 px-1.5 rounded bg-sky-100 text-sky-700">
                          💳 {wallet.tender_name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Balance display */}
                  <div className="bg-slate-50 py-1.5 px-2.5 rounded-md border border-slate-100">
                    <div className="text-[0.68rem] text-slate-500 font-semibold uppercase">
                      Available Balance
                    </div>
                    <div className={`text-lg font-extrabold font-mono ${balNum < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                      ৳ {balNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Card bottom actions */}
                <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-1 mt-1">
                  <button
                    type="button"
                    onClick={() => openCashFlow(wallet, 'deposit')}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 rounded-md py-1 px-2 text-xs font-bold cursor-pointer flex items-center justify-center gap-1 transition-colors"
                    title="Deposit cash"
                  >
                    <span>⬆️</span> Deposit
                  </button>
                  <button
                    type="button"
                    onClick={() => openCashFlow(wallet, 'withdraw')}
                    className="bg-amber-500 hover:bg-amber-600 text-white border-0 rounded-md py-1 px-2 text-xs font-bold cursor-pointer flex items-center justify-center gap-1 transition-colors"
                    title="Withdraw cash"
                  >
                    <span>⬇️</span> Withdraw
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditWallet(wallet)}
                    className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 rounded-md py-1 px-2 text-xs cursor-pointer transition-colors"
                    title="Edit Account Details"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteWallet(wallet)}
                    className="bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-md py-1 px-2 text-xs cursor-pointer transition-colors"
                    title="Delete Account"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Central Transaction Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
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
    </div>
  );
}
