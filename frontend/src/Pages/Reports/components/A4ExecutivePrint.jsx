import React from 'react';
import A4LetterheadHeader from './print/A4LetterheadHeader';
import A4PerformanceBadges from './print/A4PerformanceBadges';
import A4PnlAccountingTable from './print/A4PnlAccountingTable';
import A4FinancialPositionCards from './print/A4FinancialPositionCards';
import A4TopProductsAndSignatures from './print/A4TopProductsAndSignatures';

export default function A4ExecutivePrint({
  shop = {},
  pnl = {},
  inventory = {},
  ledgers = {},
  topProducts = [],
  printDateStr = '',
  periodLabel = '',
  filterDates = { from: '', to: '' },
}) {
  const isNetProfitPositive = (pnl.net_profit || 0) >= 0;

  return (
    <div className="text-slate-900 text-sm leading-normal">
      <A4LetterheadHeader
        shop={shop}
        printDateStr={printDateStr}
        periodLabel={periodLabel}
        filterDates={filterDates}
      />

      <A4PerformanceBadges
        pnl={pnl}
        isNetProfitPositive={isNetProfitPositive}
      />

      <A4PnlAccountingTable
        pnl={pnl}
        isNetProfitPositive={isNetProfitPositive}
      />

      <A4FinancialPositionCards
        inventory={inventory}
        ledgers={ledgers}
      />

      <A4TopProductsAndSignatures
        topProducts={topProducts}
      />
    </div>
  );
}
