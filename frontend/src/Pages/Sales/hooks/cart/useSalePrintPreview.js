import { useState } from 'react';
import API from '../../../../services/api';
import { money } from '../useSalePricingAndCharges';
import { buildSalePrintData } from './salePayloadHelper';

export function useSalePrintPreview({
  items,
  subtotal,
  totalDiscount,
  totalVat,
  totalSetupCharge,
  totalExtraCost,
  currentSaleTotal,
  paid,
  due,
  tenders,
  selectedCustomer,
  salesPerson,
  destination,
  attention,
  invoiceDate,
  hasExtraCost,
  extraCostCategory,
  extraCostNotes,
  setError,
}) {
  const [printSale, setPrintSale] = useState(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isPrintPreviewOnly, setIsPrintPreviewOnly] = useState(false);

  const handleOpenPrintPreview = () => {
    if (!items.length) {
      setError('Please add at least one product to preview invoice');
      setTimeout(() => setError(''), 3000);
      return;
    }
    const previewData = buildSalePrintData({
      baseData: {
        id: 'DRAFT',
        invoice_no: `INV-${new Date()
          .toISOString()
          .slice(0, 10)
          .replace(/-/g, '')}-DRAFT`,
        created_at: new Date().toISOString(),
        total_amount: currentSaleTotal,
        paid_amount: paid,
        due_amount: due,
        subtotal,
        discount: totalDiscount,
        vat: totalVat,
        setup_charge: totalSetupCharge,
        payment_method: tenders.map((t) => t.method).join(', ') || 'Cash',
      },
      selectedCustomer,
      salesPerson,
      destination,
      attention,
      invoiceDate,
      totalExtraCost,
      hasExtraCost,
      extraCostCategory,
      extraCostNotes,
      paymentDetails: tenders.filter((t) => money(t.amount) > 0),
      items,
    });
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

  return {
    printSale,
    setPrintSale,
    isPrintOpen,
    setIsPrintOpen,
    isPrintPreviewOnly,
    setIsPrintPreviewOnly,
    handleOpenPrintPreview,
    handlePreviewRecentSale,
  };
}
