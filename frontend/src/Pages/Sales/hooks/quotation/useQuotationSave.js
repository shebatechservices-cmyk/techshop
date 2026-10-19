import { useState } from 'react';
import API from '../../../../services/api';

const money = (val) => Number.parseFloat(val || 0) || 0;

export function useQuotationSave({
  items,
  customerId,
  customerName,
  customerPhone,
  customerAddress,
  validUntil,
  notes,
  subtotal,
  totalDiscount,
  totalVat,
  grandTotal,
  editingQuotation,
  onQuotationCreated,
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [printQuotation, setPrintQuotation] = useState(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const handleOpenPrintPreview = () => {
    if (!items.length) {
      setError('Please add at least one product to preview quotation');
      setTimeout(() => setError(''), 3000);
      return;
    }
    const previewData = {
      id: 'DRAFT',
      quotation_no: `QTN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-DRAFT`,
      created_at: new Date().toISOString(),
      customer_name: customerName || 'Valued Customer',
      customer_phone: customerPhone,
      customer_address: customerAddress,
      valid_until: validUntil,
      notes,
      subtotal,
      discount: totalDiscount,
      vat: totalVat,
      total_amount: grandTotal,
      items: items.map((it) => ({
        ...it,
        unit_discount: money(it.unit_discount || 0),
        line_total: Math.max(0, (money(it.unit_price) - money(it.unit_discount || 0)) * Number(it.quantity || 1)),
      })),
    };
    setPrintQuotation(previewData);
    setIsPrintOpen(true);
  };

  const handleSaveQuotation = async (e) => {
    e.preventDefault();
    setError('');

    if (!items.length) {
      setError('Please add at least one product to the quotation');
      return;
    }

    try {
      setSaving(true);
      const isEdit = Boolean(editingQuotation && editingQuotation.id);
      const res = await fetch(`${API}/sales/quotations${isEdit ? `/${editingQuotation.id}` : ''}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId ? Number(customerId) : null,
          customer_name: customerName || 'Valued Customer',
          customer_phone: customerPhone,
          customer_address: customerAddress,
          valid_until: validUntil,
          notes,
          subtotal,
          discount: totalDiscount,
          vat: totalVat,
          items: items.map((it) => ({
            product_id: it.product_id,
            product_name: it.product_name,
            quantity: Number(it.quantity || 1),
            unit_price: money(it.unit_price),
            unit_discount: money(it.unit_discount || 0),
            line_total: money(it.line_total),
            warranty_months: Number(it.warranty_months || 0),
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Failed to save quotation');
        return;
      }

      setPrintQuotation(data.data);
      setIsPrintOpen(true);

      if (onQuotationCreated) {
        onQuotationCreated(data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Server error while saving quotation');
    } finally {
      setSaving(false);
    }
  };

  return {
    saving,
    setSaving,
    error,
    setError,
    printQuotation,
    setPrintQuotation,
    isPrintOpen,
    setIsPrintOpen,
    handleOpenPrintPreview,
    handleSaveQuotation,
  };
}
