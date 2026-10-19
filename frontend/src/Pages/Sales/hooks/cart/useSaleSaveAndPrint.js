import { useState } from 'react';
import API from '../../../../services/api';
import { money } from '../useSalePricingAndCharges';
import { validateSaleSubmission } from './saleValidationHelper';
import { buildSalePayload, buildSalePrintData } from './salePayloadHelper';
import { useSalePrintPreview } from './useSalePrintPreview';
import { resetSaleForm } from './saleResetHelper';

export const taka = (val) =>
  `৳${money(val).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/**
 * Sale Submission, Print Preview & Form Reset Sub-hook
 */
export function useSaleSaveAndPrint({
  editSale,
  onSaleCreated,
  onSaleUpdated,
  clearSaleDraft,
  formValues,
  handlers,
}) {
  const [popupMsg, setPopupMsg] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const {
    customerId,
    items,
    subtotal,
    totalDiscount,
    totalVat,
    totalSetupCharge,
    totalExtraCost,
    totalPayable,
    hasExtraCost,
    extraCostCategory,
    extraCostNotes,
    loyaltyPointsToUse,
    salesPerson,
    destination,
    attention,
    invoiceDate,
    selectedCustomer,
    paid,
    tenders,
  } = formValues;

  const { setExpandedId } = handlers;

  const printPreview = useSalePrintPreview({
    ...formValues,
    setError,
  });

  const handleClearForm = () => {
    if (items.length > 0 || customerId) {
      if (
        !window.confirm(
          'Are you sure you want to clear the sale form and reset all entered items and payment details?'
        )
      ) {
        return;
      }
    }
    resetSaleForm({
      ...handlers,
      setError,
      setPopupMsg,
    });
  };

  const handleSaveSale = async (e) => {
    e.preventDefault();
    setError('');
    setPopupMsg('');

    const validation = validateSaleSubmission({
      customerId,
      items,
      tenders,
      paid,
      totalPayable,
      money,
      taka,
    });

    if (!validation.isValid) {
      if (validation.expandedId) setExpandedId(validation.expandedId);
      if (validation.popupMsg) setPopupMsg(validation.popupMsg);
      if (validation.error) setError(validation.error);
      return;
    }

    try {
      setSaving(true);
      const isEdit = Boolean(editSale && editSale.id);
      const acceptedTenders = tenders.filter(
        (t) => t.isAccepted && money(t.amount) > 0
      );
      const payload = buildSalePayload({
        customerId,
        subtotal,
        totalDiscount,
        totalVat,
        totalSetupCharge,
        totalExtraCost,
        hasExtraCost,
        extraCostCategory,
        extraCostNotes,
        paid,
        loyaltyPointsToUse,
        acceptedTenders,
        salesPerson,
        destination,
        attention,
        invoiceDate,
        editSale,
        items,
        money,
      });

      const res = await fetch(
        isEdit ? `${API}/sales/${editSale.id}` : `${API}/sales/create`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Failed to complete sale');
        return;
      }

      const fullOrderForPrint = buildSalePrintData({
        baseData: data.data,
        selectedCustomer,
        salesPerson,
        destination,
        attention,
        invoiceDate,
        totalExtraCost,
        hasExtraCost,
        extraCostCategory,
        extraCostNotes,
        paymentDetails: acceptedTenders,
        items,
      });

      printPreview.setPrintSale(fullOrderForPrint);
      printPreview.setIsPrintPreviewOnly(false);
      printPreview.setIsPrintOpen(true);

      if (clearSaleDraft) clearSaleDraft();

      if (isEdit) {
        if (onSaleUpdated) onSaleUpdated(data.data);
      } else if (onSaleCreated) {
        onSaleCreated(data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Server error while completing sale');
    } finally {
      setSaving(false);
    }
  };

  return {
    popupMsg,
    setPopupMsg,
    error,
    setError,
    saving,
    ...printPreview,
    handleClearForm,
    handleSaveSale,
  };
}

export default useSaleSaveAndPrint;
