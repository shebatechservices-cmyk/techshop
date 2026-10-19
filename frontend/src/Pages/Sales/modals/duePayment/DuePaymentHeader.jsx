import React from 'react';

export default function DuePaymentHeader({ paymentMode, sale, customerName, onClose }) {
  return (
    <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex justify-between items-center border-b border-slate-700">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xl font-bold">
          💳
        </div>
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Collect Due Payment / বকেয়া আদায়
          </h3>
          <p className="text-xs text-slate-300">
            {paymentMode === 'single'
              ? `Invoice #${sale?.invoice_no || sale?.id}`
              : `Customer: ${customerName}`}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
      >
        ✕
      </button>
    </div>
  );
}
