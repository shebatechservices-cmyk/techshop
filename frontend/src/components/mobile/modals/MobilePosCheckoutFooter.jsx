import React from 'react';

const taka = (v) => `৳ ${Number(v || 0).toLocaleString('en-BD', { minimumFractionDigits: 0 })}`;

export default function MobilePosCheckoutFooter({
  totalPayable,
  dueAmount,
  saving,
  cartEmpty,
  onCompleteSale,
}) {
  return (
    <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
      <div>
        <span className="text-[10px] text-slate-500 block">মোট প্রদেয়</span>
        <strong className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-tight">
          {taka(totalPayable)}
        </strong>
        {dueAmount > 0 && (
          <span className="text-[10px] text-rose-500 font-bold block">বাকি: {taka(dueAmount)}</span>
        )}
      </div>
      <button
        type="button"
        onClick={onCompleteSale}
        disabled={saving || cartEmpty}
        className="flex-1 py-3 px-4 bg-gradient-to-tr from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
      >
        {saving ? 'সংরক্ষণ হচ্ছে...' : 'বিক্রি সম্পন্ন করুন ➔'}
      </button>
    </div>
  );
}
