import React from 'react';

export default function AccountCreateForm({
  form,
  setForm,
  tenders,
  activeUser,
  submitting,
  onCancel,
  onSubmit,
}) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {/* Step 1: Payment Method Selection */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
            1. Payment Method <span className="text-rose-500">*</span>
          </label>
          <span className="text-[0.72rem] text-slate-500">Select payment method</span>
        </div>

        <select
          required
          value={form.tenderId}
          onChange={(e) => setForm({ ...form, tenderId: e.target.value })}
          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">-- Select Payment Method --</option>
          {tenders.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Step 2: Account Name */}
      <div>
        <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
          Account Name <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          required
          placeholder="e.g. Main Drawer, IFIC Aruail Branch, bKash Merchant"
          value={form.accountName}
          onChange={(e) => setForm({ ...form, accountName: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Step 3: Location / Account Details */}
      <div>
        <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
          Location / Account Details
        </label>
        <input
          type="text"
          placeholder="e.g. Shop Counter 1, 01711000000, Branch Code"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Step 4: Opening Balance & Reference ID */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
            Opening Balance (৳)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">
              ৳
            </span>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.openingBalance}
              onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
              className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              style={{ paddingLeft: '2rem' }}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
            Ref / Trans. ID
          </label>
          <input
            type="text"
            placeholder="e.g. Haolad, Ref#101"
            value={form.referenceId}
            onChange={(e) => setForm({ ...form, referenceId: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Footer Metadata */}
      <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-[0.74rem] text-slate-600 flex items-center justify-between">
        <span>
          📅 <strong>Date:</strong> {new Date().toLocaleDateString('en-GB')}
        </span>
        <span>
          👤 <strong>Created By:</strong> {activeUser}
        </span>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !form.tenderId}
          className={`px-5 py-2 rounded-lg text-white text-xs font-bold border-none transition-all shadow-md ${
            form.tenderId
              ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-indigo-500/25'
              : 'bg-slate-400 cursor-not-allowed'
          }`}
        >
          {submitting ? 'Creating...' : '+ Create Account'}
        </button>
      </div>
    </form>
  );
}
