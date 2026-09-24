import React from 'react';

export default function EditAccountModal({
  isOpen,
  onClose,
  tenders,
  editAccountForm,
  setEditAccountForm,
  submittingEditAccount,
  handleSaveEditAccount,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-scale-in">
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-lg">✏️</span>
            <div>
              <h3 className="font-bold text-base">Edit Account Details</h3>
              <p className="text-xs text-slate-300">Modify financial account configuration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSaveEditAccount} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Parent Tender <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={editAccountForm.tenderId}
              onChange={(e) => setEditAccountForm({ ...editAccountForm, tenderId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {tenders.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Account Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={editAccountForm.accountName}
              onChange={(e) => setEditAccountForm({ ...editAccountForm, accountName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Location / Details
            </label>
            <input
              type="text"
              value={editAccountForm.location}
              onChange={(e) => setEditAccountForm({ ...editAccountForm, location: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Opening Balance (৳)
              </label>
              <input
                type="number"
                step="0.01"
                value={editAccountForm.openingBalance}
                onChange={(e) => setEditAccountForm({ ...editAccountForm, openingBalance: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Current Balance (৳)
              </label>
              <input
                type="number"
                step="0.01"
                value={editAccountForm.currentBalance}
                onChange={(e) => setEditAccountForm({ ...editAccountForm, currentBalance: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Ref:/Trans. ID
            </label>
            <input
              type="text"
              value={editAccountForm.referenceId}
              onChange={(e) => setEditAccountForm({ ...editAccountForm, referenceId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingEditAccount}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {submittingEditAccount ? 'Saving...' : 'Update Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
