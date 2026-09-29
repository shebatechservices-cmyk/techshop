import React from 'react';

export default function CustomerSearchToolbar({
  customerSearchQuery = '',
  setCustomerSearchQuery = () => {},
  customerTypeFilter = 'ALL',
  setCustomerTypeFilter = () => {},
  filteredCount = 0,
  totalCount = 0,
  onRefresh = () => {},
  onAddCustomer = () => {}
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
        {/* Search Input */}
        <div className="relative w-full max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
            🔍
          </span>
          <input
            type="text"
            value={customerSearchQuery}
            onChange={(e) => setCustomerSearchQuery(e.target.value)}
            placeholder="Search customers by name, phone, email, address..."
            className="w-full pl-9 pr-9 py-2 text-sm border border-slate-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-900 placeholder:text-slate-400"
          />
          {customerSearchQuery && (
            <button
              type="button"
              onClick={() => setCustomerSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 text-sm bg-transparent border-0 cursor-pointer"
              title="Clear customer search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Customer Type Filter */}
        <select
          value={customerTypeFilter}
          onChange={(e) => setCustomerTypeFilter(e.target.value)}
          className="px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-700 font-medium cursor-pointer outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
        >
          <option value="ALL">All Customer Groups</option>
          <option value="regular">👤 Regular</option>
          <option value="technician">🔧 Technician (5% Discount)</option>
          <option value="reseller">🏪 Reseller</option>
        </select>

        {/* Counter Badge */}
        <span className="text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-full">
          Showing {filteredCount} of {totalCount} Customers
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          title="Refresh Customers"
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
        >
          <span>🔄</span> Refresh
        </button>
        <button
          type="button"
          onClick={onAddCustomer}
          title="Add New Customer"
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm shadow-sky-600/20 cursor-pointer transition-colors border-0"
        >
          <span>+</span> Add Customer
        </button>
      </div>
    </div>
  );
}
