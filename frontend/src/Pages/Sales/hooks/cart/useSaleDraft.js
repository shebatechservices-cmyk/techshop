import { useState, useEffect } from 'react';
import { POS_DRAFT_KEY, saveDraft, loadDraft, clearDraft } from '../../../../utils/draftRecovery';

/**
 * Draft Recovery & Real-Time Auto-Save Sub-hook
 */
export function useSaleDraft({
  isOpen,
  editSale,
  draftData,
  handlers,
}) {
  const [recoveredDraft, setRecoveredDraft] = useState(null);

  const {
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
  } = draftData;

  const {
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
  } = handlers;

  // Check for existing saved draft on open
  useEffect(() => {
    if (isOpen && !editSale) {
      const draft = loadDraft(POS_DRAFT_KEY);
      if (draft && draft.data && (draft.itemCount > 0 || draft.data.customerId)) {
        setRecoveredDraft(draft);
      } else {
        setRecoveredDraft(null);
      }
    } else {
      setRecoveredDraft(null);
    }
  }, [isOpen, editSale]);

  // Real-Time Auto-Save Draft with 300ms debounce
  useEffect(() => {
    if (!isOpen || editSale) return;

    if (recoveredDraft && items.length === 0 && !customerId) return;

    const timer = setTimeout(() => {
      saveDraft(POS_DRAFT_KEY, {
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
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [
    isOpen,
    editSale,
    recoveredDraft,
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
  ]);

  const handleRestoreDraft = () => {
    if (!recoveredDraft || !recoveredDraft.data) return;
    const d = recoveredDraft.data;
    if (d.customerId) setCustomerId(String(d.customerId));
    if (Array.isArray(d.items) && d.items.length > 0) setItems(d.items);
    if (d.discount !== undefined) setDiscount(Number(d.discount));
    if (d.discountTouched !== undefined) setDiscountTouched(Boolean(d.discountTouched));
    if (d.vat !== undefined) setVat(Number(d.vat));
    if (d.hasSetupCharge !== undefined) setHasSetupCharge(Boolean(d.hasSetupCharge));
    if (d.cameraCount !== undefined) setCameraCount(Number(d.cameraCount));
    if (d.setupRatePerCamera !== undefined)
      setSetupRatePerCamera(Number(d.setupRatePerCamera));
    if (d.setupCharge !== undefined) setSetupCharge(Number(d.setupCharge));
    if (d.hasExtraCost !== undefined) setHasExtraCost(Boolean(d.hasExtraCost));
    if (d.extraCost !== undefined) setExtraCost(d.extraCost);
    if (d.extraCostCategory) setExtraCostCategory(d.extraCostCategory);
    if (d.extraCostNotes) setExtraCostNotes(d.extraCostNotes);
    if (d.loyaltyPointsToUse !== undefined)
      setLoyaltyPointsToUse(Number(d.loyaltyPointsToUse));
    if (Array.isArray(d.tenders) && d.tenders.length > 0) setTenders(d.tenders);
    if (d.salesPerson) setSalesPerson(d.salesPerson);
    if (d.invoiceDate) setInvoiceDate(d.invoiceDate);
    if (d.destination) setDestination(d.destination);
    if (d.attention) setAttention(d.attention);

    setRecoveredDraft(null);
  };

  const handleDiscardDraft = () => {
    clearDraft(POS_DRAFT_KEY);
    setRecoveredDraft(null);
  };

  const clearSaleDraft = () => {
    clearDraft(POS_DRAFT_KEY);
    setRecoveredDraft(null);
  };

  return {
    recoveredDraft,
    setRecoveredDraft,
    handleRestoreDraft,
    handleDiscardDraft,
    clearSaleDraft,
  };
}

export default useSaleDraft;
