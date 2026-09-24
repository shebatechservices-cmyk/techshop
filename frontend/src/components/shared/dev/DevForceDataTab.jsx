import React from 'react';

export default function DevForceDataTab({
  forceTable,
  setForceTable,
  forceId,
  setForceId,
  forceReason,
  setForceReason,
  forceJsonFields,
  setForceJsonFields,
  forceActionLoading,
  handleForceDelete,
  handleForceUpdate,
}) {
  return (
    <div className="flex flex-col gap-4 text-xs font-mono">
      <div className="bg-rose-500/10 border border-rose-500/40 rounded-2xl p-4 text-rose-300 leading-relaxed">
        ⚠️ <strong>DEVELOPER EMERGENCY OVERRIDE CONSOLE</strong>: This tool bypasses the 24-hour delete window, 72-hour edit restriction, and relational lock-chains. Use with caution for system maintenance, corrupted data cleanup, or manual database intervention.
      </div>

      <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-slate-400 text-[11px] mb-1 font-semibold">
              Target Database Table *
            </label>
            <select
              value={forceTable}
              onChange={(e) => setForceTable(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-sky-500 bg-slate-950 text-xs"
            >
              <option value="products">products (Product Catalog & Inventory)</option>
              <option value="sales">sales (Sales Invoices)</option>
              <option value="purchase_orders">purchase_orders (Purchase Orders)</option>
              <option value="customers">customers (Customer Directory)</option>
              <option value="suppliers">suppliers (Supplier Directory)</option>
              <option value="categories">categories (Primary Categories)</option>
              <option value="sub_categories">sub_categories (Sub-Categories)</option>
              <option value="brands">brands (Brands)</option>
              <option value="warranty_claims">warranty_claims (Warranty Claims)</option>
              <option value="product_returns">product_returns (Product Returns)</option>
              <option value="payment_accounts">payment_accounts (Wallets / Bank Accounts)</option>
              <option value="expenses">expenses (Expense Entries)</option>
              <option value="users">users (Staff & Technicians)</option>
              <option value="service_projects">service_projects (Service Projects)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] mb-1 font-semibold">
              Record ID *
            </label>
            <input
              type="number"
              placeholder="Enter ID (e.g. 15)"
              value={forceId}
              onChange={(e) => setForceId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-sky-500 text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-400 text-[11px] mb-1 font-semibold">
            Reason for Emergency Action (Saved in Audit Log)
          </label>
          <input
            type="text"
            value={forceReason}
            onChange={(e) => setForceReason(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-sky-500 text-xs"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Force Delete Action */}
          <div className="bg-slate-950/70 rounded-xl p-4 border border-rose-900/60 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1.5 m-0">
                🗑️ Option 1: Force Delete Record
              </h4>
              <p className="text-slate-400 text-[11px] mb-3">
                Immediately soft-deletes the record to Global Trash and archives it, bypassing lock-chains and time limits.
              </p>
            </div>
            <button
              type="button"
              disabled={forceActionLoading}
              onClick={handleForceDelete}
              className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              {forceActionLoading ? 'Executing...' : `Force Delete ${forceTable} #${forceId || '?'}`}
            </button>
          </div>

          {/* Force Update Action */}
          <div className="bg-slate-950/70 rounded-xl p-4 border border-sky-900/60 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-1.5 m-0">
                ✏️ Option 2: Force Direct Field Patch
              </h4>
              <p className="text-slate-400 text-[11px] mb-2">
                Provide JSON key-value pairs to directly patch columns:
              </p>
              <textarea
                rows={3}
                value={forceJsonFields}
                onChange={(e) => setForceJsonFields(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-sky-300 font-mono text-[11px] rounded-lg p-2 outline-none focus:border-sky-500 mb-2.5"
              />
            </div>
            <button
              type="button"
              disabled={forceActionLoading}
              onClick={handleForceUpdate}
              className="w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              {forceActionLoading ? 'Executing...' : `Apply Patch to ${forceTable} #${forceId || '?'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
