import React from 'react';

export default function AddClaimModal({
  isOpen,
  onClose,
  claimForm,
  setClaimForm,
  handleSubmitClaim,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-2xl border border-slate-100 animate-scaleUp">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>🛡️</span> Receive Warranty Item (Intake Service Claim)
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition p-1 text-sm rounded-md"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmitClaim} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Serial Number (S/N) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. DH-CAM-99281-A"
                value={claimForm.serial_code}
                onChange={(e) => setClaimForm({ ...claimForm, serial_code: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Invoice Number <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. INV-2026-0042"
                value={claimForm.invoice_no}
                onChange={(e) => setClaimForm({ ...claimForm, invoice_no: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Product Name / Model <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dahua 2MP Full-Color Bullet Camera"
              value={claimForm.product_name}
              onChange={(e) => setClaimForm({ ...claimForm, product_name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Tanvir Ahmed"
                value={claimForm.customer_name}
                onChange={(e) => setClaimForm({ ...claimForm, customer_name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Customer Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="017XXXXXXXX"
                value={claimForm.customer_phone}
                onChange={(e) => setClaimForm({ ...claimForm, customer_phone: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Reported Issue / Defect Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              placeholder="What is wrong with the device? e.g. Night vision LED not working, BNC loose..."
              value={claimForm.issue_description}
              onChange={(e) => setClaimForm({ ...claimForm, issue_description: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Temporary Backup Unit Provided?
              </label>
              <input
                type="text"
                placeholder="e.g. Backup 2MP Cam or None"
                value={claimForm.backup_unit_provided}
                onChange={(e) => setClaimForm({ ...claimForm, backup_unit_provided: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Estimated Ready Date
              </label>
              <input
                type="date"
                value={claimForm.estimated_delivery_date}
                onChange={(e) => setClaimForm({ ...claimForm, estimated_delivery_date: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-sm shadow-sky-600/30 transition cursor-pointer"
            >
              Accept & Generate Token Slip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
