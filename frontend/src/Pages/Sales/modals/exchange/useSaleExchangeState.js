import { useState } from 'react';
import useExchangeSaleLoader from './hooks/useExchangeSaleLoader';
import useExchangeReplacementState from './hooks/useExchangeReplacementState';
import useExchangeCalculations from './hooks/useExchangeCalculations';
import useExchangeSubmission from './hooks/useExchangeSubmission';

/**
 * Composite Hook for Sale Return / Exchange Modal
 * Composes specialized sub-hooks for invoice loading, replacement items, calculations, and submission.
 */
export default function useSaleExchangeState({
  isOpen,
  saleId,
  products = [],
  onExchangeComplete,
  onClose,
}) {
  const [exchangeNotes, setExchangeNotes] = useState('');

  // 1. Sale details and initial return items state
  const {
    loading,
    originalSale,
    returnItems,
    setReturnItems,
    error,
    setError,
  } = useExchangeSaleLoader({
    isOpen,
    saleId,
    onSaleLoaded: () => setNewItems([]),
  });

  // 2. Replacement items, search and serial/barcode handlers
  const {
    newItems,
    setNewItems,
    expandedId,
    setExpandedId,
    searchQuery,
    setSearchQuery,
    isSearchOpen,
    setIsSearchOpen,
    barcodeInput,
    setBarcodeInput,
    barcodeError,
    searchContainerRef,
    searchInputRef,
    filteredProducts,
    addNewProduct,
    updateNewItem,
    removeNewItem,
    handleAddBarcode,
    handleRemoveBarcode,
  } = useExchangeReplacementState({
    products,
    onError: setError,
  });

  // 3. Financial calculations and paid amount sync
  const {
    returnSubtotal,
    newSubtotal,
    netDifference,
    paidAmount,
    setPaidAmount,
    paymentMethod,
    setPaymentMethod,
    origTotal,
    origPaid,
    origDue,
    revisedTotal,
    dueCleared,
    revisedRemainingDue,
    netCustomerRefund,
    customerOwesExtra,
  } = useExchangeCalculations({
    originalSale,
    returnItems,
    newItems,
  });

  // 4. Validation and submission handling
  const {
    processing,
    handleSubmitExchange,
  } = useExchangeSubmission({
    originalSale,
    returnItems,
    newItems,
    returnSubtotal,
    newSubtotal,
    paidAmount,
    paymentMethod,
    exchangeNotes,
    onExchangeComplete,
    onClose,
    setError,
    setExpandedId,
  });

  return {
    loading,
    error,
    setError,
    originalSale,
    returnItems,
    setReturnItems,
    newItems,
    expandedId,
    setExpandedId,
    searchQuery,
    setSearchQuery,
    isSearchOpen,
    setIsSearchOpen,
    barcodeInput,
    setBarcodeInput,
    barcodeError,
    paidAmount,
    setPaidAmount,
    paymentMethod,
    setPaymentMethod,
    exchangeNotes,
    setExchangeNotes,
    processing,
    searchContainerRef,
    searchInputRef,
    filteredProducts,
    addNewProduct,
    updateNewItem,
    removeNewItem,
    handleAddBarcode,
    handleRemoveBarcode,
    returnSubtotal,
    newSubtotal,
    netDifference,
    origTotal,
    origPaid,
    origDue,
    revisedTotal,
    dueCleared,
    revisedRemainingDue,
    netCustomerRefund,
    customerOwesExtra,
    handleSubmitExchange,
  };
}
