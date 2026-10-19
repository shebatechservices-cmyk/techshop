import React from 'react';
import { useDuePayment } from './duePayment/useDuePayment';
import DuePaymentHeader from './duePayment/DuePaymentHeader';
import DuePaymentModeSelector from './duePayment/DuePaymentModeSelector';
import DuePaymentFormFields from './duePayment/DuePaymentFormFields';

const taka = (v) => `৳ ${Number(v || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;

export default function DuePaymentModal({
  isOpen,
  onClose,
  sale,
  customer,
  onPaymentSuccess,
}) {
  const {
    paymentMode,
    amount,
    setAmount,
    accountId,
    setAccountId,
    note,
    setNote,
    referenceNo,
    setReferenceNo,
    accounts,
    loadingAccounts,
    submitting,
    error,
    saleDue,
    customerTotalDue,
    customerId,
    customerName,
    handleModeChange,
    handleSubmit,
  } = useDuePayment({ isOpen, sale, customer, onClose, onPaymentSuccess });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9990] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-fadeIn my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <DuePaymentHeader
          paymentMode={paymentMode}
          sale={sale}
          customerName={customerName}
          onClose={onClose}
        />

        {customerId && customerTotalDue > saleDue && (
          <DuePaymentModeSelector
            paymentMode={paymentMode}
            handleModeChange={handleModeChange}
            saleDue={saleDue}
            customerTotalDue={customerTotalDue}
            taka={taka}
          />
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <DuePaymentFormFields
            paymentMode={paymentMode}
            amount={amount}
            setAmount={setAmount}
            saleDue={saleDue}
            customerTotalDue={customerTotalDue}
            customerName={customerName}
            sale={sale}
            accountId={accountId}
            setAccountId={setAccountId}
            accounts={accounts}
            loadingAccounts={loadingAccounts}
            referenceNo={referenceNo}
            setReferenceNo={setReferenceNo}
            note={note}
            setNote={setNote}
            taka={taka}
          />

          {/* Submit & Cancel */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>💵</span>
                  <span>Confirm &amp; Print Receipt</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
