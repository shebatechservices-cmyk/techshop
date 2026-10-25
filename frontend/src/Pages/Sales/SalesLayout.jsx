import React from 'react';

export default function SalesLayout({
  activeTab = 'history',
  setActiveTab = () => {},
  salesCount = 0,
  filteredSalesCount = 0,
  hasSaleFilter = false,
  quotationsCount = 0,
  filteredQuotationsCount = 0,
  hasQuotationFilter = false,
  customersCount = 0,
  filteredCustomersCount = 0,
  hasCustomerFilter = false,
  onNewSale,
  onNewQuotation,
  onNewCustomer,
  children
}) {
  const handleNewSale = () => {
    if (onNewSale) {
      onNewSale();
    } else {
      window.dispatchEvent(new CustomEvent('sales:open_modal', { detail: 'sale' }));
    }
  };

  const handleNewQuotation = () => {
    if (onNewQuotation) {
      onNewQuotation();
    } else {
      window.dispatchEvent(new CustomEvent('sales:open_modal', { detail: 'quotation' }));
    }
  };

  const handleNewCustomer = () => {
    if (onNewCustomer) {
      onNewCustomer();
    } else {
      window.dispatchEvent(new CustomEvent('sales:open_modal', { detail: 'customer' }));
    }
  };

  const saleBadgeText = hasSaleFilter ? `${filteredSalesCount}/${salesCount}` : salesCount;
  const quotationBadgeText = hasQuotationFilter ? `${filteredQuotationsCount}/${quotationsCount}` : quotationsCount;
  const customerBadgeText = hasCustomerFilter ? `${filteredCustomersCount}/${customersCount}` : customersCount;

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden">
      {/* Unified Compact Header & Tab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2.5 border-b border-slate-200">
        {/* Left: Compact Title */}
        <div className="flex items-center gap-1.5">
          <span className="text-lg">🏷️</span>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 m-0 leading-tight">
              Sales &amp; Customers
            </h2>
            <span className="text-slate-500 text-[10px] sm:text-xs block">
              POS sales, quotations, and receivables
            </span>
          </div>
        </div>

        {/* Center: Integrated Tab Navigation Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
          {/* Tab 1: Sales / Invoices */}
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] sm:text-xs transition-all cursor-pointer border-0 ${
              activeTab === 'history'
                ? 'bg-white text-emerald-600 font-bold shadow-xs'
                : 'bg-transparent text-slate-500 font-medium hover:text-slate-800'
            }`}
          >
            <span>Invoices</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
              {saleBadgeText}
            </span>
          </button>

          {/* Tab 2: Quotations */}
          <button
            type="button"
            onClick={() => setActiveTab('quotations')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] sm:text-xs transition-all cursor-pointer border-0 ${
              activeTab === 'quotations'
                ? 'bg-white text-indigo-600 font-bold shadow-xs'
                : 'bg-transparent text-slate-500 font-medium hover:text-slate-800'
            }`}
          >
            <span>Quotes</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
              {quotationBadgeText}
            </span>
          </button>

          {/* Tab 3: Customers */}
          <button
            type="button"
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] sm:text-xs transition-all cursor-pointer border-0 ${
              activeTab === 'customers'
                ? 'bg-white text-sky-600 font-bold shadow-xs'
                : 'bg-transparent text-slate-500 font-medium hover:text-slate-800'
            }`}
          >
            <span>Clients</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700">
              {customerBadgeText}
            </span>
          </button>
        </div>

        {/* Right: Compact Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={handleNewSale}
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg font-bold text-[11px] sm:text-xs cursor-pointer shadow-xs border-0 active:scale-95 transition-all"
            title="Create new sale invoice"
          >
            <span>+</span> <span>New Sale</span>
          </button>

          <button
            type="button"
            onClick={handleNewQuotation}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-lg font-bold text-[11px] sm:text-xs cursor-pointer shadow-xs border-0 active:scale-95 transition-all"
            title="Generate quotation"
          >
            <span>+</span> <span>Quotation</span>
          </button>

          <button
            type="button"
            onClick={handleNewCustomer}
            className="flex items-center gap-1 bg-white hover:bg-sky-50 text-sky-600 border border-sky-400 px-2 py-1 rounded-lg font-bold text-[11px] sm:text-xs cursor-pointer active:scale-95 transition-all"
            title="Add new customer"
          >
            <span>+</span> <span>Customer</span>
          </button>
        </div>
      </div>

      {children}
    </div>
  );
}
