import React from 'react';

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

  return (
    <div>
      {/* Wallet Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4">
          <span className="text-[11px] text-purple-700 uppercase font-bold tracking-wider">👛 Wallet Balance</span>
          <div className="text-2xl font-extrabold text-purple-800 mt-1">
            ৳ {walletBalance.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
          </div>
          <small className="text-purple-500 text-xs">
            {partyType === 'staff' ? 'Credit wallet — drawer unchanged until withdrawal' : 'Available credit in wallet'}
          </small>
        </div>
        <div className={`border rounded-xl p-4 ${balance > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <span className={`text-[11px] uppercase font-bold tracking-wider ${balance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
            {partyType === 'customer'
              ? (balance > 0 ? 'Outstanding Due' : balance < 0 ? 'Advance Credit' : 'Net Position')
              : partyType === 'supplier'
              ? (balance > 0 ? 'Payable Due' : balance < 0 ? 'Advance Given' : 'Net Position')
              : 'Net Position'}
          </span>
          <div className={`text-2xl font-extrabold mt-1 ${balance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
            ৳ {balance.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
          </div>
          <small className={`text-xs ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {partyType === 'staff' ? 'Linked sales/ledger position' : balance > 0 ? 'Pending settlement' : balance < 0 ? (partyType === 'customer' ? 'Advance credit' : 'Advance given') : 'All cleared'}
          </small>
        </div>
      </div>

      {/* Wallet Actions */}
      <div className="mb-3.5">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">🪙 Wallet Operations</h4>
        <div className="flex flex-wrap gap-2">
          {partyType === 'customer' && [
            { id: 'deposit', label: '📥 Deposit into Wallet' },
            { id: 'withdraw', label: '📤 Withdraw / Refund' },
            { id: 'due_payment', label: '💵 Pay Due From Wallet' },
          ].map((act) => (
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
          {partyType === 'supplier' && [
            { id: 'deposit', label: '📥 Deposit Into Wallet' },
            { id: 'withdraw', label: '📤 Cash Back / Refund' },
            { id: 'due_payment', label: '💵 Pay Due From Wallet' },
          ].map((act) => (
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
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100'
                  : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {act.label}
            </button>
          ))}
          {partyType === 'staff' && [
            { id: 'salary', label: '💼 Salary Credit' },
            { id: 'bonus', label: '🎁 Bonus Credit' },
            { id: 'withdraw', label: '📤 Withdraw' },
          ].map((act) => (
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
      <div className="p-3 rounded-xl mb-3.5 text-xs leading-relaxed bg-purple-50/60 border border-purple-200 text-purple-900">
        {partyType === 'customer' && (
          walletAction === 'deposit'
            ? '💡 Customer wallet deposits increase shop funds and can be used to pay for future sales or outstanding invoices without affecting physical drawer cash again.'
            : walletAction === 'withdraw'
            ? '💡 Customer wallet withdrawals or refunds are paid out from your selected shop account.'
            : '💡 Settle receivable due using existing customer wallet balance without creating additional drawer cash movements.'
        )}
        {partyType === 'supplier' && (
          walletAction === 'deposit'
            ? '💡 Pre-fund supplier wallet for future purchase orders and invoice reconciliations.'
            : walletAction === 'withdraw'
            ? '💡 Refund or draw down supplier wallet balance into selected shop account.'
            : '💡 Pay supplier payable due using available supplier advance wallet balance.'
        )}
        {partyType === 'staff' && (
          walletAction === 'salary' || walletAction === 'bonus'
            ? '💡 Credit salary or performance bonus directly to the staff wallet balance.'
            : '💡 Disburse staff wallet funds directly from selected shop account.'
        )}
      </div>

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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reference / Voucher #</label>
            <input
              type="text"
              placeholder="e.g. DEP-2026-001"
              value={walletForm.reference}
              onChange={(e) => setWalletForm({ ...walletForm, reference: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Note</label>
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
          className="py-2.5 px-5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-xs shadow-md transition-all disabled:opacity-50"
        >
          {walletLoading ? 'Processing Wallet Transaction...' : `🪙 Confirm ${walletAction.toUpperCase()} (${walletForm.amount ? `৳ ${Number(walletForm.amount).toLocaleString()}` : ''})`}
        </button>
      </form>

      {/* Wallet Ledger */}
      <div className="mt-5">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
          📒 Wallet Transaction Ledger {walletTransactions.length > 0 && <span className="text-slate-400 font-normal">({walletTransactions.length})</span>}
        </h4>
        {walletTransactions.length === 0 ? (
          <p className="text-slate-400 text-xs">No wallet transactions recorded yet.</p>
        ) : (
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
                {walletTransactions.map((tx) => (
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
        )}
      </div>
    </div>
  );
}
