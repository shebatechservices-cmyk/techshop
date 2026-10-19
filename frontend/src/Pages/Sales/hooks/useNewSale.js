import { useState, useEffect } from 'react';
import useSaleItemCart from './useSaleItemCart';
import useSalePricingAndCharges, { money } from './useSalePricingAndCharges';
import useSaleTendersState, { newTender } from './useSaleTendersState';
import useSaleCustomerSummary from './cart/useSaleCustomerSummary';
import useSalePersistence from './cart/useSalePersistence';
import useSaleSaveAndPrint, { taka } from './cart/useSaleSaveAndPrint';
import useSaleInvoiceMeta from './cart/useSaleInvoiceMeta';

export { money };
export { newTender };
export { taka };

/**
 * Top-level Orchestrator Hook for POS & Sale Invoicing
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
  const { customerId, setCustomerId, customerSummary, setCustomerSummary } = customerSub;

  // 2. Cart Management Sub-hook
  const [errorBridge, setErrorBridge] = useState('');
  const cart = useSaleItemCart({
    products,
    setError: (msg) => setErrorBridge(msg),
  });
  const { items, setItems, setExpandedId, setSearchQuery, setBarcodeInput } = cart;

  // 3. Invoice Meta Fields & Auto-focus
  const invoiceMeta = useSaleInvoiceMeta(isOpen, cart.searchInputRef);
  const { salesPerson, setSalesPerson, invoiceDate, setInvoiceDate, destination, setDestination, attention, setAttention } = invoiceMeta;

  // 4. Pricing & Financial Computations Sub-hook
  const pricing = useSalePricingAndCharges({
    items,
    customerId,
    customers,
    customerSummary,
    editSale,
    setItems,
  });
  const {
    discount, setDiscount, discountTouched, setDiscountTouched,
    vat, setVat, hasSetupCharge, setHasSetupCharge,
    cameraCount, setCameraCount, setupRatePerCamera, setSetupRatePerCamera,
    setupCharge, setSetupCharge, hasExtraCost, setHasExtraCost,
    extraCost, setExtraCost, extraCostCategory, setExtraCostCategory,
    extraCostNotes, setExtraCostNotes, loyaltyPointsToUse, setLoyaltyPointsToUse,
    subtotal, totalDiscount, totalVat, totalSetupCharge, totalExtraCost,
    currentSaleTotal, totalPayable, selectedCustomer,
  } = pricing;

  // 5. Payment Tenders Sub-hook
  const tendersState = useSaleTendersState({
    isOpen,
    totalPayable,
    editSale,
    itemsCount: items.length,
  });
  const {
    tenders, setTenders, paid, due,
    hasUserEditedPaid, setHasUserEditedPaid,
    setPaymentConfirmed,
  } = tendersState;

  // Shared form handlers
  const [error, setError] = useState('');
  const [popupMsg, setPopupMsg] = useState(null);

  const sharedHandlers = {
    setCustomerId, setCustomerSummary, setItems, setExpandedId,
    setDiscount, setDiscountTouched, setVat, setLoyaltyPointsToUse,
    setHasSetupCharge, setSetupCharge, setSetupRatePerCamera, setCameraCount,
    setHasExtraCost, setExtraCost, setExtraCostCategory, setExtraCostNotes,
    setSalesPerson, setDestination, setAttention, setInvoiceDate,
    setSearchQuery, setBarcodeInput, setTenders,
    setHasUserEditedPaid, setPaymentConfirmed, setError, setPopupMsg,
  };

  // 6 & 8. Draft Recovery & Edit Hydration Sub-hooks
  const draftSub = useSalePersistence({
    isOpen,
    editSale,
    products,
    draftData: {
      customerId, items, discount, discountTouched, vat,
      hasSetupCharge, cameraCount, setupRatePerCamera, setupCharge,
      hasExtraCost, extraCost, extraCostCategory, extraCostNotes,
      loyaltyPointsToUse, tenders, salesPerson, invoiceDate, destination, attention,
    },
    handlers: sharedHandlers,
  });

  // 7. Save, Validation, Preview & Reset Sub-hook
  const saveAndPrintSub = useSaleSaveAndPrint({
    editSale,
    onSaleCreated,
    onSaleUpdated,
    clearSaleDraft: draftSub.clearSaleDraft,
    formValues: {
      customerId, items, subtotal, totalDiscount, totalVat,
      totalSetupCharge, totalExtraCost, currentSaleTotal, totalPayable,
      hasExtraCost, extraCostCategory, extraCostNotes, loyaltyPointsToUse,
      salesPerson, destination, attention, invoiceDate, selectedCustomer,
      paid, due, tenders,
    },
    handlers: sharedHandlers,
  });

  // Sync error from cart to saveAndPrint error state
  useEffect(() => {
    if (errorBridge) {
      saveAndPrintSub.setError(errorBridge);
      setErrorBridge('');
    }
  }, [errorBridge, saveAndPrintSub.setError]);

  return {
    ...customerSub,
    ...cart,
    ...pricing,
    ...tendersState,
    ...draftSub,
    ...saveAndPrintSub,
    salesPerson,
    setSalesPerson,
    invoiceDate,
    setInvoiceDate,
    destination,
    setDestination,
    attention,
    setAttention,
  };
}

export default useNewSale;
