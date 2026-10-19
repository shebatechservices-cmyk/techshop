import React from 'react';
import { taka, numberToWords } from './receiptUtils';

export default function ThermalReceiptLayout({
  receiptData,
  shopSettings,
  formattedDate,
}) {
  const {
    receipt_no = 'MR-000000',
    is_bulk = false,
    amount_collected = 0,
    previous_due,
    remaining_invoice_due,
    account,
    sale,
    customer,
    settled_invoices = [],
  } = receiptData;

  const shopName = shopSettings?.shop_name || 'SHEBA TECHNOLOGY';
  const shopPhone = shopSettings?.shop_phone || shopSettings?.phone || '';
  const shopAddress = shopSettings?.shop_address || shopSettings?.address || '';
  const shopLogo = shopSettings?.logo_url || shopSettings?.logo || '';

  return (
    <div className="max-w-[340px] mx-auto text-xs font-mono p-4 border border-slate-200 rounded-xl bg-slate-50/50 print:border-none print:p-0 print:max-w-full">
      {/* Header */}
      <div className="text-center pb-3 border-b border-dashed border-slate-300 space-y-1">
        {shopLogo && (
          <img
            src={shopLogo}
            alt={shopName}
            style={{ maxHeight: '36px', maxWidth: '80px', objectFit: 'contain', margin: '0 auto 4px auto', display: 'block' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        <div className="font-extrabold text-base tracking-wider text-slate-900 uppercase">
          {shopName}
        </div>
        {shopAddress && <div className="text-[11px] text-slate-600">{shopAddress}</div>}
        {shopPhone && <div className="text-[11px] text-slate-600">Mobile: {shopPhone}</div>}
        <div className="inline-block mt-1 font-bold text-[11px] px-2 py-0.5 bg-slate-900 text-white rounded">
          {is_bulk ? 'BULK MONEY RECEIPT' : 'MONEY RECEIPT'}
        </div>
      </div>

      {/* Receipt Meta */}
      <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span className="text-slate-500">Receipt No:</span>
          <span className="font-bold">{receipt_no}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Date & Time:</span>
          <span>{formattedDate}</span>
        </div>
        {!is_bulk && sale?.invoice_no && (
          <div className="flex justify-between">
            <span className="text-slate-500">Invoice No:</span>
            <span className="font-bold">{sale.invoice_no}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-slate-500">Customer:</span>
          <span className="font-bold">{customer?.name || 'Walk-in'}</span>
        </div>
        {customer?.phone && (
          <div className="flex justify-between">
            <span className="text-slate-500">Phone:</span>
            <span>{customer.phone}</span>
          </div>
        )}
      </div>

      {/* Payment Details */}
      <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1.5 text-xs">
        {!is_bulk && previous_due !== undefined && (
          <div className="flex justify-between text-slate-600">
            <span>Invoice Previous Due:</span>
            <span className="font-semibold">{taka(previous_due)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm font-extrabold text-slate-900 py-1 bg-emerald-50 px-2 rounded border border-emerald-200">
          <span className="text-emerald-800">Paid Amount:</span>
          <span className="text-emerald-700">{taka(amount_collected)}</span>
        </div>

        {!is_bulk && remaining_invoice_due !== undefined && (
          <div className="flex justify-between text-slate-600">
            <span>Remaining Invoice Due:</span>
            <span
              className={`font-bold ${
                remaining_invoice_due > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {remaining_invoice_due > 0 ? taka(remaining_invoice_due) : 'CLEARED'}
            </span>
          </div>
        )}

        <div className="flex justify-between text-[11px] text-slate-500 pt-1">
          <span>Payment Account:</span>
          <span className="font-semibold text-slate-700">
            {account?.name || 'Cash Drawer'}
          </span>
        </div>

        {customer?.receivable_balance !== undefined && (
          <div className="flex justify-between text-[11px] text-slate-500 border-t border-slate-200 pt-1">
            <span>Customer Total Due:</span>
            <span className="font-bold text-rose-600">
              {taka(customer.receivable_balance)}
            </span>
          </div>
        )}
      </div>

      {/* Bulk Settled Invoices Table */}
      {is_bulk && settled_invoices.length > 0 && (
        <div className="py-2 border-b border-dashed border-slate-300">
          <div className="font-bold text-[10px] text-slate-500 uppercase mb-1">
            Settled Invoices ({settled_invoices.length})
          </div>
          <div className="space-y-1 text-[11px]">
            {settled_invoices.map((inv) => (
              <div key={inv.id} className="flex justify-between">
                <span>{inv.invoice_no}:</span>
                <span className="font-bold">
                  {taka(inv.amount_settled)}{' '}
                  <small className="text-[9px] text-slate-400">({inv.status})</small>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Amount In Words */}
      <div className="py-2 text-[10px] text-slate-600 italic">
        In words: {numberToWords(amount_collected)}
      </div>

      {/* Signatures */}
      <div className="pt-6 flex justify-between text-[10px] text-slate-500">
        <div className="text-center">
          <div className="w-20 border-t border-slate-400 mb-1" />
          <span>Customer</span>
        </div>
        <div className="text-center">
          <div className="w-20 border-t border-slate-400 mb-1" />
          <span>Cashier</span>
        </div>
      </div>

      <div className="text-center text-[10px] text-slate-400 mt-4">
        Thank you for your payment!
      </div>
    </div>
  );
}
