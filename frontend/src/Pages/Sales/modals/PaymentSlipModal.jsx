import React, { useRef, useState } from 'react';

// Helper to format currency
const taka = (v) => `৳ ${Number(v || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;

// Simple number to English words for receipts
function numberToWords(num) {
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ',
    'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ',
    'Seventeen ', 'Eighteen ', 'Nineteen ',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = ('000000000' + Math.floor(num)).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += n[1] != 0 ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += n[2] != 0 ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += n[3] != 0 ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += n[4] != 0 ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += n[5] != 0 ? (str != '' ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return str.trim() ? `${str.trim()} Taka Only` : 'Zero Taka';
}

export default function PaymentSlipModal({
  isOpen,
  onClose,
  receiptData,
  shopSettings,
}) {
  const [printLayout, setPrintLayout] = useState('thermal'); // 'thermal' | 'a4'
  const printAreaRef = useRef(null);

  if (!isOpen || !receiptData) return null;

  const {
    receipt_no = 'MR-000000',
    is_bulk = false,
    payment_date = new Date().toISOString(),
    amount_collected = 0,
    previous_due,
    remaining_invoice_due,
    payment_status,
    account,
    sale,
    customer,
    settled_invoices = [],
    previous_customer_due,
    current_customer_due,
  } = receiptData;

  const shopName = shopSettings?.shop_name || 'SHEBA TECHNOLOGY';
  const shopPhone = shopSettings?.shop_phone || shopSettings?.phone || '';
  const shopAddress = shopSettings?.shop_address || shopSettings?.address || '';
  const shopLogo = shopSettings?.logo_url || shopSettings?.logo || '';

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(payment_date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-fadeIn my-auto max-h-[96vh]">
        {/* Modal Top Bar (Hidden during print) */}
        <div className="p-4 bg-slate-800 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧾</span>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Payment Receipt / মানি রিসিট</h3>
              <p className="text-[11px] text-slate-300">#{receipt_no}</p>
            </div>
          </div>

          {/* Format Toggle & Close */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-700 p-0.5 rounded-lg flex text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPrintLayout('thermal')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  printLayout === 'thermal'
                    ? 'bg-sky-500 text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Thermal (80mm)
              </button>
              <button
                type="button"
                onClick={() => setPrintLayout('a4')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  printLayout === 'a4'
                    ? 'bg-sky-500 text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Voucher / Slip
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors text-lg"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div
          ref={printAreaRef}
          className="p-5 sm:p-6 overflow-y-auto flex-1 bg-white text-slate-900 print:p-0 print:m-0"
        >
          {printLayout === 'thermal' ? (
            /* THERMAL 80MM POS SLIP */
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
          ) : (
            /* STANDARD A4 / A5 MONEY VOUCHER */
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
          )}
        </div>

        {/* Modal Footer / Action Buttons (Hidden during print) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700 shadow-md transition-colors"
          >
            <span>🖨️</span> Print Slip (প্রিন্ট রশিদ)
          </button>
        </div>
      </div>
    </div>
  );
}
