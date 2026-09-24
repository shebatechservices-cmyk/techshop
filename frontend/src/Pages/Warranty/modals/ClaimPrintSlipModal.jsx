import React from 'react';

export default function ClaimPrintSlipModal({ claimToPrint, setClaimToPrint }) {
  if (!claimToPrint) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) setClaimToPrint(null);
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 animate-scaleUp">
        {/* Printable Container */}
        <div
          id="warranty-token-slip"
          className="border-2 border-slate-900 p-4 rounded-xl bg-white text-slate-900 text-xs"
        >
          <div className="text-center border-b border-dashed border-slate-900 pb-2.5 mb-3">
            <h2 className="text-base font-black text-slate-900 tracking-wider">
              SHEBA TECHNOLOGY
            </h2>
            <div className="text-[11px] text-slate-600">
              CCTV, IT Security & Computer Solutions
            </div>
            <div className="text-[11px] text-slate-600">
              Mobile: 01711-000000 · Dhaka, Bangladesh
            </div>
            <div className="inline-block bg-slate-900 text-white px-2.5 py-0.5 rounded text-[10px] font-bold mt-1.5 uppercase">
              WARRANTY SERVICE TOKEN (গ্রাহক কপি)
            </div>
          </div>

          <div className="flex justify-between items-center text-xs mb-2">
            <span>
              Token #: <strong className="font-mono text-sky-700 font-bold">{claimToPrint.claim_no}</strong>
            </span>
            <span>
              Date: <strong>{claimToPrint.received_date || 'Today'}</strong>
            </span>
          </div>

          <div className="text-xs mb-2 border-b border-dotted border-slate-300 pb-2 space-y-0.5">
            <div>
              Customer: <strong>{claimToPrint.customer_name}</strong>
            </div>
            <div>
              Phone: <strong>{claimToPrint.customer_phone}</strong>
            </div>
            {claimToPrint.invoice_no && (
              <div>
                Invoice Ref: <strong>{claimToPrint.invoice_no}</strong>
              </div>
            )}
          </div>

          <div className="text-xs mb-2 space-y-0.5">
            <div className="font-extrabold text-slate-900">{claimToPrint.product_name}</div>
            <div className="font-mono text-[11px] text-slate-700">
              Serial (S/N): <strong>{claimToPrint.serial_code}</strong>
            </div>
            {claimToPrint.replacement_serial_code && (
              <div className="text-emerald-700 font-bold text-[11px]">
                Replaced with New S/N: {claimToPrint.replacement_serial_code}
              </div>
            )}
          </div>

          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-[11px] mb-2.5 space-y-1">
            <div>
              <strong>Reported Problem:</strong> {claimToPrint.issue_description}
            </div>
            {claimToPrint.backup_unit_provided && claimToPrint.backup_unit_provided !== 'None' && (
              <div className="text-amber-800">
                <strong>Backup Unit:</strong> {claimToPrint.backup_unit_provided}
              </div>
            )}
            {claimToPrint.estimated_delivery_date && (
              <div className="text-sky-700">
                <strong>Expected Delivery:</strong> {claimToPrint.estimated_delivery_date}
              </div>
            )}
          </div>

          <div className="text-center text-[10px] text-slate-500 border-t border-dashed border-slate-900 pt-2">
            * পণ্য ডেলিভারি নেওয়ার সময় অবশ্যই এই টোকেন স্লিপটি কাউন্টারে সাথে নিয়ে আসবেন।
          </div>
        </div>

        {/* Print & Close Buttons */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={() => setClaimToPrint(null)}
            className="px-4 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition cursor-pointer text-xs"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-sm transition cursor-pointer text-xs flex items-center gap-1.5"
          >
            <span>🖨️</span> Print Slip
          </button>
        </div>
      </div>
    </div>
  );
}
