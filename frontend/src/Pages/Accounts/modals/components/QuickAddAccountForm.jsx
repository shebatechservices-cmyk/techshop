import React from 'react';

export default function QuickAddAccountForm({
  subForm,
  setSubForm,
  submitting,
  onSubmit,
  onCancel,
}) {
  return (
    <form onSubmit={onSubmit} className="p-5 flex flex-col gap-3.5">
      <div>
        <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
          Method Type <span className="text-rose-500">*</span>
        </label>
        <select
          required
          value={subForm.methodType}
          onChange={(e) => setSubForm({ ...subForm, methodType: e.target.value })}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
        >
          <option value="drawer">💵 Cash Drawer / Physical Cash</option>
          <option value="bank">🏛️ Bank Account</option>
          <option value="mobile_banking">📱 Mobile Banking</option>
          <option value="wallet">💼 Digital / Staff Wallet</option>
          <option value="other">💳 Other Payment Channel</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
          Account Name <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          required
          placeholder="e.g. Main Cash Drawer, City Bank Principal, bKash Agent"
          value={subForm.accountName}
          onChange={(e) => setSubForm({ ...subForm, accountName: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <span className="text-[0.7rem] text-slate-500 mt-1 block">
          Must be unique per selected method type.
        </span>
      </div>

      <div>
        <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
          Account / Details Number (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g. 1502203920101, 01700000000"
          value={subForm.accountNumber}
          onChange={(e) => setSubForm({ ...subForm, accountNumber: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
          Initial Balance (৳)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">
            ৳
          </span>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={subForm.openingBalance}
            onChange={(e) => setSubForm({ ...subForm, openingBalance: e.target.value })}
            className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            style={{ paddingLeft: '2rem' }}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !subForm.accountName.trim()}
          className={`px-4 py-1.5 rounded-lg text-white text-xs font-bold border-none transition-all shadow-md ${
            subForm.accountName.trim()
              ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-indigo-500/25'
              : 'bg-slate-400 cursor-not-allowed'
          }`}
        >
          {submitting ? 'Saving...' : 'Save & Select'}
        </button>
      </div>
    </form>
  );
}
