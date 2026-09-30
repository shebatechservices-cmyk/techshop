import React from 'react';
import SaleQuotationModal from './modals/SaleQuotationModal';
import SalePrintModal from './modals/SalePrintModal';
import QuotationDataTable from './components/QuotationDataTable';
import QuotationMetricsCards from './components/QuotationMetricsCards';
import QuotationSearchToolbar from './components/QuotationSearchToolbar';
import { useSalesQuotations } from './hooks/useSalesQuotations';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * SalesQuotations
 * Standalone Quotations subpage component.
 * Converted entirely to Tailwind CSS utilities (zero inline styles).
 * Fully encapsulates Quotations state, fetch logic, SaleQuotationModal, and quotation printing.
 */
export default function SalesQuotations({
  initialSearch = '',
  onQuotationsLoaded
}) {
  const {
    quotations,
    loading,
    quotationSearchQuery,
    setQuotationSearchQuery,
    quotationStatusFilter,
    setQuotationStatusFilter,
    modalCustomers,
    modalProducts,
    newlyCreatedCustomer,
    setNewlyCreatedCustomer,
    isQuotationModalOpen,
    setIsQuotationModalOpen,
    editingQuotation,
    setEditingQuotation,
    printData,
    setPrintData,
    isPrintOpen,
    setIsPrintOpen,
    notification,
    fetchQuotations,
    handleDeleteQuotation,
    handleUpdateQuotationStatus,
    handleEditQuotation,
    handleOpenPrintQuotation,
    handleQuotationCreated,
    totalQuotationValue,
    acceptedQuotationsCount,
    filteredQuotations
  } = useSalesQuotations({
    initialSearch,
    onQuotationsLoaded
  });

  return (
    <div className="w-full space-y-4">
      {/* Toast Notification */}
      {notification.message && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl font-semibold text-sm shadow-xl flex items-center gap-2 text-white transition-all ${
            notification.type === 'error' ? 'bg-rose-500' : 'bg-emerald-600'
          }`}
        >
          <span>{notification.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* KPI Metrics Cards */}
      <QuotationMetricsCards
        quotationsCount={quotations.length}
        totalQuotationValue={totalQuotationValue}
        acceptedQuotationsCount={acceptedQuotationsCount}
        taka={taka}
      />

      {/* Main Card Container */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
        {/* Dedicated Quotation Search & Filter Toolbar */}
        <QuotationSearchToolbar
          quotationSearchQuery={quotationSearchQuery}
          setQuotationSearchQuery={setQuotationSearchQuery}
          quotationStatusFilter={quotationStatusFilter}
          setQuotationStatusFilter={setQuotationStatusFilter}
          filteredCount={filteredQuotations.length}
          totalCount={quotations.length}
          onRefresh={fetchQuotations}
          onNewQuotation={() => {
            setEditingQuotation(null);
            setNewlyCreatedCustomer(null);
            setIsQuotationModalOpen(true);
          }}
        />

        {/* Data Table / Content Area */}
        <QuotationDataTable
          loading={loading}
          filteredQuotations={filteredQuotations}
          quotationsCount={quotations.length}
          quotationSearchQuery={quotationSearchQuery}
          quotationStatusFilter={quotationStatusFilter}
          setQuotationSearchQuery={setQuotationSearchQuery}
          setQuotationStatusFilter={setQuotationStatusFilter}
          setIsQuotationModalOpen={setIsQuotationModalOpen}
          setEditingQuotation={setEditingQuotation}
          setNewlyCreatedCustomer={setNewlyCreatedCustomer}
          handleUpdateQuotationStatus={handleUpdateQuotationStatus}
          handleOpenPrintQuotation={handleOpenPrintQuotation}
          handleEditQuotation={handleEditQuotation}
          handleDeleteQuotation={handleDeleteQuotation}
          taka={taka}
        />
      </div>

      {/* Relocated Modals */}
      {/* 1. Sale Quotation Modal */}
      {isQuotationModalOpen && (
        <SaleQuotationModal
          isOpen={isQuotationModalOpen}
          onClose={() => {
            setIsQuotationModalOpen(false);
            setEditingQuotation(null);
          }}
          customers={modalCustomers}
          products={modalProducts}
          newlyCreatedCustomer={newlyCreatedCustomer}
          onOpenAddCustomer={() => {
            window.dispatchEvent(new CustomEvent('sales:open_modal', { detail: 'customer' }));
          }}
          onQuotationCreated={handleQuotationCreated}
          editingQuotation={editingQuotation}
        />
      )}

      {/* 2. Quotation Printable Sheet Modal */}
      {isPrintOpen && printData && (
        <SalePrintModal
          isOpen={isPrintOpen}
          onClose={() => {
            setIsPrintOpen(false);
            setPrintData(null);
          }}
          sale={printData}
          isQuotation={true}
        />
      )}
    </div>
  );
}
