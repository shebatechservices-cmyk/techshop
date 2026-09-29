import React from 'react';

const money = (val) => Number.parseFloat(val || 0) || 0;
const defaultTaka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CustomerDataTable({
  loading = false,
  filteredCustomers = [],
  customerSearchQuery = '',
  customerTypeFilter = 'ALL',
  setCustomerSearchQuery = () => {},
  setCustomerTypeFilter = () => {},
  setIsCustomerModalOpen = () => {},
  setProfileModalPartyId = () => {},
  setProfileModalTab = () => {},
  onStartSale = null,
  onStartQuote = null,
  handleDeleteCustomer = () => {},
  taka = defaultTaka,
}) {
  return (
    <div className="overflow-x-auto">
      {loading ? (
        <p className="text-center py-10 text-slate-500 text-sm">Loading customer list...</p>
      ) : filteredCustomers.length === 0 ? (
        customerSearchQuery || customerTypeFilter !== 'ALL' ? (
          <div className="text-center py-12 px-5 text-slate-500">
            <p className="text-base font-semibold text-slate-700 mb-2">
              No customers match your search "{customerSearchQuery || customerTypeFilter}"
            </p>
            <p className="text-sm text-slate-500 mb-4">
              Try searching with another name, phone number, email, or address.
            </p>
            <button
              type="button"
              onClick={() => {
                setCustomerSearchQuery('');
                setCustomerTypeFilter('ALL');
              }}
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer transition-colors"
            >
              Clear Search & Filter
            </button>
          </div>
        ) : (
          <div className="text-center py-12 px-5 text-slate-400">
            <p className="text-lg font-semibold text-slate-700 mb-2">No customers found</p>
            <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">
              Add your retail, wholesale, or corporate clients to track their sales and loyalty points.
            </p>
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(true)}
              className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm cursor-pointer transition-colors border-0"
            >
              + Add First Customer
            </button>
          </div>
        )
      ) : (
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider">
              <th className="px-3.5 py-3 font-semibold">Customer Name</th>
              <th className="px-3.5 py-3 font-semibold">Type</th>
              <th className="px-3.5 py-3 font-semibold">Contact Info</th>
              <th className="px-3.5 py-3 font-semibold">Address</th>
              <th className="px-3.5 py-3 font-semibold">Loyalty Points</th>
              <th className="px-3.5 py-3 font-semibold">Receivable Due</th>
              <th className="px-3.5 py-3 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((cust) => {
              const due = money(cust.receivable_balance);
              return (
                <tr
                  key={cust.id}
                  className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors"
                >
                  <td className="px-3.5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {cust.name ? cust.name.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileModalPartyId(cust.id);
                            setProfileModalTab('overview');
                          }}
                          className="font-bold text-slate-900 hover:text-sky-600 cursor-pointer text-left text-sm bg-transparent border-0 p-0 transition-colors"
                        >
                          {cust.name}
                        </button>
                        <div className="text-xs text-slate-500">ID: #{cust.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3.5 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${
                        cust.customer_type?.toLowerCase().includes('tech')
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : cust.customer_type?.toLowerCase().includes('resell') ||
                            cust.customer_type === 'wholesale' ||
                            cust.customer_type === 'corporate'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {cust.customer_type?.toLowerCase().includes('tech')
                        ? '🔧 Technician'
                        : cust.customer_type?.toLowerCase().includes('resell') ||
                          cust.customer_type === 'wholesale' ||
                          cust.customer_type === 'corporate'
                        ? '🏪 Reseller'
                        : '👤 Regular'}
                    </span>
                  </td>
                  <td className="px-3.5 py-3">
                    <div className="font-semibold text-slate-800">{cust.phone}</div>
                    {cust.email && <div className="text-xs text-slate-500">{cust.email}</div>}
                  </td>
                  <td className="px-3.5 py-3 text-slate-600 text-xs max-w-[200px] truncate">
                    {cust.address || '-'}
                  </td>
                  <td className="px-3.5 py-3">
                    <span className="text-amber-600 font-bold text-xs">
                      ★ {Number(cust.loyalty_points || 0).toLocaleString()} pts
                    </span>
                  </td>
                  <td className="px-3.5 py-3">
                    <span className={`font-bold ${due > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                      {taka(due)}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onStartSale && onStartSale(cust)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                        title="Create sale for this customer"
                      >
                        <span>🛒</span> Sale
                      </button>
                      <button
                        type="button"
                        onClick={() => onStartQuote && onStartQuote(cust)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                        title="Create quotation for this customer"
                      >
                        <span>📄</span> Quote
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setProfileModalPartyId(cust.id);
                          setProfileModalTab('overview');
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-colors cursor-pointer"
                        title="View customer profile & ledger"
                      >
                        <span>👤</span> Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomer(cust.id)}
                        className="inline-flex items-center justify-center p-1 rounded-md text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                        title="Delete customer"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
