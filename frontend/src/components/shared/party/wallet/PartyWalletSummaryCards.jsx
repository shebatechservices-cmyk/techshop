import React from 'react';

export default function PartyWalletSummaryCards({ partyType, walletBalance, balance }) {
  const isDue = balance > 0;
  const isAdvance = balance < 0;

  const dueLabel = partyType === 'customer'
    ? (isDue ? 'Outstanding Due' : isAdvance ? 'Advance Credit' : 'Net Position')
    : partyType === 'supplier'
    ? (isDue ? 'Payable Due' : isAdvance ? 'Advance Given' : 'Net Position')
    : 'Net Position';

  const subText = partyType === 'staff'
    ? 'Linked sales/ledger position'
    : isDue
    ? 'Pending settlement'
    : isAdvance
    ? (partyType === 'customer' ? 'Advance credit' : 'Advance given')
    : 'All cleared';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
      <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4">
        <span className="text-[11px] text-purple-700 uppercase font-bold tracking-wider">👛 Wallet Balance</span>
        <div className="text-2xl font-extrabold text-purple-800 mt-1">
          ৳ {walletBalance.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
        </div>
        <small className="text-purple-500 text-xs">
          {partyType === 'staff' ? 'Credit wallet — drawer unchanged until withdrawal' : 'Available credit in wallet'}
        </small>
      </div>

      <div className={`border rounded-xl p-4 ${isDue ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
        <span className={`text-[11px] uppercase font-bold tracking-wider ${isDue ? 'text-rose-700' : 'text-emerald-700'}`}>
          {dueLabel}
        </span>
        <div className={`text-2xl font-extrabold mt-1 ${isDue ? 'text-rose-700' : 'text-emerald-700'}`}>
          ৳ {balance.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
        </div>
        <small className={`text-xs ${isDue ? 'text-rose-600' : 'text-emerald-600'}`}>
          {subText}
        </small>
      </div>
    </div>
  );
}
