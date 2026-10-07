import { useState, useEffect } from 'react';
import {
  PURCHASE_DRAFT_KEY,
  saveDraft,
  loadDraft,
  clearDraft,
} from '../../../../utils/draftRecovery';

export function usePurchaseDraft({
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
}) {
  const [recoveredDraft, setRecoveredDraft] = useState(null);

  // 1. Recover Draft on mount if not editing an existing order
  useEffect(() => {
    if (isOpen && !orderToEdit) {
      const draft = loadDraft(PURCHASE_DRAFT_KEY);
      if (
        draft &&
        draft.data &&
        ((Array.isArray(draft.data.items) && draft.data.items.length > 0) ||
          draft.data.supplierId ||
          draft.data.reference)
      ) {
        setRecoveredDraft(draft);
      } else {
        setRecoveredDraft(null);
      }
    } else {
      setRecoveredDraft(null);
    }
  }, [isOpen, orderToEdit]);

  // 2. Real-Time Auto-Save with 350ms debounce
  useEffect(() => {
    if (!isOpen || orderToEdit) return;

    // CRITICAL: If an unsaved recovered draft exists and current cart is still empty,
    // do NOT wipe or overwrite it with empty state!
    if (recoveredDraft && items.length === 0 && !supplierId && !reference) {
      return;
    }

    // If completely empty and no recovered draft pending, clear the draft
    if (items.length === 0 && !supplierId && !reference && !extraCost && !discount) {
      clearDraft(PURCHASE_DRAFT_KEY);
      return;
    }

    const timer = setTimeout(() => {
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
    }, 350);

    return () => clearTimeout(timer);
  }, [
    isOpen,
    orderToEdit,
    recoveredDraft,
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
    if (!recoveredDraft || !recoveredDraft.data) return;
    const d = recoveredDraft.data;
    if (d.supplierId) setSupplierId(String(d.supplierId));
    if (d.reference) setReference(d.reference);
    if (d.hasExtraCost !== undefined) setHasExtraCost(Boolean(d.hasExtraCost));
    if (d.extraCost) setExtraCost(d.extraCost);
    if (d.extraCostCategory) setExtraCostCategory(d.extraCostCategory);
    if (d.extraCostNotes) setExtraCostNotes(d.extraCostNotes);
    if (d.discount !== undefined) setDiscount(Number(d.discount));
    if (Array.isArray(d.items) && d.items.length > 0) setItems(d.items);
    if (Array.isArray(d.tenders) && d.tenders.length > 0) setTenders(d.tenders);
    setRecoveredDraft(null);
  };

  const handleDiscardDraft = () => {
    clearDraft(PURCHASE_DRAFT_KEY);
    setRecoveredDraft(null);
  };

  return {
    recoveredDraft,
    setRecoveredDraft,
    handleRestoreDraft,
    handleDiscardDraft,
  };
}
