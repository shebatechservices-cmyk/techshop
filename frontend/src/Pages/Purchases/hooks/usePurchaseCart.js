import { useEffect, useState, useRef } from 'react';
import API_BASE from '../../../services/api';
import {
  fullCatalogName,
  productLabel,
  isProductSerialTracked,
  isProductWarrantyRequired,
  PURCHASE_API,
  money,
  taka,
  newTender,
  today,
  EXTRA_COST_CATEGORIES,
  computeFinalSale,
  getItemMissingFields,
  newLineItem,
} from '../utils/purchaseCartUtils';
import { usePurchaseLandingCosts } from './cart/usePurchaseLandingCosts';
import { usePurchaseItems } from './cart/usePurchaseItems';
import { usePurchaseBarcodeScanner } from './cart/usePurchaseBarcodeScanner';
import { usePurchasePricingAndPayment } from './cart/usePurchasePricingAndPayment';
import { usePurchasePersistenceAndSave } from './cart/usePurchasePersistenceAndSave';

export {
  fullCatalogName,
  productLabel,
  isProductSerialTracked,
  isProductWarrantyRequired,
  PURCHASE_API,
  money,
  taka,
  newTender,
  today,
  EXTRA_COST_CATEGORIES,
  computeFinalSale,
  getItemMissingFields,
  newLineItem,
};

export function usePurchaseCart(props = {}) {
  const {
    isOpen = true,
    initialProducts = [],
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

  // Supplier & Catalog State
  const [productList, setProductList] = useState(initialProducts);
  const [suppliers, setSuppliers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [summary, setSummary] = useState(null);
  const [reference, setReference] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [isSupplierOpen, setIsSupplierOpen] = useState(false);
  const supplierSelectRef = useRef(null);

  // 1. Landing / Logistics Extra Costs Sub-hook
  const {
    hasExtraCost,
    setHasExtraCost,
    extraCost,
    setExtraCost,
    extraCostCategory,
    setExtraCostCategory,
    extraCostNotes,
    setExtraCostNotes,
    extraCostValue: extra,
  } = usePurchaseLandingCosts();

  // 2. Barcode & Serials Sub-hook
  const barcodeRefs = useRef({
    barcodeInputRef: null,
    searchInputRef: null,
    searchContainerRef: null,
  });

  // 3. Items & Catalog Sub-hook
  const {
    items,
    setItems,
    expandedId,
    setExpandedId,
    query,
    setQuery,
    isSearchOpen,
    setIsSearchOpen,
    matches,
    updateItem,
    handleItemCostChange,
    handleItemMarginChange,
    handleItemSaleChange,
    addProduct,
    handleRemoveItem,
    handleAddButtonClick,
  } = usePurchaseItems({
    productList,
    barcodeInputRef: barcodeRefs.current.barcodeInputRef,
    searchInputRef: barcodeRefs.current.searchInputRef,
    setError,
    setPopupMsg,
  });

  // 4. Barcode Scanner Sub-hook
  const {
    barcodeInput,
    setBarcodeInput,
    barcodeScanErrors,
    setBarcodeScanErrors,
    barcodeInputRef,
    searchInputRef,
    searchContainerRef,
    handleAddBarcode,
    handleRemoveBarcode,
  } = usePurchaseBarcodeScanner({
    items,
    setItems,
    orderToEdit,
    setError,
    setPopupMsg,
  });

  barcodeRefs.current.barcodeInputRef = barcodeInputRef;
  barcodeRefs.current.searchInputRef = searchInputRef;
  barcodeRefs.current.searchContainerRef = searchContainerRef;

  // Initial Data Loading
  useEffect(() => {
    const fetchMasterProducts = async () => {
      try {
        const res = await fetch(`${API_BASE}/master/products`);
        if (res.ok) {
          const data = await res.json();
          setProductList(Array.isArray(data) ? data : data.data || []);
        }
      } catch (err) {
        console.error('Failed to load master products for purchase cart:', err);
      }
    };
    fetchMasterProducts();
  }, [initialProducts]);

  useEffect(() => {
    const load = async () => {
      const [supplierData, accountData] = await Promise.all([
        fetch(`${PURCHASE_API}/suppliers`).then((res) => res.json()).catch(() => []),
        fetch(`${PURCHASE_API}/accounts`).then((res) => res.json()).catch(() => []),
      ]);
      const supList = Array.isArray(supplierData) ? supplierData : [];
      setSuppliers(supList);
      setAccounts(Array.isArray(accountData) ? accountData : []);
    };
    load().catch(() => setError('Failed to load purchase data'));
  }, []);

  useEffect(() => {
    if (!supplierId) {
      setSummary(null);
      return;
    }
    fetch(`${PURCHASE_API}/suppliers/${supplierId}/summary`)
      .then((res) => res.json())
      .then(setSummary)
      .catch(() => setSummary(null));
  }, [supplierId]);

  // 5. Pricing & Payments Sub-hook
  const {
    discount,
    setDiscount,
    tenders,
    setTenders,
    paymentConfirmed,
    setPaymentConfirmed,
    walletAccounts,
    setWalletAccounts,
    cashAccounts,
    bankAccounts,
    mfsAccounts,
    accountByLabel,
    accountLabelToId,
    accountLabelToBalance,
    totals,
    netAmount,
    payableAmount,
    totalCost,
    totalSale,
    estimatedProfit,
    selectedSupplierObj,
    supplierPayable,
    previousDue,
    totalPayable,
    supplierWallet,
    supplierWalletLabel,
    acceptedPaid,
    paid,
    currentDue,
    remainingDue,
    updateTender,
    removeTender,
    addTenderRow,
    acceptTender,
    cancelTender,
    handlePayFull,
    handleFullDue,
  } = usePurchasePricingAndPayment({
    items,
    supplierId,
    suppliers,
    summary,
    hasExtraCost,
    extraCost,
    isOpen,
  });

  // 6. Persistence, Drafts & Save Mutation Sub-hook
  const {
    saving,
    setSaving,
    recoveredDraft,
    setRecoveredDraft,
    previewOrderId,
    setPreviewOrderId,
    previewOrderData,
    setPreviewOrderData,
    isLedgerPreviewOpen,
    setIsLedgerPreviewOpen,
    handleRestoreDraft,
    handleDiscardDraft,
    handleClearForm,
    handleLoadOrderInForm,
    handleOpenRecentPreview,
    savePurchase,
  } = usePurchasePersistenceAndSave({
    props,
    items,
    setItems,
    setExpandedId,
    supplierId,
    setSupplierId,
    selectedSupplierObj,
    setSummary,
    reference,
    setReference,
    hasExtraCost,
    setHasExtraCost,
    extraCost,
    setExtraCost,
    extraCostCategory,
    setExtraCostCategory,
    extraCostNotes,
    setExtraCostNotes,
    extra,
    discount,
    setDiscount,
    tenders,
    setTenders,
    setPaymentConfirmed,
    setBarcodeScanErrors,
    setQuery,
    setBarcodeInput,
    setError,
    setPopupMsg,
    setPrintOrder,
    setIsPrintPreviewOnly,
    setIsPrintOpen,
    walletAccounts,
    cashAccounts,
    bankAccounts,
    mfsAccounts,
    accountLabelToId,
    productList,
    setSuppliers,
    newlyCreatedSupplier,
    orderToEdit,
    isOpen,
    onClose,
    onSaved,
    onOrderSaved,
  });

  return {
    // State variables
    productList,
    setProductList,
    suppliers,
    setSuppliers,
    accounts,
    setAccounts,
    supplierId,
    setSupplierId,
    summary,
    setSummary,
    query,
    setQuery,
    isSearchOpen,
    setIsSearchOpen,
    items,
    setItems,
    expandedId,
    setExpandedId,
    barcodeInput,
    setBarcodeInput,
    reference,
    setReference,
    hasExtraCost,
    setHasExtraCost,
    extraCost,
    setExtraCost,
    extraCostCategory,
    setExtraCostCategory,
    extraCostNotes,
    setExtraCostNotes,
    discount,
    setDiscount,
    tenders,
    setTenders,
    paymentConfirmed,
    setPaymentConfirmed,
    barcodeScanErrors,
    setBarcodeScanErrors,
    supplierSearch,
    setSupplierSearch,
    isSupplierOpen,
    setIsSupplierOpen,
    supplierSelectRef,
    printOrder,
    setPrintOrder,
    isPrintOpen,
    setIsPrintOpen,
    isPrintPreviewOnly,
    setIsPrintPreviewOnly,
    recoveredDraft,
    setRecoveredDraft,
    isAddSupplierOpen,
    setIsAddSupplierOpen,
    isAddProductOpen,
    setIsAddProductOpen,
    previewOrderId,
    setPreviewOrderId,
    previewOrderData,
    setPreviewOrderData,
    isLedgerPreviewOpen,
    setIsLedgerPreviewOpen,
    error,
    setError,
    popupMsg,
    setPopupMsg,
    saving,
    setSaving,

    // Account lookups
    walletAccounts,
    setWalletAccounts,
    cashAccounts,
    bankAccounts,
    mfsAccounts,
    accountByLabel,
    accountLabelToId,
    accountLabelToBalance,

    // Filter matches & totals
    matches,
    totals,
    extra,
    netAmount,
    payableAmount,
    totalCost,
    totalSale,
    estimatedProfit,

    // Supplier balance
    selectedSupplierObj,
    supplierPayable,
    previousDue,
    totalPayable,
    supplierWallet,
    supplierWalletLabel,

    // Payment calculations
    acceptedPaid,
    paid,
    currentDue,
    remainingDue,

    // Action handlers
    handleRestoreDraft,
    handleDiscardDraft,
    updateItem,
    handleItemCostChange,
    handleItemMarginChange,
    handleItemSaleChange,
    addProduct,
    handleAddBarcode,
    handleRemoveBarcode,
    handleRemoveItem,
    handleAddButtonClick,
    updateTender,
    removeTender,
    addTenderRow,
    acceptTender,
    cancelTender,
    handlePayFull,
    handleFullDue,
    handleClearForm,
    handleLoadOrderInForm,
    handleOpenRecentPreview,
    savePurchase,
    barcodeInputRef,
    searchInputRef,
    searchContainerRef,
  };
}

export default usePurchaseCart;
