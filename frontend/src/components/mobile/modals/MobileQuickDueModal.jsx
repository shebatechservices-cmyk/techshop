import React from 'react';
import useMobileQuickDue from './useMobileQuickDue';
import MobileDueCustomerSelect from './MobileDueCustomerSelect';

const taka = (v) => `৳ ${Number(v || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;

export default function MobileQuickDueModal({ isOpen, onClose, onSuccess }) {
  const {
    filteredCustomers,
    accounts,
    selectedCustomer,
    customerDue,
    amount,
    setAmount,
    accountId,
    setAccountId,
    note,
    setNote,
    search,
    setSearch,
    submitting,
    error,
    handleSelectCustomer,
    handleSetFullDue,
    handleSubmit,
  } = useMobileQuickDue({ isOpen, onClose, onSuccess });

  if (!isOpen) return null;

  const numAmount = Number(amount || 0);
  const isOverDue = customerDue > 0 && numAmount > customerDue;

  return (
    <div
      className="fixed inset-0 z-[9995] bg-slate-950/60 backdrop-blur-sm flex flex-col justify-end"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-200 dark:border-slate-800 h-[92vh] flex flex-col animate-slideUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">💵</span>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm m-0">
                দ্রুত বকেয়া আদায় (Due Collection)
              </h3>
              <p className="text-[11px] text-slate-500 m-0">গ্রাহকের বাকি সংগ্রহ ও ইনস্ট্যান্ট রিসিট</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {!selectedCustomer ? (
            <MobileDueCustomerSelect
              search={search}
              setSearch={setSearch}
              filteredCustomers={filteredCustomers}
              onSelectCustomer={handleSelectCustomer}
            />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400">সিলেক্টেড গ্রাহক</span>
                  <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm m-0">{selectedCustomer.name}</h4>
                  <span className="text-xs text-slate-500">{selectedCustomer.phone}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">বর্তমান মোট বাকি</span>
                  <strong className="text-base text-rose-600 dark:text-rose-400 font-black">
                    {taka(customerDue)}
                  </strong>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">আদায়ের পরিমাণ (৳):</label>
                  {customerDue > 0 && (
                    <button
                      type="button"
                      onClick={handleSetFullDue}
                      className="text-[11px] font-bold text-amber-600 hover:text-amber-700 underline cursor-pointer"
                    >
                      পুরো বাকি দিন ({taka(customerDue)})
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  step="0.01"
                  max={customerDue > 0 ? customerDue : undefined}
                  placeholder="টাকার পরিমাণ লিখুন"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full px-3.5 py-3 rounded-xl border text-base font-black focus:outline-none focus:ring-2 ${
                    isOverDue
                      ? 'border-rose-400 bg-rose-50 text-rose-900 focus:ring-rose-400'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-amber-500'
                  }`}
                  autoFocus
                />
                {isOverDue && (
                  <p className="text-[11px] text-rose-600 font-bold m-0 animate-pulse">
                    ⚠️ বকেয়া পরিমাণের ({taka(customerDue)}) চেয়ে বেশি টাকা এন্ট্রি দেওয়া সম্ভব নয়।
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">পেমেন্ট জমা অ্যাকাউন্ট:</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_name || acc.name} ({acc.account_type || 'Account'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">মন্তব্য (ঐচ্ছিক):</label>
                <input
                  type="text"
                  placeholder="নোট বা রেফারেন্স..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectCustomer({ id: '' })}
                  className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  গ্রাহক পরিবর্তন
                </button>
                <button
                  type="submit"
                  disabled={submitting || isOverDue || !numAmount}
                  className="flex-1 py-3 bg-gradient-to-tr from-amber-500 to-orange-600 text-white font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                >
                  {submitting ? 'আদায় হচ্ছে...' : `৳ ${numAmount.toLocaleString('en-BD')} জমা নিন`}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
