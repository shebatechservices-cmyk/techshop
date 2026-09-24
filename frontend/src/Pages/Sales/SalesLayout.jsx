import React from 'react';

/**
 * SalesLayout
 * Layout component for Sales & Customers header, tab navigation pills, and quick action buttons.
 * Converted entirely to Tailwind CSS utilities.
 */
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

  // Format count badges
  const saleBadgeText = hasSaleFilter
    ? `${filteredSalesCount}/${salesCount}`
    : salesCount;

  const quotationBadgeText = hasQuotationFilter
    ? `${filteredQuotationsCount}/${quotationsCount}`
    : quotationsCount;

  const customerBadgeText = hasCustomerFilter
    ? `${filteredCustomersCount}/${customersCount}`
    : customersCount;

  return (
    <div className="w-full">
      {/* Unified Compact Header & Tab Bar (Single Row) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 mb-3 border-b border-slate-200">
        {/* Left: Compact Title */}
        <div className="flex items-center gap-2">
          <span className="text-xl">🏷️</span>
          <div>
            <h2 className="text-[1.2rem] font-extrabold text-slate-900 m-0 leading-tight">
              Sales & Customers
            </h2>
            <span className="text-slate-500 text-[0.74rem]">
              POS sales, quotations, and receivables
            </span>
          </div>
        </div>

        {/* Center: Integrated Tab Navigation Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-[3px] rounded-lg">
          {/* Tab 1: Sales / Invoices */}
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[0.82rem] transition-all cursor-pointer border-0 ${
              activeTab === 'history'
                ? 'bg-white text-emerald-600 font-bold shadow-sm'
                : 'bg-transparent text-slate-500 font-semibold hover:text-slate-800'
            }`}
          >
            <span>Invoices</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[0.72rem] font-bold ${
                activeTab === 'history'
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {saleBadgeText}
            </span>
          </button>

          {/* Tab 2: Quotations */}
          <button
            type="button"
            onClick={() => setActiveTab('quotations')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[0.82rem] transition-all cursor-pointer border-0 ${
              activeTab === 'quotations'
                ? 'bg-white text-indigo-600 font-bold shadow-sm'
                : 'bg-transparent text-slate-500 font-semibold hover:text-slate-800'
            }`}
          >
            <span>Quotations</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[0.72rem] font-bold ${
                activeTab === 'quotations'
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {quotationBadgeText}
            </span>
          </button>

          {/* Tab 3: Customers */}
          <button
            type="button"
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[0.82rem] transition-all cursor-pointer border-0 ${
              activeTab === 'customers'
                ? 'bg-white text-sky-600 font-bold shadow-sm'
                : 'bg-transparent text-slate-500 font-semibold hover:text-slate-800'
            }`}
          >
            <span>Customers</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[0.72rem] font-bold ${
                activeTab === 'customers'
                  ? 'bg-sky-100 text-sky-600'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {customerBadgeText}
            </span>
          </button>
        </div>

        {/* Right: 3 Compact Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleNewSale}
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-[7px] font-bold text-[0.82rem] cursor-pointer shadow-sm shadow-emerald-600/20 transition-colors border-0"
            title="Create new sale invoice"
          >
            <span>+</span> <span>New Sale</span>
          </button>

          <button
            type="button"
            onClick={handleNewQuotation}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-[7px] font-bold text-[0.82rem] cursor-pointer shadow-sm shadow-indigo-600/20 transition-colors border-0"
            title="Generate quotation"
          >
            <span>+</span> <span>Quotation</span>
          </button>

          <button
            type="button"
            onClick={handleNewCustomer}
            className="flex items-center gap-1 bg-white hover:bg-sky-50 text-sky-600 border border-sky-600 px-2.5 py-[5px] rounded-[7px] font-bold text-[0.82rem] cursor-pointer transition-colors"
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
