import React, { useState } from 'react';
import SalesLayout from './SalesLayout';
import SalesMetrics from './components/SalesMetrics';
import SalesTabContent from './components/SalesTabContent';
import SalesModalsContainer from './components/SalesModalsContainer';
import useSalesManager from './hooks/useSalesManager';

export default function Sales({
  initialTab = 'history',
  initialSearch = '',
  navKey = 0,
  currentUser,
}) {
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const salesManager = useSalesManager({ initialTab, initialSearch, navKey, currentUser });
  const {
    activeTab,
    setActiveTab,
    sales,
    quotationsCount,
    setQuotationsCount,
    customersCount,
    setCustomersCount,
    invoiceSearchQuery,
    invoiceStatusFilter,
    notification,
    setIsSaleModalOpen,
    setEditingSale,
    filteredSales,
    totalSalesVolume,
    totalCollectedAmount,
    totalSalesDue,
    taka,
  } = salesManager;

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-slate-50 min-h-screen font-sans">
      {/* Toast Notification */}
      {notification.message && (
        <div
          className={`fixed top-6 right-6 z-[99999] py-3 px-5 rounded-xl font-semibold text-sm shadow-xl flex items-center gap-2 text-white ${
            notification.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
          }`}
        >
          <span>{notification.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Extracted Header & Tab Bar (SalesLayout) */}
      <SalesLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        salesCount={sales.length}
        filteredSalesCount={filteredSales.length}
        hasSaleFilter={Boolean(invoiceSearchQuery || invoiceStatusFilter !== 'ALL')}
        quotationsCount={quotationsCount}
        filteredQuotationsCount={quotationsCount}
        hasQuotationFilter={false}
        customersCount={customersCount}
        filteredCustomersCount={customersCount}
        hasCustomerFilter={false}
        onNewSale={() => {
          setActiveTab('history');
          setEditingSale(null);
          setIsSaleModalOpen(true);
        }}
        onNewQuotation={() => {
          setActiveTab('quotations');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('sales:open_modal', { detail: 'quotation' }));
          }, 50);
        }}
        onNewCustomer={() => {
          setActiveTab('customers');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('sales:open_modal', { detail: 'customer' }));
          }, 50);
        }}
      />

      {/* KPI Metrics Cards */}
      {activeTab === 'history' && (
        <SalesMetrics
          totalSalesVolume={totalSalesVolume}
          totalInvoices={sales.length}
          totalCollectedAmount={totalCollectedAmount}
          totalSalesDue={totalSalesDue}
          taka={taka}
        />
      )}

      {/* Main Content Area */}
      <SalesTabContent
        {...salesManager}
        initialTab={initialTab}
        initialSearch={initialSearch}
      />

      {/* Modals and Drawers Container */}
      <SalesModalsContainer
        salesManager={salesManager}
        isAddCustomerModalOpen={isAddCustomerModalOpen}
        setIsAddCustomerModalOpen={setIsAddCustomerModalOpen}
      />
    </div>
  );
}
