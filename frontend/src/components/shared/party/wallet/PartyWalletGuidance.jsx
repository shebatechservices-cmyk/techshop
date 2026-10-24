import React from 'react';

export default function PartyWalletGuidance({ partyType, walletAction }) {
  const getMessage = () => {
    if (partyType === 'customer') {
      if (walletAction === 'deposit') {
        return '💡 Customer wallet deposits increase shop funds and can be used to pay for future sales or outstanding invoices without affecting physical drawer cash again.';
      }
      if (walletAction === 'withdraw') {
        return '💡 Customer wallet withdrawals or refunds are paid out from your selected shop account.';
      }
      return '💡 Settle receivable due using existing customer wallet balance without creating additional drawer cash movements.';
    }
    if (partyType === 'supplier') {
      if (walletAction === 'deposit') {
        return '💡 Pre-fund supplier wallet for future purchase orders and invoice reconciliations.';
      }
      if (walletAction === 'withdraw') {
        return '💡 Refund or draw down supplier wallet balance into selected shop account.';
      }
      return '💡 Pay supplier payable due using available supplier advance wallet balance.';
    }
    if (walletAction === 'salary' || walletAction === 'bonus') {
      return '💡 Credit salary or performance bonus directly to the staff wallet balance.';
    }
    return '💡 Disburse staff wallet funds directly from selected shop account.';
  };

  return (
    <div className="p-3 rounded-xl mb-3.5 text-xs leading-relaxed bg-purple-50/60 border border-purple-200 text-purple-900">
      {getMessage()}
    </div>
  );
}
