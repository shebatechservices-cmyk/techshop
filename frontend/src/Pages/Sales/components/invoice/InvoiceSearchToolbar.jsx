import React from 'react';

export default function InvoiceSearchToolbar({
  invoiceSearchQuery,
  setInvoiceSearchQuery,
  invoiceStatusFilter,
  setInvoiceStatusFilter,
  filteredSalesCount,
  totalSalesCount,
  loadAllData,
}) {
  return (
    <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
      <div className="flex items-center gap-2.5 flex-1 min-w-[280px] flex-wrap">
        <div className="relative w-full max-w-[440px]">
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={invoiceSearchQuery}
            onChange={(e) => setInvoiceSearchQuery(e.target.value)}
            placeholder="Search invoices by invoice #, customer, phone, salesperson..."
            className="w-full py-2.5 pl-10 pr-9 rounded-lg border-[1.5px] border-slate-300 text-sm outline-none box-border bg-white focus:border-sky-500"
            style={{ paddingLeft: '2.5rem' }}
          />
          {invoiceSearchQuery && (
            <button
              type="button"
              onClick={() => setInvoiceSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer text-slate-400 hover:text-slate-600 text-sm"
              title="Clear invoice search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Payment Status Filter */}
        <select
          value={invoiceStatusFilter}
          onChange={(e) => setInvoiceStatusFilter(e.target.value)}
          className="py-2.5 px-3.5 rounded-lg border-[1.5px] border-slate-300 text-sm bg-white cursor-pointer text-slate-700 font-medium outline-none focus:border-sky-500"
        >
          <option value="ALL">All Payment Status</option>
          <option value="PAID">Paid Only</option>
          <option value="PARTIAL">Partial Only</option>
          <option value="DUE">Due Only</option>
          <option value="REFUNDED">Refunded / Returns</option>
        </select>

        {/* Match Counter Badge */}
        <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 py-1.5 px-3 rounded-full">
          Showing {filteredSalesCount} of {totalSalesCount} Invoices
        </span>
      </div>

      <div className="flex gap-2 items-center">
        <button
          type="button"
          onClick={loadAllData}
          title="Refresh Invoices"
          className="bg-white hover:bg-slate-50 border border-slate-300 py-2 px-3.5 rounded-lg text-xs font-semibold text-slate-600 cursor-pointer flex items-center gap-1.5 transition-colors"
        >
          <span>🔄</span> Refresh
        </button>
      </div>
    </div>
  );
}
