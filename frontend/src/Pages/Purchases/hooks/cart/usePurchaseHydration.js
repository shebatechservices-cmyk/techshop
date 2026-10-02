import { useEffect } from 'react';
import {
  money,
  today,
  productLabel,
  fullCatalogName,
  isProductSerialTracked,
  isProductWarrantyRequired,
} from '../../utils/purchaseCartUtils';
import { mapOrderToFormItems } from '../../utils/purchaseFormUtils';
import API from '../../../../services/api';

export function usePurchaseHydration({
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
  bankAccounts = [],
  mfsAccounts = [],
  cashAccounts = [],
}) {
  // 1. Initialize state from orderToEdit or newlyCreatedSupplier
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
  }, [orderToEdit, newlyCreatedSupplier, productList]);

  // 2. Load order details when clicking recent PO
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
    setHasExtraCost(Number(fullPo.extra_cost || 0) > 0);
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
    if (setIsLedgerPreviewOpen) setIsLedgerPreviewOpen(false);
  };

  return {
    handleLoadOrderInForm,
  };
}
