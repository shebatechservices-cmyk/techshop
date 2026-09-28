import React from 'react';

export default function PaymentMethodForm({
  formData,
  setFormData,
  activeTab,
  setActiveTab,
  submitting,
  onClose,
  onSubmit,
}) {
  const isEdit = activeTab === 'edit';

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Method Name */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Method Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          autoFocus
          placeholder="e.g. bKash Merchant, Cash Counter 1, DBBL City"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Payment Method Type
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 bg-white transition cursor-pointer"
        >
          <option value="cash">💵 Cash</option>
          <option value="mobile_banking">📱 Mobile Banking (MFS)</option>
          <option value="bank">🏦 Bank Account</option>
          <option value="card">💳 Credit / Debit Card</option>
          <option value="wallet">👛 Digital Wallet</option>
          <option value="other">🏷️ Other</option>
        </select>
      </div>

      {/* Account Number */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Account / Mobile / Reference Number (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g. 01700-000000 or A/C 205.120.450"
          value={formData.account_number}
          onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition font-mono"
        />
      </div>

      {/* Account Details / Notes */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Description / Notes (Optional)
        </label>
        <textarea
          rows={2}
          placeholder="e.g. Primary merchant wallet used for retail payments"
          value={formData.account_details}
          onChange={(e) => setFormData({ ...formData, account_details: e.target.value })}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
        />
      </div>

      {/* Is Active Toggle */}
      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="pm_is_active"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
        />
        <label htmlFor="pm_is_active" className="text-xs font-semibold text-slate-700 cursor-pointer">
          Active for checkout and invoice transactions
        </label>
      </div>

      {/* Modal Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={isEdit ? () => setActiveTab('list') : onClose}
          className="px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 font-medium text-sm text-slate-700 transition cursor-pointer"
        >
          {isEdit ? 'Cancel Edit' : 'Cancel'}
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm font-medium text-sm transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
        >
          {submitting
            ? 'Saving...'
            : isEdit
            ? '✓ Update Payment Method'
            : '+ Create Payment Method'}
        </button>
      </div>
    </form>
  );
}
