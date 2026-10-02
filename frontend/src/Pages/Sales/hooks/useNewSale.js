import { useState, useEffect } from 'react';
import useSaleItemCart from './useSaleItemCart';
import useSalePricingAndCharges, { money } from './useSalePricingAndCharges';
import useSaleTendersState, { newTender } from './useSaleTendersState';
import useSaleCustomerSummary from './cart/useSaleCustomerSummary';
import useSaleDraft from './cart/useSaleDraft';
import useSaleEditHydration from './cart/useSaleEditHydration';
import useSaleSaveAndPrint, { taka } from './cart/useSaleSaveAndPrint';

export { money };
export { newTender };
export { taka };

/**
 * Top-level Orchestrator Hook for POS & Sale Invoicing
 * Composed from focused single-responsibility sub-hooks:
 * - useSaleItemCart: Item catalog, scan, barcodes, UOM conversions
 * - useSalePricingAndCharges: Math, tax, setup, extra costs, tier pricing
 * - useSaleTendersState: Multi-tender ledger, balance tracking
 * - useSaleCustomerSummary: Customer search, ledgers, staff directory
 * - useSaleDraft: Local draft preservation & recovery
 * - useSaleEditHydration: Loading existing sales in edit mode
 * - useSaleSaveAndPrint: Validation, submission, print preview, reset
 */
export function useNewSale({
  isOpen,
  onClose,
  customers = [],
  products = [],
  newlyCreatedCustomer,
  onOpenAddCustomer,
  onSaleCreated,
  editSale = null,
  onSaleUpdated = null,
}) {
  // 1. Customer & Staff Sub-hook
  const customerSub = useSaleCustomerSummary({ newlyCreatedCustomer });
  const {
    customerId,
    setCustomerId,
    customerSummary,
    setCustomerSummary,
    customerSearch,
    setCustomerSearch,
    isCustomerOpen,
    setIsCustomerOpen,
    loadingSummary,
    staffList,
    customerSelectRef,
  } = customerSub;

  // 2. Invoice Meta Fields
  const [salesPerson, setSalesPerson] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [destination, setDestination] = useState('');
  const [attention, setAttention] = useState('');

  // 3. Cart Management Sub-hook
  const [errorBridge, setErrorBridge] = useState('');
  const cart = useSaleItemCart({
    products,
    setError: (msg) => setErrorBridge(msg),
  });

  const {
    items,
    setItems,
    expandedId,
    setExpandedId,
    activeCostCardId,
    setActiveCostCardId,
    searchQuery,
    setSearchQuery,
    isSearchOpen,
    setIsSearchOpen,
    searchError,
    setSearchError,
    barcodeInput,
    setBarcodeInput,
    barcodeError,
    setBarcodeError,
    searchContainerRef,
    searchInputRef,
    barcodeInputRef,
    filteredProducts,
    toggleCostCard,
    addProduct,
    switchItemUnit,
    updateItem,
    removeItem,
    handleScanEnter,
    handleAddBarcode,
    handleRemoveBarcode,
  } = cart;

  // 4. Pricing & Financial Computations Sub-hook
  const pricing = useSalePricingAndCharges({
    items,
    customerId,
    customers,
    customerSummary,
    editSale,
  });

  const {
    discount,
    setDiscount,
    discountTouched,
    setDiscountTouched,
    vat,
    setVat,
    hasSetupCharge,
    setHasSetupCharge,
    cameraCount,
    setCameraCount,
    setupRatePerCamera,
    setSetupRatePerCamera,
    setupCharge,
    setSetupCharge,
    hasExtraCost,
    setHasExtraCost,
    extraCost,
    setExtraCost,
    extraCostCategory,
    setExtraCostCategory,
    extraCostNotes,
    setExtraCostNotes,
    loyaltyPointsToUse,
    setLoyaltyPointsToUse,
    detectedCameraCount,
    subtotal,
    perItemDiscount,
    totalDiscount,
    totalVat,
    totalSetupCharge,
    totalExtraCost,
    netAmount,
    currentSaleTotal,
    payableAmount,
    selectedCustomer,
    previousDue,
    totalPayable,
    customerWalletBalance,
    customerWalletLabel,
    customerTypeRaw,
    isTechnician,
    isReseller,
    isGroupCustomer,
    groupDiscountAmount,
    isGroupDiscountActive,
    handleToggleSetupCharge,
    handleCameraCountChange,
    handleRateChange,
    handleDirectSetupChargeChange,
    handleToggleGroupDiscount,
  } = pricing;

  // 5. Payment Tenders Sub-hook
  const tendersState = useSaleTendersState({
    isOpen,
    totalPayable,
    editSale,
    itemsCount: items.length,
  });

  const {
    tenders,
    setTenders,
    hasUserEditedPaid,
    setHasUserEditedPaid,
    paymentConfirmed,
    setPaymentConfirmed,
    walletAccounts,
    cashAccounts,
    bankAccounts,
    mfsAccounts,
    paid,
    currentDue,
    due,
    updateTender,
    removeTender,
    addTenderRow,
    acceptTender,
    cancelTender,
    setQuickPaid,
  } = tendersState;

  // 6. Draft Recovery & Auto-Save Sub-hook
  const draftSub = useSaleDraft({
    isOpen,
    editSale,
    draftData: {
      customerId,
      items,
      discount,
      discountTouched,
      vat,
      hasSetupCharge,
      cameraCount,
      setupRatePerCamera,
      setupCharge,
      hasExtraCost,
      extraCost,
      extraCostCategory,
      extraCostNotes,
      loyaltyPointsToUse,
      tenders,
      salesPerson,
      invoiceDate,
      destination,
      attention,
    },
    handlers: {
      setCustomerId,
      setItems,
      setDiscount,
      setDiscountTouched,
      setVat,
      setHasSetupCharge,
      setCameraCount,
      setSetupRatePerCamera,
      setSetupCharge,
      setHasExtraCost,
      setExtraCost,
      setExtraCostCategory,
      setExtraCostNotes,
      setLoyaltyPointsToUse,
      setTenders,
      setSalesPerson,
      setInvoiceDate,
      setDestination,
      setAttention,
    },
  });

  const {
    recoveredDraft,
    handleRestoreDraft,
    handleDiscardDraft,
    clearSaleDraft,
  } = draftSub;

  // 7. Save, Validation, Preview & Reset Sub-hook
  const saveAndPrintSub = useSaleSaveAndPrint({
    editSale,
    onSaleCreated,
    onSaleUpdated,
    clearSaleDraft,
    formValues: {
      customerId,
      items,
      subtotal,
      totalDiscount,
      totalVat,
      totalSetupCharge,
      totalExtraCost,
      currentSaleTotal,
      totalPayable,
      hasExtraCost,
      extraCostCategory,
      extraCostNotes,
      loyaltyPointsToUse,
      salesPerson,
      destination,
      attention,
      invoiceDate,
      selectedCustomer,
      paid,
      due,
      tenders,
    },
    handlers: {
      setCustomerId,
      setCustomerSummary,
      setItems,
      setExpandedId,
      setDiscount,
      setDiscountTouched,
      setVat,
      setHasSetupCharge,
      setSetupCharge,
      setHasExtraCost,
      setExtraCost,
      setExtraCostNotes,
      setLoyaltyPointsToUse,
      setDestination,
      setAttention,
      setSearchQuery,
      setBarcodeInput,
      setTenders,
      setHasUserEditedPaid,
      setPaymentConfirmed,
    },
  });

  const {
    popupMsg,
    setPopupMsg,
    error,
    setError,
    saving,
    printSale,
    setPrintSale,
    isPrintOpen,
    setIsPrintOpen,
    isPrintPreviewOnly,
    setIsPrintPreviewOnly,
    handleClearForm,
    handleOpenPrintPreview,
    handlePreviewRecentSale,
    handleSaveSale,
  } = saveAndPrintSub;

  // Sync error from cart to saveAndPrint error state
  useEffect(() => {
    if (errorBridge) {
      setError(errorBridge);
      setErrorBridge('');
    }
  }, [errorBridge, setError]);

  // 8. Edit Hydration Sub-hook
  useSaleEditHydration({
    isOpen,
    editSale,
    products,
    handlers: {
      setPaymentConfirmed,
      setPopupMsg,
      setCustomerId,
      setError,
      setItems,
      setDiscount,
      setDiscountTouched,
      setVat,
      setLoyaltyPointsToUse,
      setHasSetupCharge,
      setSetupCharge,
      setSetupRatePerCamera,
      setHasExtraCost,
      setExtraCost,
      setExtraCostCategory,
      setExtraCostNotes,
      setSalesPerson,
      setDestination,
      setAttention,
      setInvoiceDate,
      setTenders,
      setHasUserEditedPaid,
    },
  });

  // Autofocus product search input on modal open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, searchInputRef]);

  return {
    // States
    customerId,
    setCustomerId,
    customerSummary,
    items,
    setItems,
    expandedId,
    setExpandedId,
    searchQuery,
    setSearchQuery,
    isSearchOpen,
    setIsSearchOpen,
    searchError,
    setSearchError,
    barcodeInput,
    setBarcodeInput,
    barcodeError,
    setBarcodeError,
    discount,
    setDiscount,
    discountTouched,
    setDiscountTouched,
    vat,
    setVat,
    hasSetupCharge,
    setHasSetupCharge,
    cameraCount,
    setCameraCount,
    setupRatePerCamera,
    setSetupRatePerCamera,
    setupCharge,
    setSetupCharge,
    hasExtraCost,
    setHasExtraCost,
    extraCost,
    setExtraCost,
    extraCostCategory,
    setExtraCostCategory,
    extraCostNotes,
    setExtraCostNotes,
    loyaltyPointsToUse,
    setLoyaltyPointsToUse,
    tenders,
    setTenders,
    hasUserEditedPaid,
    setHasUserEditedPaid,
    paymentConfirmed,
    setPaymentConfirmed,
    walletAccounts,
    customerSearch,
    setCustomerSearch,
    isCustomerOpen,
    setIsCustomerOpen,
    popupMsg,
    setPopupMsg,
    salesPerson,
    setSalesPerson,
    invoiceDate,
    setInvoiceDate,
    destination,
    setDestination,
    attention,
    setAttention,
    staffList,
    saving,
    error,
    setError,
    printSale,
    setPrintSale,
    isPrintOpen,
    setIsPrintOpen,
    isPrintPreviewOnly,
    setIsPrintPreviewOnly,
    loadingSummary,
    recoveredDraft,
    activeCostCardId,
    setActiveCostCardId,

    // Refs
    searchContainerRef,
    searchInputRef,
    barcodeInputRef,
    customerSelectRef,

    // Computed / Memos
    cashAccounts,
    bankAccounts,
    mfsAccounts,
    filteredProducts,
    detectedCameraCount,
    subtotal,
    perItemDiscount,
    totalDiscount,
    totalVat,
    totalSetupCharge,
    totalExtraCost,
    netAmount,
    currentSaleTotal,
    payableAmount,
    selectedCustomer,
    previousDue,
    totalPayable,
    customerWalletBalance,
    customerWalletLabel,
    paid,
    currentDue,
    due,
    customerTypeRaw,
    isTechnician,
    isReseller,
    isGroupCustomer,
    groupDiscountAmount,
    isGroupDiscountActive,

    // Handlers
    toggleCostCard,
    handleRestoreDraft,
    handleDiscardDraft,
    addProduct,
    switchItemUnit,
    updateItem,
    removeItem,
    handleScanEnter,
    handleAddBarcode,
    handleRemoveBarcode,
    handleToggleSetupCharge,
    handleCameraCountChange,
    handleRateChange,
    handleDirectSetupChargeChange,
    handleToggleGroupDiscount,
    updateTender,
    removeTender,
    addTenderRow,
    acceptTender,
    cancelTender,
    setQuickPaid,
    handleClearForm,
    handleOpenPrintPreview,
    handlePreviewRecentSale,
    handleSaveSale,
  };
}

export default useNewSale;
