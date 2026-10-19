import React from 'react';

export default function PaymentSlipTopBar({
  receiptNo,
  printLayout,
  setPrintLayout,
  onClose,
}) {
  return (
    <div className="p-4 bg-slate-800 text-white flex items-center justify-between print:hidden">
      <div className="flex items-center gap-2">
        <span className="text-xl">🧾</span>
        <div>
          <h3 className="text-sm font-bold tracking-tight">Payment Receipt / মানি রিসিট</h3>
          <p className="text-[11px] text-slate-300">#{receiptNo}</p>
        </div>
      </div>

      {/* Format Toggle & Close */}
      <div className="flex items-center gap-2">
        <div className="bg-slate-700 p-0.5 rounded-lg flex text-xs font-semibold">
          <button
            type="button"
            onClick={() => setPrintLayout('thermal')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              printLayout === 'thermal'
                ? 'bg-sky-500 text-white shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Thermal (80mm)
          </button>
          <button
            type="button"
            onClick={() => setPrintLayout('a4')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              printLayout === 'a4'
                ? 'bg-sky-500 text-white shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Voucher / Slip
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors text-lg cursor-pointer"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
