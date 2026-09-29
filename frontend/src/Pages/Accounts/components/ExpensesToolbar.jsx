import React from 'react';

export default function ExpensesToolbar({
  dateFilter = 'this_month',
  setDateFilter = () => {},
  categoryFilter = 'ALL',
  setCategoryFilter = () => {},
  accountFilter = 'ALL',
  setAccountFilter = () => {},
  searchQuery = '',
  setSearchQuery = () => {},
  categories = [],
  accounts = []
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 py-2 px-3.5 mb-3 flex justify-between items-center flex-wrap gap-2 shadow-xs">
      {/* Date Presets */}
      <div className="flex gap-1">
        {[
          { id: 'today', label: 'Today' },
          { id: 'this_week', label: 'This Week' },
          { id: 'this_month', label: 'This Month' },
          { id: 'all', label: 'All History' },
        ].map((dp) => (
          <button
            key={dp.id}
            type="button"
            onClick={() => setDateFilter(dp.id)}
            className={`py-1 px-2.5 rounded border text-xs font-bold cursor-pointer transition-colors ${
              dateFilter === dp.id
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {dp.label}
          </button>
        ))}
      </div>

      {/* Dropdown Filters & Search */}
      <div className="flex gap-2 items-center flex-wrap">
        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="py-1 px-2.5 rounded-md border border-slate-300 text-xs text-slate-700 font-semibold bg-white cursor-pointer outline-none"
        >
          <option value="ALL">All Categories</option>
          {categories.map((c) => (
            <option key={c.id || c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Account Filter */}
        <select
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          className="py-1 px-2.5 rounded-md border border-slate-300 text-xs text-slate-700 font-semibold bg-white cursor-pointer outline-none"
        >
          <option value="ALL">All Accounts</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        {/* Search Box */}
        <input
          type="text"
          placeholder="Search voucher, payee..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="py-1 px-2.5 rounded-md border border-slate-300 text-xs min-w-[180px] bg-white outline-none focus:border-sky-500"
        />
      </div>
    </div>
  );
}
