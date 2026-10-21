import React from 'react';
import CustomerList from '../CustomerList';
import SalesQuotations from '../SalesQuotations';
import InvoiceHistoryTab from './InvoiceHistoryTab';

export default function SalesTabContent({
  activeTab,
  initialTab,
  initialSearch,
  handleStartSaleForCustomer,
  handleStartQuoteForCustomer,
  setCustomersCount,
  handleCustomerCreated,
  setQuotationsCount,
  filteredSales,
  sales,
  loading,
  invoiceSearchQuery,
  setInvoiceSearchQuery,
  invoiceStatusFilter,
  setInvoiceStatusFilter,
  loadAllData,
  setIsSaleModalOpen,
  setEditingSale,
  handleOpenPrintSale,
  handleOpenSaleDrawer,
  setExchangeSaleId,
  handleInitiateEditSale,
  handleInitiateDeleteSale,
  handleOpenDuePayment,
  actionLoading,
  getSaleLockStatus,
  isAdmin,
  setActiveTab,
  getPaymentBadgeStyle,
  taka,
  money,
}) {
  if (activeTab === 'customers') {
    return (
      <CustomerList
        initialSearch={initialTab === 'customers' ? initialSearch : ''}
        onStartSale={handleStartSaleForCustomer}
        onStartQuote={handleStartQuoteForCustomer}
        onCustomersLoaded={(list) => setCustomersCount(list.length)}
        onCustomerCreated={handleCustomerCreated}
      />
    );
  }

  if (activeTab === 'quotations') {
    return (
      <SalesQuotations
        initialSearch={initialTab === 'quotations' ? initialSearch : ''}
        onQuotationsLoaded={(list) => setQuotationsCount(list.length)}
      />
    );
  }

  return (
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
  );
}
