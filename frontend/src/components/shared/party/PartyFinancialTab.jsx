import React from 'react';

export default function PartyFinancialTab({
  partyType,
  finAction,
  setFinAction,
  finForm,
  setFinForm,
  finLoading,
  finError,
  setFinError,
  finSuccess,
  setFinSuccess,
  balance,
  wallets,
  handleFinSubmit,
}) {
  return (
    <div>
      {/* Party-Specific Sub Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-3.5">
        {partyType === 'supplier' && [
          { id: 'due', label: '💸 Pay Supplier Due' },
        ].map((act) => (
          <button
            key={act.id}
            type="button"
            onClick={() => {
              setFinAction(act.id);
              setFinError('');
              setFinSuccess('');
              if (act.id === 'due' && balance > 0) {
                setFinForm((prev) => ({ ...prev, amount: String(balance) }));
              } else {
                setFinForm((prev) => ({ ...prev, amount: '' }));
              }
            }}
            className={`py-2 px-4 rounded-xl font-bold text-xs transition-all border ${
              finAction === act.id
                ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100'
                : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {act.label}
          </button>
        ))}

        {partyType === 'customer' && [
          { id: 'due', label: '💵 Collect Customer Due' },
          { id: 'refund', label: '📤 Refund / Return Payout' },
        ].map((act) => (
          <button
            key={act.id}
            type="button"
            onClick={() => {
              setFinAction(act.id);
              setFinError('');
              setFinSuccess('');
              if (act.id === 'due' && balance > 0) {
                setFinForm((prev) => ({ ...prev, amount: String(balance) }));
              } else {
                setFinForm((prev) => ({ ...prev, amount: '' }));
              }
            }}
            className={`py-2 px-4 rounded-xl font-bold text-xs transition-all border ${
              finAction === act.id
                ? 'border-sky-600 bg-sky-50 text-sky-800 ring-2 ring-sky-100'
                : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {act.label}
          </button>
        ))}

        {partyType === 'staff' && [
          { id: 'salary', label: '💼 Pay Salary / Advance' },
        ].map((act) => (
          <button
            key={act.id}
            type="button"
            onClick={() => {
              setFinAction(act.id);
              setFinError('');
              setFinSuccess('');
            }}
            className="py-2 px-4 rounded-xl font-bold text-xs border border-purple-600 bg-purple-50 text-purple-800 ring-2 ring-purple-100"
          >
            {act.label}
          </button>
        ))}
      </div>

      {/* Informational Guidance Banner */}
      <div
        className={`p-3 rounded-xl mb-4 text-xs leading-relaxed border ${
          partyType === 'supplier'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : partyType === 'customer'
            ? 'bg-sky-50 border-sky-200 text-sky-800'
            : 'bg-purple-50 border-purple-200 text-purple-800'
        }`}
      >
        {partyType === 'supplier' && (
          '💡 Direct payout to supplier from your selected shop account (Cash Drawer / Bank / MFS) which will reduce their Payable Due balance.'
        )}
        {partyType === 'customer' && (
          finAction === 'due'
            ? '💡 Received due payment will deposit into your selected shop account (Cash / Bank / MFS) and reduce the customer’s Receivable Due balance.'
            : '💡 Customer refund or return payout will be deducted from your selected shop account.'
        )}
        {partyType === 'staff' && (
          '💡 Staff salary, commission, or conveyance advance payment will be deducted as an expense from your selected shop account.'
        )}
      </div>

      {finError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl mb-3.5 text-xs font-medium">
          ⚠️ {finError}
        </div>
      )}

      {finSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl mb-3.5 text-xs font-medium">
          ✓ {finSuccess}
        </div>
      )}

      <form onSubmit={handleFinSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {partyType === 'customer' && finAction !== 'refund'
                ? '📥 Deposit Into Shop Account *'
                : '💸 Pay From Shop Account *'}
            </label>
            <select
              value={finForm.account_id}
              onChange={(e) => setFinForm({ ...finForm, account_id: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 bg-white transition-all"
            >
              <option value="">Select Shop Account (Cash / Bank / MFS)...</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.account_name || w.name} (৳ {Number(w.balance || 0).toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Amount (BDT ৳) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder={finAction === 'due' && balance > 0 ? String(balance) : 'e.g. 500'}
              value={finForm.amount}
              onChange={(e) => setFinForm({ ...finForm, amount: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Reference / Note / Voucher #
          </label>
          <input
            type="text"
            placeholder={
              partyType === 'supplier'
                ? 'e.g. Paid via bKash / Bank Cheque for PO'
                : partyType === 'customer'
                ? (finAction === 'due' ? 'e.g. Cash received for sales invoice' : 'e.g. Return payout for damaged unit')
                : 'e.g. Monthly salary / Travel conveyance advance'
            }
            value={finForm.note}
            onChange={(e) => setFinForm({ ...finForm, note: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={finLoading}
          className={`py-2.5 px-5 rounded-xl text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 ${
            partyType === 'supplier'
              ? 'bg-emerald-600 hover:bg-emerald-700'
              : partyType === 'staff'
              ? 'bg-purple-600 hover:bg-purple-700'
              : finAction === 'refund'
              ? 'bg-rose-600 hover:bg-rose-700'
              : 'bg-sky-600 hover:bg-sky-700'
          }`}
        >
          {finLoading
            ? 'Processing Transaction...'
            : partyType === 'supplier'
            ? `💸 Confirm Due Payment to Supplier (${finForm.amount ? `৳ ${Number(finForm.amount).toLocaleString()}` : ''})`
            : partyType === 'customer'
            ? finAction === 'due'
              ? `💵 Confirm Due Collection (${finForm.amount ? `৳ ${Number(finForm.amount).toLocaleString()}` : ''})`
              : `📤 Confirm Refund Payout (${finForm.amount ? `৳ ${Number(finForm.amount).toLocaleString()}` : ''})`
            : `💼 Confirm Staff Payment (${finForm.amount ? `৳ ${Number(finForm.amount).toLocaleString()}` : ''})`}
        </button>
      </form>
    </div>
  );
}
