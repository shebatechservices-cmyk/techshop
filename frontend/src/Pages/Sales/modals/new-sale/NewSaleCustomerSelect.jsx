import React from 'react';

export default function NewSaleCustomerSelect({
  customers = [],
  customerId,
  setCustomerId,
  selectedCustomer,
  customerSearch,
  setCustomerSearch,
  isCustomerOpen,
  setIsCustomerOpen,
  customerSelectRef,
  onOpenAddCustomer,
  setIsAddCustomerOpen,
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-sm font-bold text-slate-600 min-w-[70px]">Customer</span>
      <div className="relative flex-1" ref={customerSelectRef}>
        <input
          type="text"
          placeholder="🔍 Select Customer (Search name / phone)"
          value={selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.phone || ''})` : customerSearch}
          onFocus={() => setIsCustomerOpen(true)}
          onChange={(e) => {
            setCustomerSearch(e.target.value);
            setIsCustomerOpen(true);
          }}
          className="w-full py-2 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:border-emerald-500 box-border"
        />
        {isCustomerOpen && (
          <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-white border border-slate-300 rounded-lg shadow-xl max-h-[220px] overflow-y-auto">
            {customers
              .filter((c) => {
                const q = customerSearch.trim().toLowerCase();
                return !q || (c.name || '').toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q);
              })
              .map((c) => {
                const grp = (c.customer_type || c.customer_group || '').toLowerCase();
                const tag = grp.includes('tech') ? ' [🔧 Technician - 5% Off]' : grp.includes('resell') || grp === 'wholesale' ? ' [🏪 Reseller]' : '';
                return (
                  <div
                    key={c.id}
                    onMouseDown={() => {
                      setCustomerId(String(c.id));
                      setCustomerSearch('');
                      setIsCustomerOpen(false);
                    }}
                    className={`py-2 px-3 cursor-pointer border-b border-slate-100 text-sm text-slate-900 transition-colors ${
                      String(c.id) === String(customerId) ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    {c.name} ({c.phone}){tag} <span className="text-slate-400">• Due: ৳{Number(c.receivable_balance || 0).toLocaleString()}</span>
                  </div>
                );
              })}
            {customers.filter((c) => {
              const q = customerSearch.trim().toLowerCase();
              return !q || (c.name || '').toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q);
            }).length === 0 && (
              <div className="p-3 text-slate-400 text-xs">No matching customer</div>
            )}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          if (onOpenAddCustomer) {
            onOpenAddCustomer();
          } else {
            setIsAddCustomerOpen(true);
          }
        }}
        className="py-2 px-3.5 rounded-lg border-[1.5px] border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold text-sm cursor-pointer whitespace-nowrap transition-colors"
      >
        + Add Customer
      </button>
    </div>
  );
}
