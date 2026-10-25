import React from 'react';
import PartyWalletSummaryCards from './wallet/PartyWalletSummaryCards';
import PartyWalletLedgerTable from './wallet/PartyWalletLedgerTable';
import PartyWalletGuidance from './wallet/PartyWalletGuidance';

const ACTION_OPTIONS = {
  customer: [
    { id: 'deposit', label: '📥 Deposit into Wallet' },
    { id: 'withdraw', label: '📤 Withdraw / Refund' },
    { id: 'due_payment', label: '💵 Pay Due From Wallet' },
  ],
  supplier: [
    { id: 'deposit', label: '📥 Deposit Into Wallet' },
    { id: 'withdraw', label: '📤 Cash Back / Refund' },
    { id: 'due_payment', label: '💵 Pay Due From Wallet' },
  ],
  staff: [
    { id: 'salary', label: '💼 Salary Credit' },
    { id: 'bonus', label: '🎁 Bonus Credit' },
    { id: 'withdraw', label: '📤 Withdraw' },
  ],
};

export default function PartyWalletTab({
  partyType,
  walletBalance,
  balance,
  walletAction,
  setWalletAction,
  walletForm,
  setWalletForm,
  walletLoading,
  walletError,
  setWalletError,
  walletSuccess,
  setWalletSuccess,
  wallets,
  walletData,
  walletNeedsAccount,
  handleWalletSubmit,
}) {
  const walletTransactions = walletData?.transactions || [];
  const actions = ACTION_OPTIONS[partyType] || ACTION_OPTIONS.customer;

  return (
    <div>
      {/* Wallet Summary */}
      <PartyWalletSummaryCards
        partyType={partyType}
        walletBalance={walletBalance}
        balance={balance}
      />

      {/* Wallet Actions */}
      <div className="mb-3.5">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">🪙 Wallet Operations</h4>
        <div className="flex flex-wrap gap-2">
          {actions.map((act) => (
            <button
              key={act.id}
              type="button"
              onClick={() => {
                setWalletAction(act.id);
                setWalletError('');
                setWalletSuccess('');
                setWalletForm((prev) => ({ ...prev, amount: '', note: '', reference: '' }));
              }}
              className={`py-2 px-3.5 rounded-xl font-bold text-xs transition-all border ${
                walletAction === act.id
                  ? 'border-purple-600 bg-purple-50 text-purple-800 ring-2 ring-purple-100'
                  : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {act.label}
            </button>
          ))}
        </div>
      </div>

      {/* Wallet guidance */}
      <PartyWalletGuidance partyType={partyType} walletAction={walletAction} />

      {walletError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl mb-3.5 text-xs font-medium">⚠️ {walletError}</div>
      )}
      {walletSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl mb-3.5 text-xs font-medium">✓ {walletSuccess}</div>
      )}

      <form onSubmit={handleWalletSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-4">
          {walletNeedsAccount() && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {partyType === 'customer'
                  ? (walletAction === 'deposit' ? '📥 Receive Into Shop Account *' : '💸 Pay From Shop Account *')
                  : partyType === 'supplier'
                  ? (walletAction === 'deposit' ? '💸 Pay From Shop Account *' : '📥 Receive Into Shop Account *')
                  : '💸 Pay Out (Withdraw) From Shop Account *'}
              </label>
              <select
                value={walletForm.account_id}
                onChange={(e) => setWalletForm({ ...walletForm, account_id: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 bg-white transition-all"
              >
                <option value="">Select Shop Account...</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.account_name || w.name} (৳ {Number(w.balance || 0).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (BDT ৳) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="e.g. 1000"
              value={walletForm.amount}
              onChange={(e) => setWalletForm({ ...walletForm, amount: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reference / Purpose (রেফারেন্স / কারণ) *
            </label>
            <input
              type="text"
              required
              placeholder="যেমন: মনিটর বাবদ / হাওলাত বাবদ / ভাউচার নং"
              value={walletForm.reference}
              onChange={(e) => setWalletForm({ ...walletForm, reference: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Note (মন্তব্য)</label>
            <input
              type="text"
              placeholder="e.g. Monthly credit deposit"
              value={walletForm.note}
              onChange={(e) => setWalletForm({ ...walletForm, note: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={walletLoading}
          className="py-2.5 px-5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
        >
          {walletLoading ? 'Processing Wallet Transaction...' : `🪙 Confirm ${walletAction.toUpperCase()} (${walletForm.amount ? `৳ ${Number(walletForm.amount).toLocaleString()}` : ''})`}
        </button>
      </form>

      {/* Wallet Ledger */}
      <PartyWalletLedgerTable transactions={walletTransactions} />
    </div>
  );
}
