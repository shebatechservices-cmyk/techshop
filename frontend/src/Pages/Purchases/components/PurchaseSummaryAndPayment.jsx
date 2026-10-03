import React from 'react';
import PurchaseLogisticsSection from './summary/PurchaseLogisticsSection';
import PurchaseCalculationGrid from './summary/PurchaseCalculationGrid';
import PurchasePaymentSection from './summary/PurchasePaymentSection';
import PurchaseFooterActionBar from './summary/PurchaseFooterActionBar';

export default function PurchaseSummaryAndPayment({
  hasExtraCost,
  setHasExtraCost,
  extraCost,
  setExtraCost,
  extraCostCategory,
  setExtraCostCategory,
  extraCostNotes = '',
  setExtraCostNotes,
  reference,
  setReference,
  extra = 0,
  itemsSubtotal = 0,
  totalLandedCost = 0,
  netAmount = 0,
  discount = 0,
  setDiscount,
  payableAmount = 0,
  previousDue = 0,
  totalPayable = 0,
  currentDue = 0,
  handlePayFull,
  handlePayOrder,
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
      {/* 1. Logistics and Landing Extra Costs */}
      <PurchaseLogisticsSection
        hasExtraCost={hasExtraCost}
        setHasExtraCost={setHasExtraCost}
        extraCost={extraCost}
        setExtraCost={setExtraCost}
        extraCostCategory={extraCostCategory}
        setExtraCostCategory={setExtraCostCategory}
        extraCostNotes={extraCostNotes}
        setExtraCostNotes={setExtraCostNotes}
      />

      {/* 2. Order Calculation and Supplier Balance Settlement */}
      <PurchaseCalculationGrid
        itemsSubtotal={itemsSubtotal}
        totals={totals}
        netAmount={netAmount}
        discount={discount}
        setDiscount={setDiscount}
        payableAmount={payableAmount}
        extra={extra}
        totalLandedCost={totalLandedCost}
        previousDue={previousDue}
        totalPayable={totalPayable}
        currentDue={currentDue}
      />

      {/* 3. Multi-Tender Payment and Quick Settle */}
      <PurchasePaymentSection
        previousDue={previousDue}
        payableAmount={payableAmount}
        totalPayable={totalPayable}
        currentDue={currentDue}
        handlePayOrder={handlePayOrder}
        handlePayFull={handlePayFull}
        handleFullDue={handleFullDue}
        tenders={tenders}
        updateTender={updateTender}
        addTenderRow={addTenderRow}
        acceptTender={acceptTender}
        cancelTender={cancelTender}
        cashAccounts={cashAccounts}
        bankAccounts={bankAccounts}
        mfsAccounts={mfsAccounts}
        walletAccounts={walletAccounts}
        supplierWallet={supplierWallet}
        supplierWalletLabel={supplierWalletLabel}
      />

      {error && (
        <div className="p-2.5 px-3.5 rounded-lg bg-rose-50 text-rose-600 text-sm">
          {error}
        </div>
      )}

      {/* 4. Footer Summary Bar and Action Buttons */}
      <PurchaseFooterActionBar
        items={items}
        totals={totals}
        totalCost={totalCost}
        paid={paid}
        remainingDue={remainingDue}
        estimatedProfit={estimatedProfit}
        handleClearForm={handleClearForm}
        onClose={onClose}
        savePurchase={savePurchase}
        saving={saving}
        orderToEdit={orderToEdit}
      />
    </>
  );
}
