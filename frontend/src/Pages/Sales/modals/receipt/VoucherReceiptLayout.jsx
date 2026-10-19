import React from 'react';
import { taka, numberToWords } from './receiptUtils';

export default function VoucherReceiptLayout({
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
  } = receiptData;

  const shopName = shopSettings?.shop_name || 'SHEBA TECHNOLOGY';
  const shopPhone = shopSettings?.shop_phone || shopSettings?.phone || '';
  const shopAddress = shopSettings?.shop_address || shopSettings?.address || '';
  const shopLogo = shopSettings?.logo_url || shopSettings?.logo || '';

  return (
    <div className="p-6 border border-slate-300 rounded-2xl bg-white space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start border-b pb-4">
        <div className="flex items-center gap-3">
          {shopLogo && (
            <img
              src={shopLogo}
              alt={shopName}
              style={{ maxHeight: '48px', maxWidth: '120px', objectFit: 'contain' }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">
              {shopName}
            </h2>
            <p className="text-xs text-slate-500">{shopAddress}</p>
            <p className="text-xs text-slate-500">Phone: {shopPhone}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-block text-xs font-black uppercase tracking-wider bg-slate-900 text-white px-3 py-1 rounded-md">
            {is_bulk ? 'Bulk Money Receipt' : 'Money Receipt (রশিদ)'}
          </span>
          <div className="text-xs font-bold text-slate-700 mt-1">Receipt: #{receipt_no}</div>
          <div className="text-xs text-slate-400">{formattedDate}</div>
        </div>
      </div>

      {/* Customer Box */}
      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Received From:
          </span>
          <span className="font-extrabold text-sm text-slate-800">
            {customer?.name || 'Walk-in Customer'}
          </span>
          {customer?.phone && <div className="text-slate-600">📞 {customer.phone}</div>}
          {customer?.address && <div className="text-slate-500">📍 {customer.address}</div>}
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Payment Method:
          </span>
          <span className="font-bold text-slate-800">
            {account?.name || 'Cash Drawer'}
          </span>
          {!is_bulk && sale?.invoice_no && (
            <div className="text-slate-600 mt-1">
              Against Invoice: <span className="font-mono font-bold">{sale.invoice_no}</span>
            </div>
          )}
        </div>
      </div>

      {/* Payment Summary Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="p-2.5">Description</th>
              <th className="p-2.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!is_bulk && previous_due !== undefined && (
              <tr>
                <td className="p-2.5 text-slate-600">
                  Previous Invoice Due ({sale?.invoice_no || 'Invoice'})
                </td>
                <td className="p-2.5 text-right font-medium">{taka(previous_due)}</td>
              </tr>
            )}
            <tr className="bg-emerald-50/50">
              <td className="p-2.5 font-bold text-emerald-900">
                Total Amount Received (আদায়কৃত টাকা)
              </td>
              <td className="p-2.5 text-right font-black text-sm text-emerald-700">
                {taka(amount_collected)}
              </td>
            </tr>
            {!is_bulk && remaining_invoice_due !== undefined && (
              <tr>
                <td className="p-2.5 text-slate-600">Remaining Invoice Due</td>
                <td
                  className={`p-2.5 text-right font-bold ${
                    remaining_invoice_due > 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {remaining_invoice_due > 0 ? taka(remaining_invoice_due) : 'CLEARED (0.00)'}
                </td>
              </tr>
            )}
            {customer?.receivable_balance !== undefined && (
              <tr className="bg-slate-50 font-bold">
                <td className="p-2.5 text-slate-700">
                  Customer Overall Outstanding Balance (সর্বমোট বাকি)
                </td>
                <td className="p-2.5 text-right text-rose-600">
                  {taka(customer.receivable_balance)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* In Words */}
      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
        <span className="font-semibold">In Words:</span> {numberToWords(amount_collected)}
      </div>

      {/* Signatures */}
      <div className="pt-10 flex justify-between text-xs text-slate-600">
        <div className="text-center">
          <div className="w-32 border-t border-slate-400 mb-1" />
          <span>Customer's Signature</span>
        </div>
        <div className="text-center">
          <div className="w-32 border-t border-slate-400 mb-1" />
          <span>Authorized Signature</span>
        </div>
      </div>
    </div>
  );
}
