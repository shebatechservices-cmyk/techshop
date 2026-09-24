import React from 'react';
import NewSaleModal from './modals/NewSaleModal';
import SalePrintModal from './modals/SalePrintModal';
import SaleExchangeModal from './modals/SaleExchangeModal';
import AdminOverrideModal from './modals/AdminOverrideModal';
import SalesLayout from './SalesLayout';
import CustomerList from './CustomerList';
import SalesQuotations from './SalesQuotations';
import SalesMetrics from './components/SalesMetrics';
import InvoiceHistoryTab from './components/InvoiceHistoryTab';
import useSalesManager from './hooks/useSalesManager';

export default function Sales({
  initialTab = 'history',
  initialSearch = '',
  navKey = 0,
  currentUser,
}) {
  const {
    activeTab,
    setActiveTab,
    isAdmin,
    actionLoading,
    overrideModal,
    setOverrideModal,
    sales,
    quotationsCount,
    setQuotationsCount,
    customersCount,
    setCustomersCount,
    modalCustomers,
    products,
    loading,
    invoiceSearchQuery,
    setInvoiceSearchQuery,
    invoiceStatusFilter,
    setInvoiceStatusFilter,
    notification,
    showToast,
    isSaleModalOpen,
    setIsSaleModalOpen,
    editingSale,
    setEditingSale,
    newlyCreatedCustomer,
    exchangeSaleId,
    setExchangeSaleId,
    printData,
    setPrintData,
    isPrintOpen,
    setIsPrintOpen,
    loadAllData,
    handleCustomerCreated,
    handleSaleCreated,
    handleSaleUpdated,
    getSaleLockStatus,
    handleInitiateEditSale,
    handleOpenPrintSale,
    handleInitiateDeleteSale,
    handleConfirmOverride,
    handleStartSaleForCustomer,
    handleStartQuoteForCustomer,
    filteredSales,
    totalSalesVolume,
    totalCollectedAmount,
    totalSalesDue,
    getPaymentBadgeStyle,
    money,
    taka,
  } = useSalesManager({ initialTab, initialSearch, navKey, currentUser });

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
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
      {activeTab === 'customers' ? (
        <CustomerList
          initialSearch={initialTab === 'customers' ? initialSearch : ''}
          onStartSale={handleStartSaleForCustomer}
          onStartQuote={handleStartQuoteForCustomer}
          onCustomersLoaded={(list) => setCustomersCount(list.length)}
          onCustomerCreated={handleCustomerCreated}
        />
      ) : activeTab === 'quotations' ? (
        <SalesQuotations
          initialSearch={initialTab === 'quotations' ? initialSearch : ''}
          onQuotationsLoaded={(list) => setQuotationsCount(list.length)}
        />
      ) : (
        <InvoiceHistoryTab
          filteredSales={filteredSales}
          sales={sales}
          loading={loading}
          invoiceSearchQuery={invoiceSearchQuery}
          setInvoiceSearchQuery={setInvoiceSearchQuery}
          invoiceStatusFilter={invoiceStatusFilter}
          setInvoiceStatusFilter={setInvoiceStatusFilter}
          loadAllData={loadAllData}
          setIsSaleModalOpen={setIsSaleModalOpen}
          setEditingSale={setEditingSale}
          handleOpenPrintSale={handleOpenPrintSale}
          setExchangeSaleId={setExchangeSaleId}
          handleInitiateEditSale={handleInitiateEditSale}
          handleInitiateDeleteSale={handleInitiateDeleteSale}
          actionLoading={actionLoading}
          getSaleLockStatus={getSaleLockStatus}
          isAdmin={isAdmin}
          setActiveTab={setActiveTab}
          getPaymentBadgeStyle={getPaymentBadgeStyle}
          taka={taka}
          money={money}
        />
      )}

      {/* 1. New / Edit Sale Modal */}
      {isSaleModalOpen && (
        <NewSaleModal
          isOpen={isSaleModalOpen}
          onClose={() => {
            setIsSaleModalOpen(false);
            setEditingSale(null);
          }}
          customers={modalCustomers}
          products={products}
          newlyCreatedCustomer={newlyCreatedCustomer}
          onOpenAddCustomer={() => {
            setActiveTab('customers');
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('sales:open_modal', { detail: 'customer' }));
            }, 50);
          }}
          onSaleCreated={handleSaleCreated}
          editSale={editingSale}
          onSaleUpdated={handleSaleUpdated}
        />
      )}

      {/* 2. Sale / Quotation Printable Sheet Modal */}
      {isPrintOpen && printData && (
        <SalePrintModal
          isOpen={isPrintOpen}
          onClose={() => {
            setIsPrintOpen(false);
            setPrintData(null);
          }}
          sale={printData}
          isQuotation={false}
        />
      )}

      {/* 3. Sale Exchange Modal */}
      {exchangeSaleId && (
        <SaleExchangeModal
          isOpen={Boolean(exchangeSaleId)}
          onClose={() => setExchangeSaleId(null)}
          saleId={exchangeSaleId}
          products={products}
          onExchangeComplete={(newExc) => {
            loadAllData();
            showToast(`Exchange completed! Invoice #${newExc.invoice_no || newExc.id}`);
            if (newExc) {
              handleOpenPrintSale(newExc.id || newExc);
            }
          }}
        />
      )}

      {/* 4. Admin Security PIN Override Modal */}
      <AdminOverrideModal
        overrideModal={overrideModal}
        setOverrideModal={setOverrideModal}
        handleConfirmOverride={handleConfirmOverride}
        taka={taka}
      />
    </div>
  );
}
