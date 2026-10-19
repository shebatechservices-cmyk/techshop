import React from 'react';
import NewSaleItemsSection from './NewSaleItemsSection';
import SalePaymentSection from '../../components/SalePaymentSection';

export default function NewSaleFormBody({
  saleState,
  localCustomers,
  onOpenAddCustomer,
  setIsAddCustomerOpen,
  autoFocusEnabled,
}) {
  const {
    salesPerson,
    setSalesPerson,
    staffList,
    invoiceDate,
    setInvoiceDate,
    destination,
    setDestination,
    attention,
    setAttention,
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
  } = saleState;

  return (
    <div className="p-5 sm:p-6 overflow-y-auto">
      {/* Upper Items, Customer & Barcode Search Section */}
      <NewSaleItemsSection
        saleState={saleState}
        localCustomers={localCustomers}
        onOpenAddCustomer={onOpenAddCustomer}
        setIsAddCustomerOpen={setIsAddCustomerOpen}
        autoFocusEnabled={autoFocusEnabled}
      />

      {/* Two-Column Lower Section: ADDITIONAL DETAILS + PAYMENT */}
      <SalePaymentSection
        salesPerson={salesPerson}
        setSalesPerson={setSalesPerson}
        staffList={staffList}
        invoiceDate={invoiceDate}
        setInvoiceDate={setInvoiceDate}
        destination={destination}
        setDestination={setDestination}
        attention={attention}
        setAttention={setAttention}
        paid={paid}
        due={due}
        netAmount={netAmount}
        discount={discount}
        totalDiscount={totalDiscount}
        setDiscount={setDiscount}
        setDiscountTouched={setDiscountTouched}
        loyaltyPointsToUse={loyaltyPointsToUse}
        payableAmount={payableAmount}
        previousDue={previousDue}
        totalPayable={totalPayable}
        currentDue={currentDue}
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
        setQuickPaid={setQuickPaid}
        tenders={tenders}
        updateTender={updateTender}
        addTenderRow={addTenderRow}
        acceptTender={acceptTender}
        cancelTender={cancelTender}
        cashAccounts={cashAccounts}
        bankAccounts={bankAccounts}
        mfsAccounts={mfsAccounts}
        walletAccounts={walletAccounts}
        customerWalletBalance={customerWalletBalance}
        customerWalletLabel={customerWalletLabel}
      />
    </div>
  );
}
