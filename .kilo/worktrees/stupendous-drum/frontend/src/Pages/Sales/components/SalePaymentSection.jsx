import React from 'react';
import MultiTenderPaymentTable from '../../../components/shared/MultiTenderPaymentTable';
import { EXTRA_COST_CATEGORIES } from '../../Purchases/hooks/usePurchaseCart';
import { taka, money } from '../hooks/useNewSale';

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
      <div className="bg-white border border-slate-200 rounded-md p-2 sm:px-3 sm:py-2">
        <div className="text-[0.72rem] font-extrabold text-slate-700 uppercase tracking-wide mb-2">
          ADDITIONAL DETAILS
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* SALES PERSON */}
          <div>
            <label className="block text-[0.66rem] font-bold text-slate-500 uppercase mb-0.5">
              SALES PERSON
            </label>
            <select
              value={salesPerson}
              onChange={(e) => setSalesPerson(e.target.value)}
              className="w-full h-7 py-0.5 px-1.5 rounded border border-slate-300 text-xs text-slate-800 bg-white outline-none box-border"
            >
              <option value="">-- Select --</option>
              {staffList.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* INVOICE DATE */}
          <div>
            <label className="block text-[0.66rem] font-bold text-slate-500 uppercase mb-0.5">
              INVOICE DATE
            </label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full h-7 py-0.5 px-1.5 rounded border border-slate-300 text-xs text-slate-800 bg-white outline-none box-border"
            />
          </div>

          {/* DESTINATION */}
          <div>
            <label className="block text-[0.66rem] font-bold text-slate-500 uppercase mb-0.5">
              DESTINATION
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Destination..."
              className="w-full h-7 py-0.5 px-1.5 rounded border border-slate-300 text-xs text-slate-800 bg-white outline-none box-border"
            />
          </div>

          {/* ATTENTION */}
          <div>
            <label className="block text-[0.66rem] font-bold text-slate-500 uppercase mb-0.5">
              ATTENTION
            </label>
            <input
              type="text"
              value={attention}
              onChange={(e) => setAttention(e.target.value)}
              placeholder="Attention..."
              className="w-full h-7 py-0.5 px-1.5 rounded border border-slate-300 text-xs text-slate-800 bg-white outline-none box-border"
            />
          </div>
        </div>
      </div>

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
            {due === 0 && paid > 0 ? (
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
        <div className="grid grid-cols-2 gap-2 mb-1.5 bg-slate-50 p-1.5 sm:p-2 rounded-md border border-slate-200">
          {/* Left Column: Invoice Calculation */}
          <div className="flex flex-col gap-1">
            <div className="text-[0.66rem] font-extrabold text-slate-600 uppercase tracking-wide">
              Invoice Calculation
            </div>

            {/* Net Amount (Subtotal) */}
            <div className="flex justify-between items-center py-1 px-2 bg-white border border-slate-200 rounded min-h-[26px]">
              <label className="text-[0.68rem] font-bold text-slate-500">
                Net Amount
              </label>
              <span className="font-extrabold text-xs text-slate-800">
                {taka(netAmount)}
              </span>
            </div>

            {/* Less Discount */}
            <div className="flex justify-between items-center py-0.5 px-2 bg-white border border-slate-200 rounded gap-1.5 min-h-[26px]">
              <div className="flex items-center gap-1">
                <label className="text-[0.68rem] font-bold text-rose-600 m-0">
                  Less Disc.
                </label>
                {money(loyaltyPointsToUse) > 0 && (
                  <span className="text-[0.60rem] text-slate-500">
                    ({taka(loyaltyPointsToUse)})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-0.5 max-w-[110px]">
                <span className="text-xs text-rose-600 font-bold">-৳</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={discount === '' ? '' : discount}
                  onChange={(e) => {
                    setDiscountTouched(true);
                    const val = e.target.value;
                    setDiscount(val === '' ? '' : Math.max(0, parseFloat(val) || 0));
                  }}
                  className={`w-full h-6 py-0.5 px-1.5 rounded text-xs font-bold text-rose-600 text-right outline-none box-border ${
                    isGroupDiscountActive ? 'border-[1.5px] border-indigo-500 bg-indigo-50' : 'border border-slate-300 bg-white'
                  }`}
                />
              </div>
            </div>

            {/* Payable Amount (Net Amount - Discount) */}
            <div className="flex justify-between items-center py-1 px-2 bg-blue-50 border border-blue-200 rounded min-h-[26px]">
              <label className="text-[0.70rem] font-extrabold text-blue-800 uppercase">
                Payable
              </label>
              <span className="font-black text-xs text-blue-700">
                {taka(payableAmount)}
              </span>
            </div>
          </div>

          {/* Right Column: Balance Settlement */}
          <div className="flex flex-col gap-1">
            <div className="text-[0.66rem] font-extrabold text-slate-600 uppercase tracking-wide">
              Balance Settlement
            </div>

            {/* Previous Due */}
            <div className="flex justify-between items-center py-1 px-2 bg-amber-50 border border-amber-200 rounded min-h-[26px]">
              <label className="text-[0.68rem] font-bold text-amber-800">
                Prev. Due
              </label>
              <span className={`font-extrabold text-xs ${previousDue > 0 ? 'text-amber-700' : previousDue < 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                {previousDue < 0 ? `Adv: ${taka(Math.abs(previousDue))}` : taka(previousDue)}
              </span>
            </div>

            {/* Total Payable (Payable Amount + Previous Due) */}
            <div className="flex justify-between items-center py-1 px-2 bg-emerald-50 border border-emerald-200 rounded min-h-[26px]">
              <label className="text-[0.70rem] font-extrabold text-emerald-800 uppercase">
                Total Payable
              </label>
              <span className="font-black text-xs text-emerald-700">
                {taka(totalPayable)}
              </span>
            </div>

            {/* Current Due (Total Payable - Sum of all accepted payment amounts) */}
            <div
              className={`flex justify-between items-center py-1 px-2 rounded min-h-[26px] border ${
                currentDue > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'
              }`}
            >
              <label className={`text-[0.70rem] font-extrabold uppercase ${currentDue > 0 ? 'text-rose-800' : 'text-emerald-800'}`}>
                Current Due
              </label>
              <span className={`font-black text-xs ${currentDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {taka(currentDue)}
              </span>
            </div>
          </div>
        </div>

        {/* Optional charges / Add-ons toolbar (VAT, Setup, Logistics, Privilege discount) */}
        <div className="flex items-center gap-2 flex-wrap py-1 px-2 bg-white border border-slate-200 rounded-md mb-1.5 text-xs">
          <label className="inline-flex items-center gap-1 cursor-pointer font-semibold text-slate-600">
            <span>VAT (৳):</span>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="0.00"
              value={vat || ''}
              onChange={(e) => setVat(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-16 h-6 py-0.5 px-1.5 rounded border border-slate-300 text-xs box-border"
            />
          </label>

          <label className={`inline-flex items-center gap-1 cursor-pointer font-semibold ${hasSetupCharge ? 'text-emerald-700' : 'text-slate-600'}`}>
            <input
              type="checkbox"
              checked={hasSetupCharge}
              onChange={(e) => handleToggleSetupCharge(e.target.checked)}
              className="accent-emerald-600"
            />
            <span>🛠️ Setup ({taka(totalSetupCharge)})</span>
          </label>

          <label className={`inline-flex items-center gap-1 cursor-pointer font-semibold ${hasExtraCost ? 'text-orange-700' : 'text-slate-600'}`}>
            <input
              type="checkbox"
              checked={hasExtraCost}
              onChange={(e) => setHasExtraCost(e.target.checked)}
              className="accent-orange-600"
            />
            <span>🚚 Logistics ({taka(totalExtraCost)})</span>
          </label>

          {(isTechnician || isReseller) && (
            <button
              type="button"
              onClick={handleToggleGroupDiscount}
              className={`ml-auto py-0.5 px-2 rounded border-0 text-white font-bold text-[0.70rem] cursor-pointer transition-colors ${
                isGroupDiscountActive ? 'bg-indigo-700' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isGroupDiscountActive ? '✓ 5% Privilege Applied' : `⚡ Apply 5% Privilege (${taka(groupDiscountAmount)})`}
            </button>
          )}
        </div>

        {/* Collapsible Setup charge details if enabled */}
        {hasSetupCharge && (
          <div className="mb-1.5 bg-emerald-50 border border-emerald-300 rounded p-1.5 grid grid-cols-3 gap-1.5">
            <div>
              <label className="block text-[0.62rem] font-bold text-emerald-800 mb-0.5">Camera Qty</label>
              <input
                type="number"
                min="1"
                value={cameraCount}
                onChange={(e) => handleCameraCountChange(e.target.value)}
                className="w-full h-6 py-0.5 px-1 rounded border border-emerald-300 bg-white text-xs box-border"
              />
            </div>
            <div>
              <label className="block text-[0.62rem] font-bold text-emerald-800 mb-0.5">Rate / Cam (৳)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={setupRatePerCamera}
                onChange={(e) => handleRateChange(e.target.value)}
                className="w-full h-6 py-0.5 px-1 rounded border border-emerald-300 bg-white text-xs box-border"
              />
            </div>
            <div>
              <label className="block text-[0.62rem] font-bold text-emerald-800 mb-0.5">Setup Charge (৳)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={setupCharge}
                onChange={(e) => handleDirectSetupChargeChange(e.target.value)}
                className="w-full h-6 py-0.5 px-1 rounded border-[1.5px] border-emerald-600 bg-white text-xs font-extrabold text-emerald-700 box-border"
              />
            </div>
          </div>
        )}

        {/* Collapsible Extra Cost details if enabled */}
        {hasExtraCost && (
          <div className="mb-1.5 bg-orange-50 border border-orange-300 rounded p-1.5 grid grid-cols-[1fr_1.4fr] gap-1.5">
            <div>
              <label className="block text-[0.62rem] font-bold text-orange-900 mb-0.5">Extra Cost (৳)</label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0.00"
                value={extraCost || ''}
                onChange={(e) => setExtraCost(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full h-6 py-0.5 px-1 rounded border border-orange-300 bg-white text-xs font-bold text-orange-900 box-border"
              />
            </div>
            <div>
              <label className="block text-[0.62rem] font-bold text-orange-900 mb-0.5">Category</label>
              <select
                value={extraCostCategory}
                onChange={(e) => setExtraCostCategory(e.target.value)}
                className="w-full h-6 py-0.5 px-1 rounded border border-orange-300 bg-white text-xs box-border"
              >
                {EXTRA_COST_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        )}

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
