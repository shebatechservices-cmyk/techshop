import React from 'react';
import MultiTenderPaymentTable from '../../../../components/shared/MultiTenderPaymentTable';
import { taka } from '../../hooks/usePurchaseCart';

export default function PurchasePaymentSection({
  previousDue = 0,
  payableAmount = 0,
  totalPayable = 0,
  currentDue = 0,
  handlePayOrder,
  handlePayFull,
  handleFullDue,
  tenders = [],
  updateTender,
  addTenderRow,
  acceptTender,
  cancelTender,
  cashAccounts = [],
  bankAccounts = [],
  mfsAccounts = [],
  walletAccounts = [],
  supplierWallet = 0,
  supplierWalletLabel = 'Supplier Wallet',
}) {
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
      {/* Quick Settle Toolbar */}
      <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
        <div className="flex gap-2 items-center">
          <span className="text-xs font-bold text-slate-500 uppercase">
            Quick Settle:
          </span>
          {previousDue > 0 ? (
            <>
              <button
                type="button"
                onClick={handlePayOrder}
                className="py-1 px-2.5 rounded border border-blue-300 bg-blue-50 text-xs font-bold text-blue-800 cursor-pointer hover:bg-blue-100 transition-colors"
              >
                Pay Order ({taka(payableAmount)})
              </button>
              <button
                type="button"
                onClick={handlePayFull}
                className="py-1 px-2.5 rounded border border-emerald-300 bg-emerald-50 text-xs font-bold text-emerald-800 cursor-pointer hover:bg-emerald-100 transition-colors"
              >
                Pay Total ({taka(totalPayable)})
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handlePayFull}
              className="py-1 px-2.5 rounded border border-emerald-300 bg-emerald-50 text-xs font-bold text-emerald-800 cursor-pointer hover:bg-emerald-100 transition-colors"
            >
              Pay Full ({taka(totalPayable)})
            </button>
          )}
          <button
            type="button"
            onClick={handleFullDue}
            className="py-1 px-2.5 rounded border border-rose-200 bg-white text-xs font-bold text-rose-600 cursor-pointer hover:bg-rose-50 transition-colors"
          >
            Full Due (৳0.00)
          </button>
        </div>
      </div>

      {/* Multi-Tender Payment Details Table */}
      <MultiTenderPaymentTable
        tenders={tenders}
        onUpdateTender={updateTender}
        onAddTender={addTenderRow}
        onAcceptTender={acceptTender}
        onCancelTender={cancelTender}
        cashAccounts={cashAccounts}
        bankAccounts={bankAccounts}
        mfsAccounts={mfsAccounts}
        financialAccounts={walletAccounts}
        isPurchase={true}
        walletBalance={supplierWallet}
        walletAccountLabel={supplierWalletLabel}
        remainingPayable={currentDue}
      />
    </div>
  );
}
