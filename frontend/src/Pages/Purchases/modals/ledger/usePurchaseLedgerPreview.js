import { useState, useEffect } from 'react';
import API_BASE from '../../../../services/api';

export const taka = (val) =>
  `৳${(Number(val) || 0).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function usePurchaseLedgerPreview({
  isOpen,
  onClose,
  orderId,
  purchaseOrderId,
  initialOrder = null,
  purchaseOrderData = null,
}) {
  const activeOrderId = orderId || purchaseOrderId || initialOrder?.id || purchaseOrderData?.id;
  const initial = initialOrder || purchaseOrderData;
  const [order, setOrder] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isInternalPrintOpen, setIsInternalPrintOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (onClose) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    if (initial && Array.isArray(initial.items) && initial.items.length > 0) {
      setOrder(initial);
      return;
    }
    if (!activeOrderId) return;

    let isMounted = true;
    const fetchDetails = async () => {
      setLoading(true);
      setError('');
      try {
        let res = await fetch(`${API_BASE}/purchase/${activeOrderId}`);
        if (!res.ok) {
          res = await fetch(`${API_BASE}/purchase/orders/${activeOrderId}`);
        }
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setOrder(data);
        } else {
          if (isMounted) setError('Failed to load purchase voucher details');
        }
      } catch (err) {
        console.error('Fetch purchase order details error:', err);
        if (isMounted) setError('Error connecting to server');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [isOpen, activeOrderId, initial]);

  const poNumber = order?.po_number || `PO-${order?.id || '—'}`;
  const dateStr = order?.created_at
    ? new Date(order.created_at).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

  const supplierName = order?.supplier_name || 'Vendor / Supplier';
  const supplierPhone = order?.supplier_phone || '';
  const supplierContact = order?.supplier_contact || '';
  const items = Array.isArray(order?.items) ? order.items : [];
  const payments = Array.isArray(order?.payments) ? order.payments : [];

  const itemsSubtotal = items.reduce(
    (sum, it) => sum + Number(it.cost_price || 0) * Number(it.quantity || 0),
    0
  );
  const discount = Number(order?.discount || 0);
  const extraCost = Number(order?.extra_cost || 0);
  const totalCost = Number(order?.total_cost !== undefined ? order.total_cost : Math.max(0, itemsSubtotal - discount));
  const totalPaid = Number(
    order?.total_paid !== undefined
      ? order.total_paid
      : payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
  );
  const remainingDue = Number(
    order?.total_due !== undefined ? order.total_due : Math.max(0, totalCost - totalPaid)
  );

  const handleShareWhatsApp = () => {
    let text = `*PURCHASE INVOICE - SHEBA TECHNOLOGY*\n━━━━━━━━━━━━━━━━━━━━━\n*PO No:* ${poNumber}\n*Date:* ${dateStr}\n*Supplier:* ${supplierName} (${supplierPhone || 'N/A'})\n`;
    if (order?.transaction_reference) text += `*Ref:* ${order.transaction_reference}\n`;
    text += `-------------------------------------\n*PURCHASED ITEMS:*\n`;
    items.forEach((it, idx) => {
      const name = it.full_name || it.name || it.product_name || 'Product';
      const qty = it.quantity || 1;
      const cost = Number(it.cost_price || 0);
      const total = Number(it.line_total || cost * qty);
      text += `${idx + 1}. *${name}*\n   Qty: ${qty} × ৳${cost.toLocaleString()} = ৳${total.toLocaleString()}\n`;
      if (it.serials && it.serials.length > 0) text += `   S/N: ${it.serials.join(', ')}\n`;
    });
    text += `-------------------------------------\n*Items Subtotal:* ${taka(itemsSubtotal)}\n`;
    if (discount > 0) text += `*Less Discount:* -${taka(discount)}\n`;
    text += `*Supplier Bill:* ${taka(totalCost)}\n*Paid Amount:* ${taka(totalPaid)}\n*Remaining Due:* ${remainingDue > 0 ? taka(remainingDue) : 'No Dues (Paid in Full)'}\n`;
    if (extraCost > 0) {
      text += `-------------------------------------\n*Logistics Expense (${order?.extra_cost_category || 'Transport'}):* ${taka(extraCost)}\n*Total Landed Cost:* ${taka(totalCost + extraCost)}\n`;
    }
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;

    let cleanPhone = supplierPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('01')) cleanPhone = '88' + cleanPhone;
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopySummary = () => {
    const text = `PURCHASE ORDER: ${poNumber}\nDate: ${dateStr}\nSupplier: ${supplierName} (${supplierPhone})\nTotal: ${taka(totalCost)} | Paid: ${taka(totalPaid)} | Due: ${taka(remainingDue)}`;
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  return {
    order,
    loading,
    error,
    copySuccess,
    isInternalPrintOpen,
    setIsInternalPrintOpen,
    poNumber,
    dateStr,
    supplierName,
    supplierPhone,
    supplierContact,
    items,
    payments,
    itemsSubtotal,
    extraCost,
    totalCost,
    totalPaid,
    remainingDue,
    handleShareWhatsApp,
    handleCopySummary,
  };
}
