import React from 'react';

export default function LedgerAccountsGrid({
  wallets = [],
  setIsAddAccountOpen = () => {},
  openCashFlow = () => {},
  openEditWallet = () => {},
  handleDeleteWallet = () => {}
}) {
  return (
    <div>
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

      {/* Account Cards Grid */}
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
    </div>
  );
}
