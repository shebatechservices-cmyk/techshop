import { useState, useEffect } from 'react';
import {
  money,
  computeFinalSale,
  today,
  productLabel,
  fullCatalogName,
  isProductSerialTracked,
  isProductWarrantyRequired,
  EXTRA_COST_CATEGORIES,
} from '../../utils/purchaseCartUtils';
import {
  mapOrderToFormItems,
  validatePurchaseOrder,
  buildPurchaseApiPayload,
} from './purchaseFormUtils';
import {
  PURCHASE_DRAFT_KEY,
  saveDraft,
  loadDraft,
  clearDraft,
} from '../../../../utils/draftRecovery';
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
  const [recoveredDraft, setRecoveredDraft] = useState(null);
  const [previewOrderId, setPreviewOrderId] = useState(null);
  const [previewOrderData, setPreviewOrderData] = useState(null);
  const [isLedgerPreviewOpen, setIsLedgerPreviewOpen] = useState(false);

  // 1. Recover Draft on mount if not editing
  useEffect(() => {
    if (isOpen && !orderToEdit) {
      const draft = loadDraft(PURCHASE_DRAFT_KEY);
      if (
        draft &&
        ((draft.items && draft.items.length > 0) ||
          draft.supplierId ||
          draft.reference)
      ) {
        setRecoveredDraft(draft);
      }
    }
  }, [isOpen, orderToEdit]);

  // 2. Auto-save Draft periodically
  useEffect(() => {
    if (!isOpen || orderToEdit) return;
    if (items.length === 0 && !supplierId && !reference) {
      clearDraft(PURCHASE_DRAFT_KEY);
      return;
    }

    const payload = {
      supplierId,
      reference,
      hasExtraCost,
      extraCost,
      extraCostCategory,
      extraCostNotes,
      discount,
      items,
      tenders,
    };
    saveDraft(PURCHASE_DRAFT_KEY, payload);
  }, [
    isOpen,
    orderToEdit,
    supplierId,
    reference,
    hasExtraCost,
    extraCost,
    extraCostCategory,
    extraCostNotes,
    discount,
    items,
    tenders,
  ]);

  const handleRestoreDraft = () => {
    if (!recoveredDraft) return;
    if (recoveredDraft.supplierId) setSupplierId(recoveredDraft.supplierId);
    if (recoveredDraft.reference) setReference(recoveredDraft.reference);
    if (recoveredDraft.hasExtraCost !== undefined)
      setHasExtraCost(recoveredDraft.hasExtraCost);
    if (recoveredDraft.extraCost) setExtraCost(recoveredDraft.extraCost);
    if (recoveredDraft.extraCostCategory)
      setExtraCostCategory(recoveredDraft.extraCostCategory);
    if (recoveredDraft.extraCostNotes)
      setExtraCostNotes(recoveredDraft.extraCostNotes);
    if (recoveredDraft.discount) setDiscount(recoveredDraft.discount);
    if (Array.isArray(recoveredDraft.items)) setItems(recoveredDraft.items);
    if (Array.isArray(recoveredDraft.tenders)) setTenders(recoveredDraft.tenders);
    setRecoveredDraft(null);
  };

  const handleDiscardDraft = () => {
    clearDraft(PURCHASE_DRAFT_KEY);
    setRecoveredDraft(null);
  };

  // 3. Initialize state from orderToEdit or newlyCreatedSupplier
  useEffect(() => {
    if (orderToEdit) {
      if (orderToEdit.supplier_id) setSupplierId(String(orderToEdit.supplier_id));
      if (orderToEdit.transaction_reference)
        setReference(orderToEdit.transaction_reference);
      if (Number(orderToEdit.extra_cost || 0) > 0) setHasExtraCost(true);
      if (orderToEdit.extra_cost) setExtraCost(String(orderToEdit.extra_cost));
      if (orderToEdit.extra_cost_category)
        setExtraCostCategory(orderToEdit.extra_cost_category);
      if (orderToEdit.extra_cost_notes)
        setExtraCostNotes(orderToEdit.extra_cost_notes);

      if (Array.isArray(orderToEdit.items)) {
        const loaded = mapOrderToFormItems(
          orderToEdit.items,
          productList,
          isProductSerialTracked,
          isProductWarrantyRequired,
          productLabel,
          fullCatalogName,
          today
        );
        setItems(loaded);
        if (loaded.length > 0) setExpandedId(loaded[0].localId);
      }

      if (orderToEdit.discount !== undefined && orderToEdit.discount !== null) {
        setDiscount(money(orderToEdit.discount));
      }

      if (Array.isArray(orderToEdit.payments) && orderToEdit.payments.length > 0) {
        setTenders(
          orderToEdit.payments.map((p, i) => ({
            id: p.id || `edit-pay-${i}`,
            method: p.payment_method || 'Cash',
            sub_option: p.sub_option || p.account_name || '',
            amount: p.amount || 0,
            receiver_name: p.receiver_name || '',
            transaction_id: p.transaction_id || '',
            payment_method_id: p.payment_method_id || null,
            account_id: p.account_id || null,
            isAccepted: true,
          }))
        );
        setPaymentConfirmed(true);
      } else {
        setTenders([]);
        setPaymentConfirmed(false);
      }
    }

    if (newlyCreatedSupplier && newlyCreatedSupplier.id) {
      if (setSuppliers) {
        setSuppliers((prev) => {
          const found = prev.some((s) => s.id === newlyCreatedSupplier.id);
          if (found) return prev;
          return [...prev, newlyCreatedSupplier];
        });
      }
      setSupplierId(String(newlyCreatedSupplier.id));
    }
  }, [orderToEdit, newlyCreatedSupplier]);

  const handleClearForm = () => {
    if (items.length > 0 || supplierId) {
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

  const handleLoadOrderInForm = async (po) => {
    if (!po) return;
    let fullPo = po;
    if (!Array.isArray(fullPo.items) || fullPo.items.length === 0) {
      try {
        const res = await fetch(`${API}/purchase/${po.id}`);
        if (res.ok) {
          fullPo = await res.json();
        }
      } catch (err) {
        console.error('Failed to fetch full PO details in handleLoadOrderInForm:', err);
      }
    }

    if (fullPo.supplier_id) {
      setSupplierId(String(fullPo.supplier_id));
    }
    setReference(fullPo.transaction_reference || fullPo.po_number || '');
    setExtraCost(fullPo.extra_cost ? String(fullPo.extra_cost) : '');
    if (fullPo.extra_cost_category) setExtraCostCategory(fullPo.extra_cost_category);
    if (fullPo.extra_cost_notes) setExtraCostNotes(fullPo.extra_cost_notes);

    if (Array.isArray(fullPo.items) && fullPo.items.length > 0) {
      const loadedItems = mapOrderToFormItems(
        fullPo.items,
        productList,
        isProductSerialTracked,
        isProductWarrantyRequired,
        productLabel,
        fullCatalogName,
        today
      );
      setItems(loadedItems);
      if (loadedItems.length > 0) setExpandedId(loadedItems[0].localId);
    }

    if (Array.isArray(po.payments) && po.payments.length > 0) {
      const loadedTenders = po.payments.map((p) => ({
        id: `${Date.now()}-${Math.random()}`,
        method: p.payment_method || 'Cash',
        sub_option:
          p.sub_option ||
          (p.payment_method === 'Bank'
            ? bankAccounts[0] || 'Bank'
            : p.payment_method === 'MFS'
            ? mfsAccounts[0] || 'MFS'
            : cashAccounts[0] || 'Cash Drawer'),
        receiver_name: p.receiver_name || '',
        transaction_id: p.transaction_id || '',
        amount: Number(p.amount || 0),
        isAccepted: true,
      }));
      setTenders(loadedTenders);
    } else {
      setTenders([]);
    }
    setPaymentConfirmed(false);
    setIsLedgerPreviewOpen(false);
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

      // Dispatch global events so Cash Drawer, Accounts, Inventory, and Supplier Dues update immediately
      window.dispatchEvent(new CustomEvent('inventory_stock_changed'));
      window.dispatchEvent(new CustomEvent('data_changed'));
      window.dispatchEvent(new CustomEvent('account_balance_changed'));
      window.dispatchEvent(new CustomEvent('cash_drawer_changed'));
      window.dispatchEvent(new CustomEvent('wallet_balance_changed'));

      clearDraft(PURCHASE_DRAFT_KEY);
      setRecoveredDraft(null);

      if (andPreview) {
        if (setPrintOrder) setPrintOrder(createdOrder);
        if (setIsPrintPreviewOnly) setIsPrintPreviewOnly(false);
        if (setIsPrintOpen) setIsPrintOpen(true);
      } else {
        if (onClose) onClose();
      }
    } catch (saveErr) {
      console.error(saveErr);
      if (setError) setError(saveErr.message || 'Error occurred while saving order');
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
