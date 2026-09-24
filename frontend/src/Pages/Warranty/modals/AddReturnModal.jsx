import React from 'react';

export default function AddReturnModal({
  isOpen,
  onClose,
  returnForm,
  setReturnForm,
  handleSubmitReturn,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-scaleUp">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>🔄</span> Process Product Return / Exchange (পণ্য ফেরত বা বদল)
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition p-1 text-sm rounded-md"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmitReturn} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                placeholder="e.g. INV-2026-0062"
                value={returnForm.invoice_no}
                onChange={(e) => setReturnForm({ ...returnForm, invoice_no: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Serial Number (S/N)
              </label>
              <input
                type="text"
                placeholder="e.g. TPL-AC1200-5512"
                value={returnForm.serial_code}
                onChange={(e) => setReturnForm({ ...returnForm, serial_code: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. TP-Link Archer C6 Router"
              value={returnForm.product_name}
              onChange={(e) => setReturnForm({ ...returnForm, product_name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Customer Name
              </label>
              <input
                type="text"
                placeholder="Customer Name"
                value={returnForm.customer_name}
                onChange={(e) => setReturnForm({ ...returnForm, customer_name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Return Action <span className="text-red-500">*</span>
              </label>
              <select
                value={returnForm.return_type}
                onChange={(e) => setReturnForm({ ...returnForm, return_type: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition"
              >
                <option value="Exchange">Exchange (অন্য পণ্য দিয়ে বদল)</option>
                <option value="Refund">Cash / Digital Refund (টাকা ফেরত)</option>
                <option value="Store Credit">Store Credit (কাস্টমার লেজারে জমা)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Physical Condition (Stock Impact) <span className="text-red-500">*</span>
              </label>
              <select
                value={returnForm.condition}
                onChange={(e) => setReturnForm({ ...returnForm, condition: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition"
              >
                <option value="Good">✓ Good / Intact (দোকানের স্টকে যোগ হবে)</option>
                <option value="Damaged">⚠️ Damaged / Burnt (ড্যামেজ বিনে যাবে)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Refund Amount (৳)
              </label>
              <input
                type="number"
                placeholder="0 if Exchange"
                value={returnForm.refund_amount}
                onChange={(e) => setReturnForm({ ...returnForm, refund_amount: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Return Reason
            </label>
            <textarea
              rows={2}
              placeholder="Reason for return or exchange..."
              value={returnForm.return_reason}
              onChange={(e) => setReturnForm({ ...returnForm, return_reason: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition resize-y"
            />
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
              className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-sm shadow-purple-600/30 transition cursor-pointer"
            >
              Confirm Return & Restock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
