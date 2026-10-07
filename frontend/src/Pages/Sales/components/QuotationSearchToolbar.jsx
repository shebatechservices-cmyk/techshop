import React from 'react';

export default function QuotationSearchToolbar({
  quotationSearchQuery = '',
  setQuotationSearchQuery = () => {},
  quotationStatusFilter = 'ALL',
  setQuotationStatusFilter = () => {},
  filteredCount = 0,
  totalCount = 0,
  onRefresh = () => {},
  onNewQuotation = () => {}
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
        {/* Search Input */}
        <div className="relative w-full max-w-md">
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
            value={quotationSearchQuery}
            onChange={(e) => setQuotationSearchQuery(e.target.value)}
            placeholder="Search quotations by quotation #, client name, phone, notes..."
            className="w-full pl-10 pr-9 py-2 text-sm border border-slate-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400"
            style={{ paddingLeft: '2.5rem' }}
          />
          {quotationSearchQuery && (
            <button
              type="button"
              onClick={() => setQuotationSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 text-sm bg-transparent border-0 cursor-pointer"
              title="Clear quotation search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Quotation Status Filter */}
        <select
          value={quotationStatusFilter}
          onChange={(e) => setQuotationStatusFilter(e.target.value)}
          className="px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-700 font-medium cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        >
          <option value="ALL">All Statuses</option>
          <option value="sent">Sent</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="expired">Expired</option>
          <option value="draft">Draft</option>
        </select>

        {/* Counter Badge */}
        <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-full">
          Showing {filteredCount} of {totalCount} Quotations
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          title="Refresh Quotations"
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
        >
          <span>🔄</span> Refresh
        </button>
        <button
          type="button"
          onClick={onNewQuotation}
          title="Create New Quotation"
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-600/20 cursor-pointer transition-colors border-0"
        >
          <span>+</span> New Quotation
        </button>
      </div>
    </div>
  );
}
