import { useState } from 'react';
import API from '../../../../../services/api';

const money = (val) => Number.parseFloat(val || 0) || 0;

/**
 * Hook to validate and submit sales exchange payload to the backend API.
 */
export default function useExchangeSubmission({
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
}) {
  const [processing, setProcessing] = useState(false);

  const handleSubmitExchange = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (setError) setError('');

    const selectedReturns = (returnItems || []).filter(
      (it) => it.is_selected && Number(it.return_qty || 0) > 0
    );
    if (!selectedReturns.length && !(newItems || []).length) {
      if (setError) {
        setError(
          'Please select at least one item to return or add at least one replacement item.'
        );
      }
      return;
    }

    // Validation for new replacement items
    for (const it of newItems || []) {
      if (it.is_serial_tracked) {
        if (!it.serials || it.serials.length === 0) {
          if (setExpandedId) setExpandedId(it.localId);
          if (setError) {
            setError(
              `"${it.full_name || it.name}" requires serial/barcode(s). Please scan or input serials.`
            );
          }
          return;
        }
        if (Number(it.quantity || 0) !== it.serials.length) {
          if (setError) {
            setError(
              `"${it.full_name || it.name}" quantity (${it.quantity}) must match scanned serial count (${it.serials.length}).`
            );
          }
          return;
        }
      }
      if (it.is_warranty_required) {
        if (
          it.warranty_months === '' ||
          it.warranty_months === null ||
          Number(it.warranty_months) <= 0
        ) {
          if (setError) {
            setError(`"${it.full_name || it.name}" requires warranty duration.`);
          }
          return;
        }
      }
      if (Number(it.quantity || 0) <= 0) {
        if (setError) {
          setError(
            `Please specify valid quantity for "${it.full_name || it.name}"`
          );
        }
        return;
      }
    }

    try {
      setProcessing(true);
      const payload = {
        original_sale_id: originalSale?.id,
        original_invoice_no: originalSale?.invoice_no,
        customer_id: originalSale?.customer_id,
        returned_items: selectedReturns.map((r) => ({
          product_id: r.product_id,
          name: r.name,
          quantity: Number(r.return_qty),
          unit_price: Number(r.unit_price),
          condition: r.condition,
          reason: r.reason || exchangeNotes,
          serials: r.selected_serials,
        })),
        new_items: (newItems || []).map((n) => ({
          product_id: n.product_id,
          quantity: Number(n.quantity),
          unit_price: money(n.unit_price),
          cost_price: money(n.cost_price),
          warranty_months: Number(n.warranty_months || 0),
          serials: n.serials || [],
        })),
        return_subtotal: returnSubtotal,
        new_subtotal: newSubtotal,
        paid_amount: money(paidAmount),
        payment_method_id: 1,
        payment_details:
          money(paidAmount) > 0
            ? [
                {
                  method: paymentMethod,
                  amount: money(paidAmount),
                  isAccepted: true,
                },
              ]
            : [],
        sales_person: originalSale?.sales_person || null,
        notes:
          exchangeNotes ||
          `Exchange for invoice #${originalSale?.invoice_no}`,
      };

      const res = await fetch(`${API}/sales/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (setError) setError(data.message || 'Failed to complete exchange');
        return;
      }

      if (onExchangeComplete) {
        onExchangeComplete(data.data);
      }
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error('Exchange error:', err);
      if (setError) setError('Server error while processing exchange');
    } finally {
      setProcessing(false);
    }
  };

  return {
    processing,
    handleSubmitExchange,
  };
}
