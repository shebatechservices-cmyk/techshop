import React from 'react';
import TableActionDropdown from '../../../components/ui/TableActionDropdown';

export default function InvoiceHistoryTab({
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
  handleOpenDuePayment,
  setExchangeSaleId,
  handleInitiateEditSale,
  handleInitiateDeleteSale,
  actionLoading,
  getSaleLockStatus,
  isAdmin,
  setActiveTab,
  getPaymentBadgeStyle,
  taka,
  money,
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      {/* Dedicated Invoice Search & Filter Toolbar */}
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-[280px] flex-wrap">
          <div className="relative w-full max-w-[440px]">
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={invoiceSearchQuery}
              onChange={(e) => setInvoiceSearchQuery(e.target.value)}
              placeholder="Search invoices by invoice #, customer, phone, salesperson..."
              className="w-full py-2.5 pl-10 pr-9 rounded-lg border-[1.5px] border-slate-300 text-sm outline-none box-border bg-white focus:border-sky-500"
              style={{ paddingLeft: '2.5rem' }}
            />
            {invoiceSearchQuery && (
              <button
                type="button"
                onClick={() => setInvoiceSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer text-slate-400 hover:text-slate-600 text-sm"
                title="Clear invoice search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Payment Status Filter */}
          <select
            value={invoiceStatusFilter}
            onChange={(e) => setInvoiceStatusFilter(e.target.value)}
            className="py-2.5 px-3.5 rounded-lg border-[1.5px] border-slate-300 text-sm bg-white cursor-pointer text-slate-700 font-medium outline-none focus:border-sky-500"
          >
            <option value="ALL">All Payment Status</option>
            <option value="PAID">Paid Only</option>
            <option value="PARTIAL">Partial Only</option>
            <option value="DUE">Due Only</option>
          </select>

          {/* Match Counter Badge */}
          <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 py-1.5 px-3 rounded-full">
            Showing {filteredSales.length} of {sales.length} Invoices
          </span>
        </div>

        <div className="flex gap-2 items-center">
          <button
            type="button"
            onClick={loadAllData}
            title="Refresh Invoices"
            className="bg-white hover:bg-slate-50 border border-slate-300 py-2 px-3.5 rounded-lg text-xs font-semibold text-slate-600 cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            <span>🔄</span> Refresh
          </button>
        </div>
      </div>

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
              {filteredSales.map((sale) => {
                const badge = getPaymentBadgeStyle(sale.payment_status, sale.due_amount);
                return (
                  <tr
                    key={sale.id}
                    className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-3 px-3.5 font-bold text-sky-600">
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenSaleDrawer
                            ? handleOpenSaleDrawer(sale)
                            : handleOpenPrintSale(sale.id)
                        }
                        title="Click to view full invoice details in sidebar"
                        className="bg-transparent border-0 p-0 font-inherit font-bold text-sky-600 hover:text-sky-800 cursor-pointer text-left underline underline-offset-2"
                      >
                        {sale.invoice_no || `INV-${sale.id}`}
                      </button>
                    </td>
                    <td className="py-3 px-3.5">
                      {sale.customer_id ? (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('customers');
                            setTimeout(() => {
                              window.dispatchEvent(
                                new CustomEvent('sales:open_customer_profile', {
                                  detail: { customerId: sale.customer_id, tab: 'overview' },
                                })
                              );
                            }, 50);
                          }}
                          title="Click to view customer profile & history"
                          className="bg-transparent border-0 p-0 font-inherit font-semibold text-slate-800 hover:text-slate-900 cursor-pointer text-left underline underline-offset-2"
                        >
                          {sale.customer_name || 'Walk-in Customer'}
                        </button>
                      ) : (
                        <div className="font-semibold text-slate-800">
                          {sale.customer_name || 'Walk-in Customer'}
                        </div>
                      )}
                      {sale.customer_phone && (
                        <div className="text-[0.78rem] text-slate-500">{sale.customer_phone}</div>
                      )}
                    </td>
                    <td className="py-3 px-3.5">
                      <span
                        className={`py-0.5 px-2.5 rounded-full text-xs font-bold uppercase inline-block ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 font-bold text-slate-900">
                      {taka(sale.total_amount || sale.grand_total)}
                    </td>
                    <td className="py-3 px-3.5 font-semibold text-green-600">
                      {taka(sale.paid_amount || 0)}
                    </td>
                    <td
                      className={`py-3 px-3.5 font-semibold ${
                        money(sale.due_amount) > 0 ? 'text-red-500' : 'text-slate-500'
                      }`}
                    >
                      {taka(sale.due_amount || 0)}
                    </td>
                    <td className="py-3 px-3.5 text-slate-500 text-xs">
                      {sale.created_at
                        ? new Date(sale.created_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '-'}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      {(() => {
                        const saleDue = money(sale.due_amount);
                        const lock = getSaleLockStatus(sale);
                        const isPrinting = actionLoading[sale.id] === 'print';
                        const isEditing = actionLoading[sale.id] === 'edit';
                        const isDeleting = actionLoading[sale.id] === 'delete';

                        return (
                          <div className="flex gap-1.5 justify-center items-center">
                            {/* Quick View Drawer Shortcut */}
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenSaleDrawer
                                  ? handleOpenSaleDrawer(sale)
                                  : handleOpenPrintSale(sale.id)
                              }
                              className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg py-1 px-2.5 text-xs font-bold cursor-pointer inline-flex items-center gap-1 transition-colors shadow-2xs"
                              title="Quick view invoice in sidebar"
                            >
                              <span>👁️</span> View
                            </button>

                            {/* 3-Dots Smart Actions Dropdown */}
                            <TableActionDropdown
                              triggerLabel={
                                isPrinting || isEditing || isDeleting ? (
                                  <span className="inline-block w-3.5 h-3.5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  '⋮'
                                )
                              }
                              triggerTitle="Invoice Actions"
                              triggerClassName="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-sm font-extrabold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
                              minWidth="195px"
                              items={[
                                {
                                  key: 'view',
                                  label: 'Quick View (সাইডবার)',
                                  icon: '👁️',
                                  className: 'text-sky-700 hover:bg-sky-50 font-bold',
                                  onClick: () =>
                                    handleOpenSaleDrawer
                                      ? handleOpenSaleDrawer(sale)
                                      : handleOpenPrintSale(sale.id),
                                },
                                {
                                  key: 'print',
                                  label: 'Print Invoice (চালান প্রিন্ট)',
                                  icon: '🖨️',
                                  className: 'text-slate-700 hover:bg-slate-50',
                                  onClick: () => handleOpenPrintSale(sale.id),
                                },
                                ...(saleDue > 0 && handleOpenDuePayment
                                  ? [
                                      {
                                        key: 'due',
                                        label: `Collect Due (${taka(saleDue)})`,
                                        icon: '💳',
                                        className: 'text-emerald-700 hover:bg-emerald-50 font-bold',
                                        onClick: () => handleOpenDuePayment(sale),
                                      },
                                    ]
                                  : []),
                                {
                                  key: 'exchange',
                                  label: 'Exchange (পণ্য বদল)',
                                  icon: '🔄',
                                  className: 'text-purple-700 hover:bg-purple-50',
                                  onClick: () => setExchangeSaleId(sale.id),
                                },
                                {
                                  key: 'edit',
                                  label: lock.isEditLocked ? 'Edit (Locked 🔒)' : 'Edit Sale (এডিট)',
                                  icon: lock.isEditLocked ? '🔒' : '✏️',
                                  className: lock.isEditLocked
                                    ? 'text-amber-700 hover:bg-amber-50 font-medium'
                                    : 'text-blue-700 hover:bg-blue-50',
                                  title: lock.isEditLocked
                                    ? isAdmin
                                      ? `Locked (${lock.editLockReason}) — Admin Override Available`
                                      : `Locked: ${lock.editLockReason}`
                                    : 'Edit invoice',
                                  onClick: () => handleInitiateEditSale(sale.id, sale),
                                },
                                { divider: true },
                                {
                                  key: 'delete',
                                  label: lock.isDeleteLocked ? 'Delete (Locked 🔒)' : 'Delete Sale (মুছুন)',
                                  icon: '🗑️',
                                  danger: true,
                                  className: 'text-rose-600 hover:bg-rose-50 font-medium',
                                  title: lock.isDeleteLocked
                                    ? isAdmin
                                      ? `Locked (${lock.deleteLockReason}) — Admin Override Available`
                                      : `Locked: ${lock.deleteLockReason}`
                                    : 'Delete sale invoice',
                                  onClick: () => handleInitiateDeleteSale(sale.id, sale),
                                },
                              ]}
                            />
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
