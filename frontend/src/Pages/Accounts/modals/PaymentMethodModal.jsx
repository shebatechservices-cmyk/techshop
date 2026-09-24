import React from 'react';

export default function PaymentMethodModal({
  isOpen,
  onClose,
  modalMode,
  formData,
  setFormData,
  handleSubmitModal,
  submitting,
  modalError,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-scaleUp">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span>{modalMode === 'add' ? '➕' : '✏️'}</span>
            <span>{modalMode === 'add' ? 'Add New Payment Method' : 'Edit Payment Method'}</span>
          </h4>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 text-base leading-none rounded-md hover:bg-slate-200/50"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmitModal} className="p-5 space-y-4">
          {modalError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{modalError}</span>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Method Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Cash, bKash, Nagad, City Bank"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Payment Method Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
            >
              <option value="cash">💵 Cash</option>
              <option value="mobile_banking">📱 Mobile Banking (MFS)</option>
              <option value="bank">🏦 Bank Account</option>
              <option value="card">💳 Credit/Debit Card</option>
              <option value="wallet">👛 Digital Wallet</option>
              <option value="other">🏷️ Other</option>
            </select>
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Account / Phone / Card Number <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g., 01700-000000 or 150.120.3456"
              value={formData.account_number}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
            />
          </div>

          {/* Account Details / Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Account Details / Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Branch name, routing number, or merchant notes..."
              value={formData.account_details}
              onChange={(e) => setFormData({ ...formData, account_details: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition resize-y"
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              id="is_active_check"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
            />
            <label htmlFor="is_active_check" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
              Set as Active (Available immediately in Sales & Purchases)
            </label>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end items-center gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2 text-xs font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/30 transition ${
                submitting ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {submitting ? 'Saving...' : modalMode === 'add' ? 'Create Method' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
