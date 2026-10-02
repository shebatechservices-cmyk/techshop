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

  return {
    recoveredDraft,
    setRecoveredDraft,
    handleRestoreDraft,
    handleDiscardDraft,
  };
}
