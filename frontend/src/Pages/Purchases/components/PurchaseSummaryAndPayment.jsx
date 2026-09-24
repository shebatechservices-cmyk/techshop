import React from 'react';
import MultiTenderPaymentTable from '../../../components/shared/MultiTenderPaymentTable';
import { taka, EXTRA_COST_CATEGORIES } from '../hooks/usePurchaseCart';

export default function PurchaseSummaryAndPayment({
  hasExtraCost,
  setHasExtraCost,
  extraCost,
  setExtraCost,
  extraCostCategory,
  setExtraCostCategory,
  reference,
  setReference,
  extra = 0,
  netAmount = 0,
  discount = 0,
  setDiscount,
  payableAmount = 0,
  previousDue = 0,
  totalPayable = 0,
  currentDue = 0,
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
  error,
  items = [],
  totals = { units: 0, cost: 0, sale: 0 },
  totalCost = 0,
  paid = 0,
  remainingDue = 0,
  estimatedProfit = 0,
  handleClearForm,
  onClose,
  savePurchase,
  saving = false,
  orderToEdit = null,
}) {
  return (
    <>
      {/* Extra Costs with Categorized Options Recorded as Expenses */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 flex flex-col gap-2.5">
        <label
          className={`inline-flex items-center gap-2 cursor-pointer font-bold text-sm ${
            hasExtraCost ? 'text-orange-800' : 'text-slate-800'
          }`}
        >
          <input
            type="checkbox"
            checked={hasExtraCost}
            onChange={(e) => setHasExtraCost(e.target.checked)}
            className="w-4 h-4 cursor-pointer accent-orange-500"
          />
          <span>🚚 Logistics & Extra Cost (Recorded as Expense)</span>
        </label>

        {hasExtraCost && (
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1.2fr_1.6fr] gap-3">
            {/* Extra Cost Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Extra Cost ৳
              </label>
              <input
                type="number"
                step="any"
                value={extraCost}
                onChange={(e) => setExtraCost(e.target.value)}
                placeholder="0.00"
                className="w-full py-2 px-2.5 rounded-md border border-slate-300 text-sm box-border bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Extra Cost Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Expense Category
              </label>
              <select
                value={extraCostCategory}
                onChange={(e) => setExtraCostCategory(e.target.value)}
                className="w-full py-2 px-2.5 rounded-md border border-slate-300 text-sm bg-white box-border cursor-pointer focus:outline-none focus:border-emerald-500"
              >
                {EXTRA_COST_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Transaction Reference / Memo */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Transaction Reference / Note
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. Courier Challan #48291 / Memo"
                className="w-full py-2 px-2.5 rounded-md border border-slate-300 text-sm box-border bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* 1. TWO-COLUMN SUMMARY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
        {/* Left Column */}
        <div className="flex flex-col gap-2">
          <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-0.5">
            Purchase Order Calculation
          </div>

          {/* Net Amount (Subtotal) */}
          <div className="flex justify-between items-center py-2 px-3 bg-white border border-slate-200 rounded-md">
            <div>
              <label className="block text-xs font-bold text-slate-500">
                Net Amount (Subtotal)
              </label>
              {extra > 0 && (
                <div className="text-[0.66rem] text-orange-700">
                  Includes logistics: +{taka(extra)}
                </div>
              )}
            </div>
            <span className="font-extrabold text-sm text-slate-800">
              {taka(netAmount)}
            </span>
          </div>

          {/* Less Discount */}
          <div className="flex justify-between items-center py-1.5 px-3 bg-white border border-slate-200 rounded-md gap-2">
            <label className="text-xs font-bold text-rose-600 whitespace-nowrap">
              Less Discount
            </label>
            <div className="flex items-center gap-1 max-w-[140px]">
              <span className="text-sm text-rose-600 font-bold">-৳</span>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0.00"
                value={discount === '' ? '' : discount}
                onChange={(e) => {
                  const val = e.target.value;
                  setDiscount(val === '' ? '' : Math.max(0, parseFloat(val) || 0));
                }}
                className="w-full py-1 px-2 rounded border border-slate-300 text-sm font-bold text-rose-600 text-right outline-none focus:border-rose-400"
              />
            </div>
          </div>

          {/* Payable Amount (Net Amount - Discount) */}
          <div className="flex justify-between items-center py-2 px-3 bg-blue-50 border border-blue-200 rounded-md">
            <label className="text-xs font-extrabold text-blue-800 uppercase">
              Payable Amount
            </label>
            <span className="font-black text-base text-blue-700">
              {taka(payableAmount)}
            </span>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-2">
          <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-0.5">
            Supplier Balance Settlement
          </div>

          {/* Previous Due */}
          <div className="flex justify-between items-center py-2 px-3 bg-amber-50 border border-amber-200 rounded-md">
            <label className="text-xs font-bold text-amber-800">
              Previous Due
            </label>
            <span
              className={`font-extrabold text-sm ${
                previousDue > 0
                  ? 'text-amber-700'
                  : previousDue < 0
                  ? 'text-emerald-600'
                  : 'text-slate-600'
              }`}
            >
              {previousDue < 0
                ? `Advance: ${taka(Math.abs(previousDue))}`
                : taka(previousDue)}
            </span>
          </div>

          {/* Total Payable (Payable Amount + Previous Due) */}
          <div className="flex justify-between items-center py-2 px-3 bg-emerald-50 border border-emerald-200 rounded-md">
            <label className="text-xs font-extrabold text-emerald-900 uppercase">
              Total Payable
            </label>
            <span className="font-black text-base text-emerald-700">
              {taka(totalPayable)}
            </span>
          </div>

          {/* Current Due (Total Payable - Sum of all accepted payment amounts) */}
          <div
            className={`flex justify-between items-center py-2 px-3 rounded-md border ${
              currentDue > 0
                ? 'bg-rose-50 border-rose-200'
                : 'bg-emerald-50 border-emerald-200'
            }`}
          >
            <label
              className={`text-xs font-extrabold uppercase ${
                currentDue > 0 ? 'text-rose-800' : 'text-emerald-800'
              }`}
            >
              Current Due
            </label>
            <span
              className={`font-black text-base ${
                currentDue > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {taka(currentDue)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Section with Quick Pay and Multi-Tender Table */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
        {/* Quick Settle Toolbar */}
        <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
          <div className="flex gap-2 items-center">
            <span className="text-xs font-bold text-slate-500 uppercase">
              Quick Settle:
            </span>
            <button
              type="button"
              onClick={handlePayFull}
              className="py-1 px-2.5 rounded border border-emerald-300 bg-emerald-50 text-xs font-bold text-emerald-800 cursor-pointer hover:bg-emerald-100 transition-colors"
            >
              Pay Full ({taka(totalPayable)})
            </button>
            <button
              type="button"
              onClick={handleFullDue}
              className="py-1 px-2.5 rounded border border-rose-200 bg-white text-xs font-bold text-rose-600 cursor-pointer hover:bg-rose-50 transition-colors"
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
          isPurchase={true}
          walletBalance={supplierWallet}
          walletAccountLabel={supplierWalletLabel}
          remainingPayable={currentDue}
        />
      </div>

      {error && (
        <div className="p-2.5 px-3.5 rounded-lg bg-rose-50 text-rose-600 text-sm">
          {error}
        </div>
      )}

      {/* Footer Summary Bar */}
      <footer className="border-t border-slate-100 py-3.5 px-6 bg-white flex justify-between items-center flex-wrap gap-4 mt-2">
        {/* Left White Summary Card */}
        <div className="border border-slate-200 rounded-lg py-2 px-4 flex gap-4 text-xs text-slate-600 bg-slate-50 items-center flex-wrap">
          <div>
            Items: <strong className="text-slate-900">{items.length}</strong>
          </div>
          <div>
            Units: <strong className="text-slate-900">{totals.units}</strong>
          </div>
          <div>
            Total Cost: <strong className="text-sky-600">{taka(totalCost)}</strong>
          </div>
          <div>
            Paid: <strong className="text-emerald-600">{taka(paid)}</strong>
          </div>
          <div>
            Due:{' '}
            <strong
              className={remainingDue > 0 ? 'text-rose-600' : 'text-emerald-600'}
            >
              {remainingDue > 0 ? taka(remainingDue) : 'No Due'}
            </strong>
          </div>
          <div>
            Est. Profit: <strong className="text-emerald-600">{taka(estimatedProfit)}</strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 items-center">
          <button
            type="button"
            onClick={handleClearForm}
            className="py-2 px-4 rounded-lg border border-slate-300 bg-white text-rose-600 text-sm font-semibold cursor-pointer inline-flex items-center gap-1.5 hover:bg-rose-50 transition-all duration-150"
          >
            🗑️ Clear Form
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-lg border border-slate-300 bg-white text-slate-600 text-sm font-semibold cursor-pointer hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => savePurchase(true)}
            disabled={saving}
            className="py-2 px-6 rounded-lg border-0 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-bold cursor-pointer shadow-md transition-colors"
          >
            {saving
              ? 'Saving...'
              : orderToEdit && orderToEdit.id
              ? '✓ Edit Save & Preview'
              : '✓ Save & Preview'}
          </button>
        </div>
      </footer>
    </>
  );
}
