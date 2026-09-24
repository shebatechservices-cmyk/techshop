import React from 'react';

export default function EditWalletModal({
  isOpen,
  onClose,
  editWalletForm,
  setEditWalletForm,
  tenders = [],
  editWalletLoading,
  onSubmit,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center z-[10000] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 relative z-[10001]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 m-0">Edit Account</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Account Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editWalletForm.name}
              onChange={(e) => setEditWalletForm({ ...editWalletForm, name: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Method
            </label>
            <select
              value={editWalletForm.tender_id || ''}
              onChange={(e) => setEditWalletForm({ ...editWalletForm, tender_id: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="">-- Select Payment Method --</option>
              {tenders.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Account Classification
            </label>
            <select
              value={editWalletForm.account_type}
              onChange={(e) => setEditWalletForm({ ...editWalletForm, account_type: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="drawer">💵 Cash Drawer</option>
              <option value="cash">💵 Cash In Hand</option>
              <option value="bank">🏦 Bank Account</option>
              <option value="bkash">📱 bKash Merchant</option>
              <option value="nagad">📱 Nagad Merchant</option>
              <option value="rocket">📱 DBBL Rocket</option>
              <option value="wallet">👛 Digital Wallet</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Account / Mobile / Branch Number
            </label>
            <input
              type="text"
              value={editWalletForm.account_number}
              onChange={(e) => setEditWalletForm({ ...editWalletForm, account_number: e.target.value })}
              placeholder="e.g. 01700-000000 or A/C 205.120.450"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editWalletLoading}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition disabled:opacity-60 cursor-pointer shadow-xs"
            >
              {editWalletLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
