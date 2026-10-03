import React, { useState } from 'react';
import NewSaleModal from './modals/NewSaleModal';
import AddCustomerModal from './modals/AddCustomerModal';
import SalePrintModal from './modals/SalePrintModal';
import SaleExchangeModal from './modals/SaleExchangeModal';
import AdminOverrideModal from './modals/AdminOverrideModal';
import SalesLayout from './SalesLayout';
import CustomerList from './CustomerList';
import SalesQuotations from './SalesQuotations';
import SalesMetrics from './components/SalesMetrics';
import InvoiceHistoryTab from './components/InvoiceHistoryTab';
import SaleDetailDrawer from './components/SaleDetailDrawer';
import DuePaymentModal from './modals/DuePaymentModal';
import PaymentSlipModal from './modals/PaymentSlipModal';
import useSalesManager from './hooks/useSalesManager';

export default function Sales({
  initialTab = 'history',
  initialSearch = '',
  navKey = 0,
  currentUser,
}) {
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
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
    duePaymentModal,
    handleOpenDuePayment,
    handleCloseDuePayment,
    handlePaymentSuccess,
    paymentSlipModal,
    handleClosePaymentSlip,
    shopSettings,
    selectedSaleForDrawer,
    isSaleDrawerOpen,
    isSaleDrawerLoading,
    handleOpenSaleDrawer,
    handleCloseSaleDrawer,
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
          handleOpenSaleDrawer={handleOpenSaleDrawer}
          setExchangeSaleId={setExchangeSaleId}
          handleInitiateEditSale={handleInitiateEditSale}
          handleInitiateDeleteSale={handleInitiateDeleteSale}
          handleOpenDuePayment={handleOpenDuePayment}
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
          onOpenAddCustomer={() => setIsAddCustomerModalOpen(true)}
          onCustomerCreated={handleCustomerCreated}
          onSaleCreated={handleSaleCreated}
          editSale={editingSale}
          onSaleUpdated={handleSaleUpdated}
        />
      )}

      {/* Embedded / Standalone Add Customer Modal */}
      {isAddCustomerModalOpen && (
        <AddCustomerModal
          isOpen={isAddCustomerModalOpen}
          onClose={() => setIsAddCustomerModalOpen(false)}
          onCustomerCreated={(newCust) => {
            handleCustomerCreated(newCust);
            setIsAddCustomerModalOpen(false);
          }}
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

      {/* 5. Quick-View Sale Details Drawer */}
      <SaleDetailDrawer
        isOpen={isSaleDrawerOpen}
        onClose={handleCloseSaleDrawer}
        sale={selectedSaleForDrawer}
        loading={isSaleDrawerLoading}
        onPrint={(s) => {
          handleOpenPrintSale(s);
        }}
        onEdit={(s) => {
          handleCloseSaleDrawer();
          handleInitiateEditSale(s);
        }}
        onCollectDue={(s) => {
          handleOpenDuePayment(s);
        }}
        taka={taka}
      />

      {/* 6. Due Payment Modal (Single Invoice / Customer Bulk) */}
      {duePaymentModal?.isOpen && (
        <DuePaymentModal
          isOpen={duePaymentModal.isOpen}
          onClose={handleCloseDuePayment}
          sale={duePaymentModal.sale}
          customer={duePaymentModal.customer}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* 7. Money Receipt / Payment Slip Modal (Thermal 80mm & A4/A5) */}
      {paymentSlipModal?.isOpen && (
        <PaymentSlipModal
          isOpen={paymentSlipModal.isOpen}
          onClose={handleClosePaymentSlip}
          receiptData={paymentSlipModal.receiptData}
          shopSettings={shopSettings}
        />
      )}
    </div>
  );
}
