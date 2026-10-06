import { useState, useRef } from 'react';
import { usePurchaseInitialData } from './cart/usePurchaseInitialData';
import { usePurchaseLandingCosts } from './cart/usePurchaseLandingCosts';
import { usePurchaseItems } from './cart/usePurchaseItems';
import { usePurchaseBarcodeScanner } from './cart/usePurchaseBarcodeScanner';
import { usePurchasePricingAndPayment } from './cart/usePurchasePricingAndPayment';
import { usePurchasePersistenceAndSave } from './cart/usePurchasePersistenceAndSave';

export * from '../utils/purchaseCartUtils';

export function usePurchaseCart(props = {}) {
  const {
    isOpen = true,
    initialProducts = props.products || props.initialProducts || [],
    orderToEdit = null,
    newlyCreatedSupplier = null,
    onSaved,
    onOrderSaved,
    onClose,
  } = props;

  // Dialog & Feedback States
  const [error, setError] = useState('');
  const [popupMsg, setPopupMsg] = useState('');
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [printOrder, setPrintOrder] = useState(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isPrintPreviewOnly, setIsPrintPreviewOnly] = useState(false);

  // Supplier & Reference Selection State
  const [supplierId, setSupplierId] = useState('');
  const [reference, setReference] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [isSupplierOpen, setIsSupplierOpen] = useState(false);
  const supplierSelectRef = useRef(null);

  // 1. Initial Catalog & Financial Data Sub-hook
  const initialData = usePurchaseInitialData({
    initialProducts,
    supplierId,
    setError,
  });

  // 2. Landing / Logistics Extra Costs Sub-hook
  const landingCosts = usePurchaseLandingCosts();

  // 3. Barcode & Serials Sub-hook Refs
  const barcodeRefs = useRef({
    barcodeInputRef: null,
    searchInputRef: null,
    searchContainerRef: null,
  });

  // 4. Line Items & Catalog Search Sub-hook
  const itemsData = usePurchaseItems({
    productList: initialData.productList,
    barcodeInputRef: barcodeRefs.current.barcodeInputRef,
    searchInputRef: barcodeRefs.current.searchInputRef,
    setError,
    setPopupMsg,
  });

  // 5. Barcode Scanner Handling Sub-hook
  const scannerData = usePurchaseBarcodeScanner({
    items: itemsData.items,
    setItems: itemsData.setItems,
    orderToEdit,
    setError,
    setPopupMsg,
  });

  barcodeRefs.current.barcodeInputRef = scannerData.barcodeInputRef;
  barcodeRefs.current.searchInputRef = scannerData.searchInputRef;
  barcodeRefs.current.searchContainerRef = scannerData.searchContainerRef;

  // 6. Pricing, Totals & Tenders Sub-hook
  const pricingData = usePurchasePricingAndPayment({
    items: itemsData.items,
    supplierId,
    suppliers: initialData.suppliers,
    summary: initialData.summary,
    hasExtraCost: landingCosts.hasExtraCost,
    extraCost: landingCosts.extraCost,
    isOpen,
    orderToEdit,
  });

  // 7. Persistence, Drafts & Save Mutation Sub-hook
  const persistenceData = usePurchasePersistenceAndSave({
    props,
    items: itemsData.items,
    setItems: itemsData.setItems,
    setExpandedId: itemsData.setExpandedId,
    supplierId,
    setSupplierId,
    selectedSupplierObj: pricingData.selectedSupplierObj,
    setSummary: initialData.setSummary,
    reference,
    setReference,
    hasExtraCost: landingCosts.hasExtraCost,
    setHasExtraCost: landingCosts.setHasExtraCost,
    extraCost: landingCosts.extraCost,
    setExtraCost: landingCosts.setExtraCost,
    extraCostCategory: landingCosts.extraCostCategory,
    setExtraCostCategory: landingCosts.setExtraCostCategory,
    extraCostNotes: landingCosts.extraCostNotes,
    setExtraCostNotes: landingCosts.setExtraCostNotes,
    extra: landingCosts.extraCostValue,
    discount: pricingData.discount,
    setDiscount: pricingData.setDiscount,
    tenders: pricingData.tenders,
    setTenders: pricingData.setTenders,
    paymentConfirmed: pricingData.paymentConfirmed,
    setPaymentConfirmed: pricingData.setPaymentConfirmed,
    setBarcodeScanErrors: scannerData.setBarcodeScanErrors,
    setQuery: itemsData.setQuery,
    setBarcodeInput: scannerData.setBarcodeInput,
    setError,
    setPopupMsg,
    setPrintOrder,
    setIsPrintPreviewOnly,
    setIsPrintOpen,
    walletAccounts: pricingData.walletAccounts,
    cashAccounts: pricingData.cashAccounts,
    bankAccounts: pricingData.bankAccounts,
    mfsAccounts: pricingData.mfsAccounts,
    accountLabelToId: pricingData.accountLabelToId,
    productList: initialData.productList,
    setSuppliers: initialData.setSuppliers,
    newlyCreatedSupplier,
    orderToEdit,
    isOpen,
    onClose,
    onSaved,
    onOrderSaved,
  });

  return {
    // Sub-hook state & action spreads
    ...initialData,
    ...landingCosts,
    extra: landingCosts.extraCostValue,
    ...itemsData,
    ...scannerData,
    ...pricingData,
    ...persistenceData,

    // Dialog & UI feedback states
    supplierId,
    setSupplierId,
    reference,
    setReference,
    supplierSearch,
    setSupplierSearch,
    isSupplierOpen,
    setIsSupplierOpen,
    supplierSelectRef,
    error,
    setError,
    popupMsg,
    setPopupMsg,
    isAddSupplierOpen,
    setIsAddSupplierOpen,
    isAddProductOpen,
    setIsAddProductOpen,
    printOrder,
    setPrintOrder,
    isPrintOpen,
    setIsPrintOpen,
    isPrintPreviewOnly,
    setIsPrintPreviewOnly,
  };
}

export default usePurchaseCart;
