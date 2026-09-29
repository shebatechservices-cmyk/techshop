import React from 'react';

export default function PartyFilterBar({
  partyCounts = { total: 0, customer: 0, supplier: 0, staff: 0 },
  partyTypeFilter = 'all',
  setPartyTypeFilter = () => {},
  partySearch = '',
  setPartySearch = () => {},
  setPartyPage = () => {},
  onRefresh = () => {}
}) {
  return (
    <div className="flex justify-between items-center flex-wrap gap-2 mb-2.5">
      {/* Filter Pills */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
        {[
          { id: 'all', label: 'All Parties', count: partyCounts.total },
          { id: 'customer', label: 'Customers', count: partyCounts.customer },
          { id: 'supplier', label: 'Suppliers', count: partyCounts.supplier },
          { id: 'staff', label: 'Staff & Team', count: partyCounts.staff },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              setPartyTypeFilter(f.id);
              setPartyPage(1);
            }}
            className={`py-1.5 px-3 rounded-md border-0 text-xs cursor-pointer flex items-center gap-1.5 transition-all ${
              partyTypeFilter === f.id
                ? 'bg-sky-600 text-white font-bold shadow-xs'
                : 'bg-transparent text-slate-500 font-semibold hover:text-slate-700'
            }`}
          >
            <span>{f.label}</span>
            <span
              className={`py-0.5 px-1.5 rounded-full text-[11px] font-bold ${
                partyTypeFilter === f.id
                  ? 'bg-white/25 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {f.count || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Search and Refresh */}
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          placeholder="Search by name, phone, email, role..."
          value={partySearch}
          onChange={(e) => {
            setPartySearch(e.target.value);
            setPartyPage(1);
          }}
          className="w-60 py-1.5 px-2.5 rounded-md border border-slate-300 text-xs outline-none bg-white focus:border-sky-500"
        />
        {partySearch && (
          <button
            type="button"
            onClick={() => {
              setPartySearch('');
              setPartyPage(1);
            }}
            className="bg-slate-100 border border-slate-300 py-1.5 px-2 rounded-md text-xs text-slate-500 cursor-pointer font-bold hover:bg-slate-200 transition-colors"
          >
            ✕
          </button>
        )}
        <button
          type="button"
          onClick={onRefresh}
          title="Refresh List"
          className="bg-white border border-slate-300 py-1.5 px-2.5 rounded-md text-xs text-slate-600 cursor-pointer font-semibold hover:bg-slate-50 transition-colors"
        >
          🔄
        </button>
      </div>
    </div>
  );
}
