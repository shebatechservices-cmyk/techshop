import React from 'react';

export default function PartyFinancialGuidance({ partyType, finAction }) {
  const colorMap = {
    supplier: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    customer: 'bg-sky-50 border-sky-200 text-sky-800',
    staff: 'bg-purple-50 border-purple-200 text-purple-800',
  };

  return (
    <div className={`p-3 rounded-xl mb-4 text-xs leading-relaxed border ${colorMap[partyType] || colorMap.customer}`}>
      {partyType === 'supplier' && (
        '💡 Direct payout to supplier from your selected shop account (Cash Drawer / Bank / MFS) which will reduce their Payable Due balance.'
      )}
      {partyType === 'customer' && (
        finAction === 'due'
          ? '💡 Received due payment will deposit into your selected shop account (Cash / Bank / MFS) and reduce the customer’s Receivable Due balance.'
          : '💡 Customer refund or return payout will be deducted from your selected shop account.'
      )}
      {partyType === 'staff' && (
        '💡 Staff salary, commission, or conveyance advance payment will be deducted as an expense from your selected shop account.'
      )}
    </div>
  );
}
