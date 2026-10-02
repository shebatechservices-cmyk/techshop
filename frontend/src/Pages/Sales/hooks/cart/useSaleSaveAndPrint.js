import { useState } from 'react';
import API from '../../../../services/api';
import { money } from '../useSalePricingAndCharges';
import { newTender } from '../useSaleTendersState';

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
  const [printSale, setPrintSale] = useState(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isPrintPreviewOnly, setIsPrintPreviewOnly] = useState(false);

  const {
    customerId,
    items,
    subtotal,
    totalDiscount,
    totalVat,
    totalSetupCharge,
    totalExtraCost,
    currentSaleTotal,
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
    due,
    tenders,
  } = formValues;

  const {
    setCustomerId,
    setCustomerSummary,
    setItems,
    setExpandedId,
    setDiscount,
    setDiscountTouched,
    setVat,
    setHasSetupCharge,
    setSetupCharge,
    setHasExtraCost,
    setExtraCost,
    setExtraCostNotes,
    setLoyaltyPointsToUse,
    setDestination,
    setAttention,
    setSearchQuery,
    setBarcodeInput,
    setTenders,
    setHasUserEditedPaid,
    setPaymentConfirmed,
  } = handlers;

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
    setCustomerId('');
    setCustomerSummary(null);
    setItems([]);
    setDiscount(0);
    setDiscountTouched(false);
    setVat(0);
    setHasSetupCharge(false);
    setSetupCharge(500);
    setHasExtraCost(false);
    setExtraCost(0);
    setExtraCostNotes('');
    setLoyaltyPointsToUse(0);
    setDestination('');
    setAttention('');
    setSearchQuery('');
    setBarcodeInput('');
    setError('');
    setPopupMsg('');
    setTenders([newTender(0, false)]);
    setHasUserEditedPaid(false);
    setPaymentConfirmed(false);
  };

  const handleOpenPrintPreview = () => {
    if (!items.length) {
      setError('Please add at least one product to preview invoice');
      setTimeout(() => setError(''), 3000);
      return;
    }
    const previewData = {
      id: 'DRAFT',
      invoice_no: `INV-${new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, '')}-DRAFT`,
      created_at: new Date().toISOString(),
      customer_name: selectedCustomer?.name || 'Walk-in Customer',
      customer_phone: selectedCustomer?.phone || '',
      customer_email: selectedCustomer?.email || '',
      customer_address: selectedCustomer?.address || '',
      sales_person: salesPerson || null,
      destination: destination || null,
      attention: attention || null,
      invoice_date: invoiceDate || null,
      subtotal,
      discount: totalDiscount,
      vat: totalVat,
      setup_charge: totalSetupCharge,
      extra_cost: totalExtraCost,
      extra_cost_category: hasExtraCost ? extraCostCategory : null,
      extra_cost_notes: hasExtraCost ? extraCostNotes : null,
      total_amount: currentSaleTotal,
      paid_amount: paid,
      due_amount: due,
      payment_method: tenders.map((t) => t.method).join(', ') || 'Cash',
      payment_details: tenders.filter((t) => money(t.amount) > 0),
      items: items.map((it) => ({
        ...it,
        line_total:
          Number(it.quantity || 1) * Number(it.unit_price || 0) -
          Number(it.discount || 0),
      })),
    };
    setPrintSale(previewData);
    setIsPrintPreviewOnly(true);
    setIsPrintOpen(true);
  };

  const handlePreviewRecentSale = async (recentSale) => {
    if (!recentSale || !recentSale.id) return;
    try {
      const res = await fetch(`${API}/sales/${recentSale.id}`);
      if (res.ok) {
        const json = await res.json();
        const saleData = json?.data || json;
        setPrintSale(saleData);
        setIsPrintPreviewOnly(true);
        setIsPrintOpen(true);
      }
    } catch (err) {
      console.error('Failed to preview recent sale:', err);
    }
  };

  const handleSaveSale = async (e) => {
    e.preventDefault();
    setError('');
    setPopupMsg('');

    if (!customerId)
      return setPopupMsg(
        '⚠️ Please select a customer — sales invoices cannot be saved without selecting a customer.'
      );
    if (!items.length) return setError('Please add at least one product');

    for (const it of items) {
      if (it.is_serial_tracked) {
        if (!it.serials || it.serials.length === 0) {
          setExpandedId(it.localId);
          return setError(
            `"${
              it.full_name || it.name
            }" is Serial/Barcode-tracked — please scan or add serial numbers before saving.`
          );
        }
        if (Number(it.quantity || 0) !== it.serials.length) {
          return setError(
            `"${it.full_name || it.name}" quantity (${
              it.quantity
            }) must match the number of attached serials (${it.serials.length}).`
          );
        }
      }
      if (it.is_warranty_required) {
        if (
          it.warranty_months === '' ||
          it.warranty_months === null ||
          it.warranty_months === undefined ||
          Number(it.warranty_months) <= 0
        ) {
          return setError(
            `"${
              it.full_name || it.name
            }" requires warranty duration — please specify warranty months.`
          );
        }
      }
      if (Number(it.quantity || 0) <= 0) {
        return setError(
          `Please specify a valid quantity for "${it.full_name || it.name}"`
        );
      }
      if (Number(it.unit_price || 0) <= 0) {
        return setError(
          `Please specify a valid unit selling price for "${it.full_name || it.name}"`
        );
      }
    }

    const unacceptedWithAmount = tenders.filter(
      (t) => !t.isAccepted && money(t.amount) > 0
    );
    if (unacceptedWithAmount.length > 0) {
      return setPopupMsg(
        '⚠️ You have unconfirmed payment rows. Please click "✓ Accept" to confirm each payment entry, or "Cancel" to remove it before saving.'
      );
    }
    if (paid > totalPayable) {
      return setPopupMsg(
        `⚠️ Total paid amount (${taka(paid)}) exceeds Total Payable (${taka(totalPayable)}). Please click "Pay Full (${taka(totalPayable)})" to adjust, or edit the payment amount.`
      );
    }

    try {
      setSaving(true);
      const isEdit = Boolean(editSale && editSale.id);
      const acceptedTenders = tenders.filter(
        (t) => t.isAccepted && money(t.amount) > 0
      );
      const payload = {
        customer_id: Number(customerId),
        subtotal,
        discount: totalDiscount,
        vat: totalVat,
        setup_charge: totalSetupCharge,
        extra_cost: totalExtraCost,
        extra_cost_category: hasExtraCost ? extraCostCategory || null : null,
        extra_cost_notes: hasExtraCost ? extraCostNotes || null : null,
        paid_amount: paid,
        loyalty_points_to_use: Number(loyaltyPointsToUse || 0),
        payment_method_id: acceptedTenders[0]?.payment_method_id || 1,
        payment_method: acceptedTenders.map((t) => t.method).join(', ') || 'Cash',
        payment_details: acceptedTenders,
        sales_person: salesPerson || null,
        destination: destination || null,
        attention: attention || null,
        invoice_date: invoiceDate || null,
        admin_pin: editSale?.admin_pin || editSale?.adminPin || undefined,
        items: items.map((it) => ({
          product_id: it.product_id,
          quantity: Number(it.quantity),
          unit_price: money(it.unit_price),
          cost_price: money(it.cost_price),
          discount: money(it.discount),
          warranty_months: Number(it.warranty_months || 0),
          serials: it.serials || [],
        })),
      };
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

      const fullOrderForPrint = {
        ...data.data,
        customer_name: selectedCustomer?.name,
        customer_phone: selectedCustomer?.phone,
        customer_email: selectedCustomer?.email,
        customer_address: selectedCustomer?.address,
        sales_person: salesPerson || null,
        destination: destination || null,
        attention: attention || null,
        invoice_date: invoiceDate || null,
        extra_cost: totalExtraCost,
        extra_cost_category: hasExtraCost ? extraCostCategory : null,
        extra_cost_notes: hasExtraCost ? extraCostNotes : null,
        payment_details: acceptedTenders,
        items: items.map((it) => ({
          ...it,
          line_total:
            Number(it.quantity || 1) * Number(it.unit_price || 0) -
            Number(it.discount || 0),
        })),
      };

      setPrintSale(fullOrderForPrint);
      setIsPrintPreviewOnly(false);
      setIsPrintOpen(true);

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
    printSale,
    setPrintSale,
    isPrintOpen,
    setIsPrintOpen,
    isPrintPreviewOnly,
    setIsPrintPreviewOnly,
    handleClearForm,
    handleOpenPrintPreview,
    handlePreviewRecentSale,
    handleSaveSale,
  };
}

export default useSaleSaveAndPrint;
