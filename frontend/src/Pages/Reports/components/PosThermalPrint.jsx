import React from 'react';

export default function PosThermalPrint({
  shop = {},
  pnl = {},
  channels = [],
  ledgers = {},
  inventory = {},
  printDateStr = '',
  periodLabel = '',
  filterDates = { from: '', to: '' },
}) {
  return (
    <div className="text-[11px] leading-tight text-black font-mono">
      {/* Header */}
      <div className="text-center mb-2">
        <div className="text-sm font-bold uppercase tracking-wide">
          {shop.shop_name || 'SEBA TECHNOLOGY'}
        </div>
        <div className="text-[10px] mt-0.5">
          {shop.address || 'Aruail South Market, Sarail'}
        </div>
        <div className="text-[10px]">
          Tel: {shop.phone || '01800000000'}
        </div>
        <div className="my-1.5 border-y border-dashed border-black py-1 font-bold text-xs">
          PERIODIC FINANCIAL SUMMARY
        </div>
      </div>

      {/* Period & Time info */}
      <div className="mb-2 text-[10px] space-y-0.5">
        <div>Period : {periodLabel}</div>
        <div>Range  : {filterDates.from} to {filterDates.to}</div>
        <div>Printed: {printDateStr}</div>
      </div>

      <div className="border-t border-dashed border-black mb-1.5" />

      {/* Sales Section */}
      <div className="font-bold mb-1 uppercase">
        [ SALES & REVENUE ]
      </div>
      <div className="flex justify-between my-0.5">
        <span>Total Invoices</span>
        <span>{pnl.total_invoices || 0}</span>
      </div>
      <div className="flex justify-between my-0.5">
        <span>Total Units Sold</span>
        <span>{pnl.total_units_sold || 0} pcs</span>
      </div>
      <div className="flex justify-between my-0.5">
        <span>Gross Sales</span>
        <span className="font-bold">৳ {pnl.gross_revenue?.toLocaleString('en-IN') || 0}</span>
      </div>
      <div className="flex justify-between my-0.5">
        <span>(-) Discounts</span>
        <span>- ৳ {pnl.total_discounts?.toLocaleString('en-IN') || 0}</span>
      </div>
      <div className="flex justify-between my-0.5">
        <span>(+) Tax / VAT</span>
        <span>+ ৳ {pnl.total_tax?.toLocaleString('en-IN') || 0}</span>
      </div>
      <div className="flex justify-between my-0.5 font-bold">
        <span>Net Collected</span>
        <span>৳ {pnl.total_collected?.toLocaleString('en-IN') || 0}</span>
      </div>
      <div className="flex justify-between my-0.5">
        <span>Sales Due Given</span>
        <span>৳ {pnl.total_due_given?.toLocaleString('en-IN') || 0}</span>
      </div>

      <div className="border-t border-dashed border-black my-1.5" />

      {/* Profitability Section */}
      <div className="font-bold mb-1 uppercase">
        [ COST & PROFITABILITY ]
      </div>
      <div className="flex justify-between my-0.5">
        <span>Est. COGS (Cost)</span>
        <span>- ৳ {pnl.cogs?.toLocaleString('en-IN') || 0}</span>
      </div>
      <div className="flex justify-between my-1 font-bold">
        <span>GROSS PROFIT</span>
        <span>৳ {pnl.gross_profit?.toLocaleString('en-IN') || 0}</span>
      </div>
      <div className="flex justify-between my-0.5 text-[10px]">
        <span>Gross Margin</span>
        <span>{pnl.gross_margin_pct || 0}%</span>
      </div>
      <div className="flex justify-between my-0.5">
        <span>Operating Exp.</span>
        <span>- ৳ {pnl.operating_expenses?.toLocaleString('en-IN') || 0}</span>
      </div>
      <div className="flex justify-between my-1 font-bold text-xs">
        <span>NET PROFIT</span>
        <span>৳ {pnl.net_profit?.toLocaleString('en-IN') || 0}</span>
      </div>
      <div className="flex justify-between my-0.5 text-[10px]">
        <span>Net Margin</span>
        <span>{pnl.net_margin_pct || 0}%</span>
      </div>

      <div className="border-t border-dashed border-black my-1.5" />

      {/* Channels */}
      {channels.length > 0 && (
        <>
          <div className="font-bold mb-1 uppercase">
            [ INFLOW BY CHANNEL ]
          </div>
          {channels.map((ch, i) => (
            <div key={i} className="flex justify-between my-0.5 text-[10px]">
              <span>{ch.method} ({ch.count})</span>
              <span>৳ {Number(ch.total_amount || 0).toLocaleString('en-IN')}</span>
            </div>
          ))}
          <div className="border-t border-dashed border-black my-1.5" />
        </>
      )}

      {/* Balances */}
      <div className="font-bold mb-1 uppercase">
        [ BALANCE SNAPSHOT ]
      </div>
      <div className="flex justify-between my-0.5">
        <span>Cash in Drawers</span>
        <span className="font-bold">৳ {ledgers.total_cash_in_drawers?.toLocaleString('en-IN') || 0}</span>
      </div>
      <div className="flex justify-between my-0.5">
        <span>Customer Due</span>
        <span>৳ {ledgers.total_customer_receivables?.toLocaleString('en-IN') || 0}</span>
      </div>
      <div className="flex justify-between my-0.5">
        <span>Stock Valuation</span>
        <span>৳ {inventory.total_cost_value?.toLocaleString('en-IN') || 0}</span>
      </div>

      <div className="border-t border-dashed border-black my-3.5 mb-6" />

      {/* Signatures */}
      <div className="text-center mt-5">
        <div className="border-t border-dotted border-black w-36 mx-auto pt-1 text-[10px]">
          Cashier / Manager
        </div>
        <div className="mt-2 text-[9px]">
          *** Thank You ***
        </div>
      </div>
    </div>
  );
}
