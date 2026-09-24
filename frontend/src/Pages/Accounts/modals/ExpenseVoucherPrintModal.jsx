import React from 'react';

export default function ExpenseVoucherPrintModal({
  voucherToPrint,
  onClose,
}) {
  if (!voucherToPrint) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-[999999] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Voucher Body for Print */}
        <div
          id="expense-debit-voucher"
          className="border-2 border-slate-900 p-5 rounded-lg bg-white font-serif"
        >
          {/* Header */}
          <div className="text-center border-b-2 border-slate-900 pb-2.5 mb-3">
            <h2 className="m-0 text-xl font-black text-slate-900 tracking-wider">
              SHEBA TECHNOLOGY
            </h2>
            <div className="text-xs text-slate-600 font-sans">
              CCTV, Computer & IT Networking Solutions
            </div>
            <div className="text-xs text-slate-600 font-sans">
              Dhaka, Bangladesh · Phone: 01711-000000
            </div>
            <div className="inline-block bg-slate-900 text-white py-0.5 px-3 rounded text-xs font-extrabold mt-2 font-sans">
              OFFICIAL DEBIT PAYMENT VOUCHER (খরচ ভাউচার)
            </div>
          </div>

          {/* Voucher Meta */}
          <div className="flex justify-between text-xs sm:text-sm mb-2.5 font-sans">
            <span>
              Voucher #: <strong className="font-mono text-red-600">{voucherToPrint.voucher_no}</strong>
            </span>
            <span>
              Date: <strong>{new Date(voucherToPrint.expense_date).toLocaleDateString()}</strong>
            </span>
          </div>

          {/* Payee and Source */}
          <div className="border-t border-b border-dashed border-slate-300 py-2.5 mb-3 text-xs sm:text-sm font-sans space-y-1">
            <div>
              Paid To (প্রাপক): <strong>{voucherToPrint.payee_name || 'General'}</strong>
            </div>
            <div>
              Expense Head (খাত): <strong>{voucherToPrint.category_name}</strong>
            </div>
            <div>
              Disbursed From: <strong>{voucherToPrint.account_name}</strong>
            </div>
            {voucherToPrint.reference_no && (
              <div>
                Reference / Memo #: <strong>{voucherToPrint.reference_no}</strong>
              </div>
            )}
          </div>

          {/* Amount Box */}
          <div className="bg-slate-50 border-1.5 border-slate-300 p-3 rounded-md mb-3.5 text-center">
            <div className="text-xs text-slate-500 uppercase font-sans font-bold">
              Amount Paid
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">
              ৳ {Number(voucherToPrint.amount || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-600 italic mt-0.5 font-sans">
              Purpose: {voucherToPrint.note || 'Official shop operational expenditure'}
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-2.5 mt-9 text-center text-xs font-sans text-slate-700">
            <div className="border-t border-slate-900 pt-1 font-semibold">Prepared By</div>
            <div className="border-t border-slate-900 pt-1 font-semibold">Approved By</div>
            <div className="border-t border-slate-900 pt-1 font-semibold">Receiver's Signature</div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2.5 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="py-2 px-5 rounded-md border-0 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
          >
            🖨️ Print Voucher
          </button>
        </div>
      </div>
    </div>
  );
}
