import React from 'react';

export default function DuePaymentFormFields({
  paymentMode,
  amount,
  setAmount,
  saleDue,
  customerTotalDue,
  customerName,
  sale,
  accountId,
  setAccountId,
  accounts,
  loadingAccounts,
  referenceNo,
  setReferenceNo,
  note,
  setNote,
  taka
}) {
  const maxDue = paymentMode === 'single' ? saleDue : customerTotalDue;
  const isOverDue = Number(amount || 0) > maxDue && maxDue > 0;

  return (
    <>
      {/* Due Info Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex justify-between items-center">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {paymentMode === 'single' ? 'Current Invoice Due' : 'Customer Overall Due'}
          </span>
          <span className="text-xs text-slate-600">
            {customerName} {sale?.invoice_no ? `• ${sale.invoice_no}` : ''}
          </span>
        </div>
        <div className="text-right">
          <span className="text-lg font-black text-rose-600">
            {taka(paymentMode === 'single' ? saleDue : customerTotalDue)}
          </span>
        </div>
      </div>

      {/* Amount Input */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-xs font-bold text-slate-700">
            Collected Amount (টাকার অংক) <span className="text-rose-500">*</span>
          </label>
          {paymentMode === 'single' && saleDue > 0 && (
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setAmount(String(saleDue))}
                className="text-[10px] font-bold text-sky-600 hover:underline px-1.5 py-0.5 bg-sky-50 rounded border border-sky-200"
              >
                Full (100%)
              </button>
              {saleDue > 500 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(Math.round(saleDue / 2)))}
                  className="text-[10px] font-bold text-slate-600 hover:underline px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200"
                >
                  Half (50%)
                </button>
              )}
            </div>
          )}
        </div>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
            ৳
          </span>
          <input
            type="number"
            step="any"
            min="1"
            max={maxDue > 0 ? maxDue : undefined}
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 ${
              isOverDue
                ? 'border-rose-500 focus:ring-rose-500 text-rose-700 bg-rose-50/50'
                : 'border-slate-300 focus:ring-sky-500'
            }`}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
        {isOverDue && (
          <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
            ⚠️ পেমেন্টের পরিমাণ বকেয়া (৳ {maxDue.toLocaleString()}) এর চেয়ে বেশি হতে পারবে না।
          </p>
        )}
      </div>

      {/* Payment Account Selection */}
      <div>
        <label className="text-xs font-bold text-slate-700 block mb-1">
          Deposit Account / Wallet <span className="text-rose-500">*</span>
        </label>
        {loadingAccounts ? (
          <div className="text-xs text-slate-400 py-2">Loading accounts...</div>
        ) : (
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">-- Select Payment Wallet / Account --</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.account_type || 'Account'}) — Balance: {taka(acc.balance || 0)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Reference & Note */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">
            Ref / TrxID (ঐচ্ছিক)
          </label>
          <input
            type="text"
            value={referenceNo}
            onChange={(e) => setReferenceNo(e.target.value)}
            placeholder="e.g. TRX-98124"
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">
            Remarks / Note
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Cash settled by brother"
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>
    </>
  );
}
