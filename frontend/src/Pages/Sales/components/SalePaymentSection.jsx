import React from 'react';
import MultiTenderPaymentTable from '../../../components/shared/MultiTenderPaymentTable';
import { taka } from '../hooks/useNewSale';
import SalePaymentAdditionalDetails from './payment/SalePaymentAdditionalDetails';
import SalePaymentSummaryGrid from './payment/SalePaymentSummaryGrid';
import SalePaymentAddonsToolbar from './payment/SalePaymentAddonsToolbar';

export default function SalePaymentSection({
  // Additional Details props
  salesPerson,
  setSalesPerson,
  staffList,
  invoiceDate,
  setInvoiceDate,
  destination,
  setDestination,
  attention,
  setAttention,

  // Calculation & summary props
  paid,
  due,
  netAmount,
  discount,
  totalDiscount,
  setDiscount,
  setDiscountTouched,
  loyaltyPointsToUse,
  payableAmount,
  previousDue,
  totalPayable,
  currentDue,
  vat,
  setVat,
  hasSetupCharge,
  handleToggleSetupCharge,
  totalSetupCharge,
  cameraCount,
  handleCameraCountChange,
  setupRatePerCamera,
  handleRateChange,
  setupCharge,
  handleDirectSetupChargeChange,
  hasExtraCost,
  setHasExtraCost,
  extraCost,
  setExtraCost,
  extraCostCategory,
  setExtraCostCategory,
  totalExtraCost,
  isTechnician,
  isReseller,
  isGroupDiscountActive,
  handleToggleGroupDiscount,
  groupDiscountAmount,
  setQuickPaid,

  // MultiTenderPaymentTable props
  tenders,
  updateTender,
  addTenderRow,
  acceptTender,
  cancelTender,
  cashAccounts,
  bankAccounts,
  mfsAccounts,
  walletAccounts,
  customerWalletBalance,
  customerWalletLabel,
}) {
  return (
    <div className="grid grid-cols-[minmax(260px,34%)_1fr] gap-2.5 items-start mb-2.5">
      {/* LEFT COLUMN: ADDITIONAL DETAILS */}
      <SalePaymentAdditionalDetails
        salesPerson={salesPerson}
        setSalesPerson={setSalesPerson}
        staffList={staffList}
        invoiceDate={invoiceDate}
        setInvoiceDate={setInvoiceDate}
        destination={destination}
        setDestination={setDestination}
        attention={attention}
        setAttention={setAttention}
      />

      {/* RIGHT COLUMN: PAYMENT & INVOICE CALCULATION */}
      <div className="bg-white border border-slate-200 rounded-md p-2 sm:px-3 sm:py-2">
        {/* PAYMENT HEADER BAR */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-1.5 mb-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
              PAYMENT DETAILS
            </span>
            <span className="text-xs text-slate-500">
              Paid: <strong className="text-slate-900">{taka(paid)}</strong>
            </span>
            {paid > totalPayable ? (
              <span
                className="text-amber-800 bg-amber-100 border border-amber-300 font-extrabold text-[0.72rem] py-0.5 px-2 rounded inline-flex items-center gap-1"
                title="Paid amount exceeds total payable"
              >
                ⚠️ Overpaid: +{taka(paid - totalPayable)}
              </span>
            ) : due === 0 && paid > 0 ? (
              <span className="text-emerald-600 font-bold text-xs inline-flex items-center gap-0.5">
                ✓ Paid
              </span>
            ) : paid > 0 && due > 0 ? (
              <span className="text-amber-600 font-bold text-[0.72rem] bg-amber-100 py-0.5 px-1.5 rounded">
                ⚠️ Due: {taka(due)}
              </span>
            ) : (
              <span className="text-rose-600 font-bold text-[0.72rem] bg-rose-100 py-0.5 px-1.5 rounded">
                Due: {taka(due)}
              </span>
            )}
          </div>
        </div>

        {/* 1. TWO-COLUMN ULTRA-COMPACT SUMMARY GRID */}
        <SalePaymentSummaryGrid
          netAmount={netAmount}
          loyaltyPointsToUse={loyaltyPointsToUse}
          discount={discount}
          totalDiscount={totalDiscount}
          payableAmount={payableAmount}
          previousDue={previousDue}
          totalPayable={totalPayable}
          currentDue={currentDue}
        />

        {/* Optional charges / Add-ons toolbar */}
        <SalePaymentAddonsToolbar
          vat={vat}
          setVat={setVat}
          hasSetupCharge={hasSetupCharge}
          handleToggleSetupCharge={handleToggleSetupCharge}
          totalSetupCharge={totalSetupCharge}
          cameraCount={cameraCount}
          handleCameraCountChange={handleCameraCountChange}
          setupRatePerCamera={setupRatePerCamera}
          handleRateChange={handleRateChange}
          setupCharge={setupCharge}
          handleDirectSetupChargeChange={handleDirectSetupChargeChange}
          hasExtraCost={hasExtraCost}
          setHasExtraCost={setHasExtraCost}
          extraCost={extraCost}
          setExtraCost={setExtraCost}
          extraCostCategory={extraCostCategory}
          setExtraCostCategory={setExtraCostCategory}
          totalExtraCost={totalExtraCost}
          isTechnician={isTechnician}
          isReseller={isReseller}
          isGroupDiscountActive={isGroupDiscountActive}
          handleToggleGroupDiscount={handleToggleGroupDiscount}
          groupDiscountAmount={groupDiscountAmount}
        />

        {/* Quick Pay Buttons */}
        <div className="flex justify-between items-center mb-1">
          <div className="flex gap-1.5 items-center">
            <span className="text-[0.68rem] font-bold text-slate-500 uppercase">
              Quick Settle:
            </span>
            <button
              type="button"
              onClick={() => setQuickPaid(totalPayable)}
              className="py-0.5 px-2 rounded border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-[0.70rem] font-bold text-emerald-800 cursor-pointer transition-colors"
            >
              Pay Full ({taka(totalPayable)})
            </button>
            <button
              type="button"
              onClick={() => setQuickPaid(0)}
              className="py-0.5 px-2 rounded border border-rose-200 bg-white hover:bg-rose-50 text-[0.70rem] font-bold text-rose-600 cursor-pointer transition-colors"
            >
              Full Due (৳0.00)
            </button>
          </div>
        </div>

        {/* 2. MULTI-TENDER PAYMENT DETAILS TABLE */}
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
          isPurchase={false}
          walletBalance={customerWalletBalance}
          walletAccountLabel={customerWalletLabel}
          remainingPayable={currentDue}
        />
      </div>
    </div>
  );
}
