import React from 'react';
import InvoiceRowActions from './InvoiceRowActions';

export default function InvoiceTableRow({
  sale,
  badge,
  isRefund,
  taka,
  money,
  handleOpenSaleDrawer,
  handleOpenPrintSale,
  setActiveTab,
  handleOpenDuePayment,
  setExchangeSaleId,
  handleInitiateEditSale,
  handleInitiateDeleteSale,
  getSaleLockStatus,
  actionLoading,
  isAdmin,
}) {
  const saleDue = money(sale.due_amount);
  const lock = getSaleLockStatus(sale);
  const isPrinting = actionLoading?.[sale.id] === 'print';
  const isEditing = actionLoading?.[sale.id] === 'edit';
  const isDeleting = actionLoading?.[sale.id] === 'delete';

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
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
        {sale.exchange_from_invoice_no && (
          <div className="text-[0.68rem] font-normal text-slate-400 mt-0.5">
            🔄 Exch. from #{sale.exchange_from_invoice_no}
          </div>
        )}
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
        {sale.exchange_details?.return_subtotal > 0 && Number(sale.total_amount || 0) === 0 && (
          <div className="text-[0.68rem] text-slate-400 font-normal mt-0.5">
            Return: {taka(sale.exchange_details.return_subtotal)}
          </div>
        )}
      </td>
      <td className="py-3 px-3.5">
        {isRefund ? (
          <div>
            <span className="font-semibold text-purple-700">
              - {taka(sale.paid_amount || 0)}
            </span>
            <span className="text-[0.65rem] font-bold uppercase text-purple-500 block">
              Refund Out
            </span>
          </div>
        ) : (
          <span className="font-semibold text-green-600">
            {taka(sale.paid_amount || 0)}
          </span>
        )}
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
        <InvoiceRowActions
          sale={sale}
          saleDue={saleDue}
          lock={lock}
          isPrinting={isPrinting}
          isEditing={isEditing}
          isDeleting={isDeleting}
          handleOpenSaleDrawer={handleOpenSaleDrawer}
          handleOpenPrintSale={handleOpenPrintSale}
          handleOpenDuePayment={handleOpenDuePayment}
          setExchangeSaleId={setExchangeSaleId}
          handleInitiateEditSale={handleInitiateEditSale}
          handleInitiateDeleteSale={handleInitiateDeleteSale}
          isAdmin={isAdmin}
          taka={taka}
        />
      </td>
    </tr>
  );
}
