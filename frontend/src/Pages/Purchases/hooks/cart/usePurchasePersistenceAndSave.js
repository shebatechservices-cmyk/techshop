import { useState } from 'react';
import {
  money,
  computeFinalSale,
  EXTRA_COST_CATEGORIES,
} from '../../utils/purchaseCartUtils';
import {
  validatePurchaseOrder,
  buildPurchaseApiPayload,
} from '../../utils/purchaseFormUtils';
import { usePurchaseDraft } from './usePurchaseDraft';
import { usePurchaseHydration } from './usePurchaseHydration';
import API from '../../../../services/api';

export function usePurchasePersistenceAndSave({
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
}) {
  const [saving, setSaving] = useState(false);
  const [previewOrderId, setPreviewOrderId] = useState(null);
  const [previewOrderData, setPreviewOrderData] = useState(null);
  const [isLedgerPreviewOpen, setIsLedgerPreviewOpen] = useState(false);

  // 1. Draft auto-save and recovery hook
  const {
    recoveredDraft,
    setRecoveredDraft,
    handleRestoreDraft,
    handleDiscardDraft,
  } = usePurchaseDraft({
    isOpen,
    orderToEdit,
    items,
    setItems,
    supplierId,
    setSupplierId,
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
  });

  // 2. PO and supplier hydration hook
  const { handleLoadOrderInForm } = usePurchaseHydration({
    orderToEdit,
    newlyCreatedSupplier,
    productList,
    setSupplierId,
    setSuppliers,
    setReference,
    setHasExtraCost,
    setExtraCost,
    setExtraCostCategory,
    setExtraCostNotes,
    setItems,
    setExpandedId,
    setDiscount,
    setTenders,
    setPaymentConfirmed,
    setIsLedgerPreviewOpen,
    bankAccounts,
    mfsAccounts,
    cashAccounts,
  });

  // 3. Clear Form Action
  const handleClearForm = (skipConfirm = false) => {
    if (!skipConfirm) {
      if (
        !window.confirm(
          'Are you sure you want to clear the purchase form and reset all entered items and payment details?'
        )
      ) {
        return;
      }
    }
    setSupplierId('');
    if (setSummary) setSummary(null);
    setItems([]);
    setReference('');
    setDiscount(0);
    setHasExtraCost(false);
    setExtraCost('');
    setExtraCostCategory(EXTRA_COST_CATEGORIES[0]);
    setExtraCostNotes('');
    setTenders([]);
    setPaymentConfirmed(false);
    setQuery('');
    setBarcodeInput('');
    if (setError) setError('');
    if (setPopupMsg) setPopupMsg('');
  };

  const handleOpenRecentPreview = (recentPo) => {
    setPreviewOrderId(recentPo.id);
    setPreviewOrderData(recentPo);
    setIsLedgerPreviewOpen(true);
  };

  // 4. Save Purchase Action
  const savePurchase = async (andPreview = false) => {
    if (setError) setError('');
    if (setPopupMsg) setPopupMsg('');

    const validation = validatePurchaseOrder({
      items,
      tenders,
      supplierId,
      selectedSupplierObj,
      money,
    });

    if (!validation.isValid) {
      if (validation.errorItemId && setExpandedId) {
        setExpandedId(validation.errorItemId);
      }
      if (validation.barcodeScanError && setBarcodeScanErrors) {
        setBarcodeScanErrors((prev) => ({
          ...prev,
          [validation.barcodeScanError.localId]:
            validation.barcodeScanError.message,
        }));
      }
      if (validation.popupMsg && setPopupMsg) {
        return setPopupMsg(validation.popupMsg);
      }
      if (validation.errorMsg && setError) {
        return setError(validation.errorMsg);
      }
      return;
    }

    setSaving(true);
    try {
      const isEditing = Boolean(orderToEdit && orderToEdit.id);
      const url = isEditing
        ? `${API}/purchase/${orderToEdit.id}`
        : `${API}/purchase/orders`;
      const method = isEditing ? 'PUT' : 'POST';

      const payloadBody = buildPurchaseApiPayload({
        supplierId,
        selectedSupplierObj,
        reference,
        discount,
        hasExtraCost,
        extra,
        extraCost,
        extraCostCategory,
        extraCostNotes,
        items,
        tenders,
        accountLabelToId,
        walletAccounts,
        computeFinalSale,
        money,
      });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadBody),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to save purchase order');
      }

      const createdOrder = payload.data || payload;
      if (props?.onSaved) props.onSaved(createdOrder);
      if (onSaved) onSaved(createdOrder);
      if (onOrderSaved) onOrderSaved(createdOrder);

      if (andPreview) {
        setPreviewOrderId(createdOrder.id || orderToEdit?.id);
        setPreviewOrderData(createdOrder);
        setIsLedgerPreviewOpen(true);
      } else {
        handleClearForm(true);
        if (onClose) onClose();
      }

      if (setPrintOrder && setIsPrintPreviewOnly && setIsPrintOpen) {
        setPrintOrder(createdOrder);
        setIsPrintPreviewOnly(false);
        setIsPrintOpen(true);
      }
    } catch (err) {
      console.error('Failed to save purchase order:', err);
      if (setError) setError(err.message || 'Network error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  return {
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
  };
}
