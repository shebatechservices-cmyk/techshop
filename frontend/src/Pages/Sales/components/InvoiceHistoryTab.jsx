import React, { useState, useEffect } from 'react';
import InvoiceSearchToolbar from './invoice/InvoiceSearchToolbar';
import InvoiceTableRow from './invoice/InvoiceTableRow';
import PaginationControls from '../../../components/ui/PaginationControls';

const PAGE_SIZE = 20;

export default function InvoiceHistoryTab({
  filteredSales = [],
  sales = [],
  loading = false,
  invoiceSearchQuery = '',
  setInvoiceSearchQuery,
  invoiceStatusFilter = 'ALL',
  setInvoiceStatusFilter,
  loadAllData,
  setIsSaleModalOpen,
  setEditingSale,
  handleOpenPrintSale,
  handleOpenSaleDrawer,
  handleOpenDuePayment,
  setExchangeSaleId,
  handleInitiateEditSale,
  handleInitiateDeleteSale,
  actionLoading = {},
  getSaleLockStatus,
  isAdmin = false,
  setActiveTab,
  getPaymentBadgeStyle,
  taka,
  money,
}) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [invoiceSearchQuery, invoiceStatusFilter]);

  const totalPages = Math.ceil(filteredSales.length / PAGE_SIZE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedSales = filteredSales.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <InvoiceSearchToolbar
        invoiceSearchQuery={invoiceSearchQuery}
        setInvoiceSearchQuery={setInvoiceSearchQuery}
        invoiceStatusFilter={invoiceStatusFilter}
        setInvoiceStatusFilter={setInvoiceStatusFilter}
        filteredSalesCount={filteredSales.length}
        totalSalesCount={sales.length}
        loadAllData={loadAllData}
      />

      <div className="overflow-x-auto">
        {loading ? (
          <p className="text-center py-10 text-slate-500 text-sm">Loading sales records...</p>
        ) : filteredSales.length === 0 ? (
          invoiceSearchQuery || invoiceStatusFilter !== 'ALL' ? (
            <div className="text-center py-12 px-5 text-slate-500">
              <p className="text-base font-semibold text-slate-700 mb-2">
                No sales invoices match your search "{invoiceSearchQuery || invoiceStatusFilter}"
              </p>
              <p className="text-xs text-slate-500 mb-4">
                Try searching with another invoice number, customer name, phone number, or salesperson.
              </p>
              <button
                type="button"
                onClick={() => {
                  setInvoiceSearchQuery('');
                  setInvoiceStatusFilter('ALL');
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 py-2 px-4 rounded-lg font-semibold text-xs cursor-pointer transition-colors"
              >
                Clear Search &amp; Filter
              </button>
            </div>
          ) : (
            <div className="text-center py-12 px-5 text-slate-400">
              <p className="text-lg font-semibold text-slate-600 mb-2">No sales records found</p>
              <p className="text-xs mb-4">Start by creating a new sales transaction from the top button.</p>
              <button
                type="button"
                onClick={() => {
                  setEditingSale(null);
                  setIsSaleModalOpen(true);
                }}
                className="bg-green-600 hover:bg-green-700 text-white border-0 py-2 px-4 rounded-lg font-semibold text-xs cursor-pointer transition-colors"
              >
                + Create First Sale
              </button>
            </div>
          )
        ) : (
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-200 text-slate-500 uppercase text-[0.75rem] tracking-wider">
                <th className="py-3 px-3.5">Invoice No</th>
                <th className="py-3 px-3.5">Customer</th>
                <th className="py-3 px-3.5">Payment Status</th>
                <th className="py-3 px-3.5">Grand Total</th>
                <th className="py-3 px-3.5">Paid</th>
                <th className="py-3 px-3.5">Due</th>
                <th className="py-3 px-3.5">Date</th>
                <th className="py-3 px-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSales.map((sale) => (
                <InvoiceTableRow
                  key={sale.id}
                  sale={sale}
                  badge={getPaymentBadgeStyle(sale.payment_status, sale.due_amount, sale)}
                  isRefund={
                    getPaymentBadgeStyle(sale.payment_status, sale.due_amount, sale).label === 'Refunded'
                  }
                  taka={taka}
                  money={money}
                  handleOpenSaleDrawer={handleOpenSaleDrawer}
                  handleOpenPrintSale={handleOpenPrintSale}
                  setActiveTab={setActiveTab}
                  handleOpenDuePayment={handleOpenDuePayment}
                  setExchangeSaleId={setExchangeSaleId}
                  handleInitiateEditSale={handleInitiateEditSale}
                  handleInitiateDeleteSale={handleInitiateDeleteSale}
                  getSaleLockStatus={getSaleLockStatus}
                  actionLoading={actionLoading}
                  isAdmin={isAdmin}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && filteredSales.length > 0 && (
        <PaginationControls
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          pageSize={PAGE_SIZE}
          totalItems={filteredSales.length}
          onPageChange={setCurrentPage}
          itemName="invoices"
        />
      )}
    </div>
  );
}
