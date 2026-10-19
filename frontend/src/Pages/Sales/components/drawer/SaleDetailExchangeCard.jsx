import React from 'react';

export default function SaleDetailExchangeCard({ sale, taka, isRefund, paid }) {
  if (!sale?.exchange_details) return null;

  const returnedItems = Array.isArray(sale.exchange_details.returned_items)
    ? sale.exchange_details.returned_items
    : [];

  return (
    <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3.5 space-y-2">
      <div className="text-[0.7rem] font-bold text-purple-700 uppercase tracking-wider flex items-center justify-between">
        <span>🔄 Exchange &amp; Return Breakdown</span>
        {sale.exchange_from_invoice_no && (
          <span className="text-[0.68rem] font-mono font-semibold text-purple-800">
            Original: #{sale.exchange_from_invoice_no}
          </span>
        )}
      </div>

      {returnedItems.length > 0 && (
        <div className="space-y-1 pt-1">
          <div className="text-[0.66rem] font-bold text-purple-900 uppercase">
            Returned Goods:
          </div>
          <div className="divide-y divide-purple-100 bg-white rounded-lg border border-purple-200 overflow-hidden text-xs">
            {returnedItems.map((ret, rIdx) => (
              <div key={rIdx} className="p-2.5 flex justify-between items-start gap-2">
                <div>
                  <div className="font-bold text-slate-800 text-xs">{ret.name}</div>
                  <div className="text-[0.68rem] text-slate-500 mt-0.5">
                    {ret.quantity} × {taka(ret.unit_price)}{' '}
                    {ret.condition ? `• Condition: ${ret.condition}` : ''}
                  </div>
                  {Array.isArray(ret.serials) && ret.serials.length > 0 && (
                    <div className="text-[0.64rem] text-sky-700 font-mono mt-0.5">
                      S/N: {ret.serials.join(', ')}
                    </div>
                  )}
                </div>
                <div className="font-extrabold text-slate-900 text-xs text-right">
                  {taka((ret.quantity || 1) * (ret.unit_price || 0))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2 border-t border-purple-200 space-y-1 text-xs text-purple-950">
        <div className="flex justify-between">
          <span>Return Value Credit:</span>
          <span className="font-bold">{taka(sale.exchange_details.return_subtotal || 0)}</span>
        </div>
        <div className="flex justify-between">
          <span>New Items Subtotal:</span>
          <span className="font-bold">{taka(sale.exchange_details.new_subtotal || 0)}</span>
        </div>
        {paid > 0 && isRefund && (
          <div className="flex justify-between text-purple-700 font-extrabold pt-1 border-t border-purple-200">
            <span>Refund Paid to Customer:</span>
            <span>- {taka(paid)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
