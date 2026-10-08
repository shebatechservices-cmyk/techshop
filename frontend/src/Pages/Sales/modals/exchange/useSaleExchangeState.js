import { useState, useEffect, useMemo, useRef } from 'react';
import API from '../../../../services/api';
import {
  fullCatalogName,
  isProductSerialTracked,
  isProductWarrantyRequired,
} from '../../../../utils/productUtils';

const money = (val) => Number.parseFloat(val || 0) || 0;

export default function useSaleExchangeState({
  isOpen,
  saleId,
  products = [],
  onExchangeComplete,
  onClose,
}) {
  const [loading, setLoading] = useState(true);
  const [originalSale, setOriginalSale] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [newItems, setNewItems] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeError, setBarcodeError] = useState({});
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [exchangeNotes, setExchangeNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Fetch original sale details when modal opens
  useEffect(() => {
    if (isOpen && saleId) {
      setLoading(true);
      setError('');
      fetch(`${API}/sales/${saleId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success && data.data) {
            const sale = data.data;
            setOriginalSale(sale);
            const items = (sale.items || []).map((it) => ({
              originalItemId: it.id,
              product_id: it.product_id,
              name: it.product_name || it.name || 'Product',
              original_qty: Number(it.quantity || 1),
              return_qty: Number(it.quantity || 1),
              unit_price: money(it.unit_price),
              is_selected: true,
              serials: Array.isArray(it.serials) ? it.serials : [],
              selected_serials: Array.isArray(it.serials) ? [...it.serials] : [],
              condition: 'Good',
              reason: '',
            }));
            setReturnItems(items);
            setNewItems([]);
          } else {
            setError(data.message || 'Failed to load sale details');
          }
        })
        .catch((err) => {
          console.error(err);
          setError('Failed to fetch invoice details from server');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, saleId]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products for replacement search
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return (products || []).filter((p) => {
      const full = fullCatalogName(p).toLowerCase();
      const name = (p.name || '').toLowerCase();
      const brand = (p.brand_name || '').toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      const barcode = (p.barcode || '').toLowerCase();
      return (
        full.includes(q) ||
        name.includes(q) ||
        brand.includes(q) ||
        sku.includes(q) ||
        barcode.includes(q)
      );
    });
  }, [searchQuery, products]);

  const addNewProduct = (prod, initialSerial = '') => {
    const isTracked = isProductSerialTracked(prod);
    const isWarrantyReq = isProductWarrantyRequired(prod);
    const fullName = fullCatalogName(prod);
    if (Number(prod.stock || 0) <= 0) {
      setError(`"${fullName}" has no stock available.`);
      return;
    }

    const startSerials = initialSerial ? [initialSerial] : [];
    const catalogWarranty =
      prod.warranty_months !== undefined && prod.warranty_months !== null
        ? Number(prod.warranty_months)
        : isWarrantyReq
        ? ''
        : 0;

    const exchangePrice = Number(
      prod.sale_price !== undefined &&
        prod.sale_price !== null &&
        Number(prod.sale_price) > 0
        ? prod.sale_price
        : prod.salePrice !== undefined &&
          prod.salePrice !== null &&
          Number(prod.salePrice) > 0
        ? prod.salePrice
        : prod.selling_price !== undefined &&
          prod.selling_price !== null &&
          Number(prod.selling_price) > 0
        ? prod.selling_price
        : prod.final_sale_price !== undefined &&
          prod.final_sale_price !== null &&
          Number(prod.final_sale_price) > 0
        ? prod.final_sale_price
        : prod.mrp !== undefined &&
          prod.mrp !== null &&
          Number(prod.mrp) > 0
        ? prod.mrp
        : prod.cost_price || prod.costPrice || prod.purchase_price || 0
    );
    const exchangeCost = Number(
      prod.cost_price !== undefined && prod.cost_price !== null
        ? prod.cost_price
        : prod.costPrice !== undefined && prod.costPrice !== null
        ? prod.costPrice
        : prod.purchase_price || prod.last_purchase_price || 0
    );
    const line = {
      localId: `${Date.now()}-${prod.id}`,
      product_id: prod.id,
      name: fullName,
      full_name: fullName,
      brand_name: prod.brand_name || '',
      stock: Number(prod.stock || 0),
      quantity: isTracked ? startSerials.length : 1,
      unit_price: exchangePrice,
      cost_price: exchangeCost,
      warranty_months: catalogWarranty,
      serials: startSerials,
      is_serial_tracked: isTracked,
      is_warranty_required: isWarrantyReq,
    };
    setNewItems((prev) => [...prev, line]);
    if (isTracked && startSerials.length === 0) {
      setExpandedId(line.localId);
    }
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const updateNewItem = (localId, patch) => {
    setNewItems((prev) =>
      prev.map((it) => (it.localId === localId ? { ...it, ...patch } : it))
    );
  };

  const removeNewItem = (localId) => {
    setNewItems((prev) => prev.filter((it) => it.localId !== localId));
  };

  const handleAddBarcode = (localId) => {
    const raw = barcodeInput.trim();
    if (!raw) return;
    const targetItem = newItems.find((it) => it.localId === localId);
    if (!targetItem) return;

    const existing = targetItem.serials || [];
    if (existing.map((s) => s.toLowerCase()).includes(raw.toLowerCase())) {
      setBarcodeError((prev) => ({
        ...prev,
        [localId]: 'Barcode already scanned',
      }));
      return;
    }

    const newSerials = [...existing, raw];
    const newQty = targetItem.is_serial_tracked
      ? newSerials.length
      : Math.max(Number(targetItem.quantity || 1), newSerials.length);
    updateNewItem(localId, { serials: newSerials, quantity: newQty });
    setBarcodeInput('');
    setBarcodeError((prev) => ({ ...prev, [localId]: '' }));
  };

  const handleRemoveBarcode = (localId, code) => {
    const targetItem = newItems.find((it) => it.localId === localId);
    if (!targetItem) return;
    const newSerials = (targetItem.serials || []).filter((s) => s !== code);
    const newQty = targetItem.is_serial_tracked
      ? newSerials.length
      : Math.max(
          1,
          (targetItem.serials || []).length > 1
            ? Number(targetItem.quantity || 1)
            : 1
        );
    updateNewItem(localId, { serials: newSerials, quantity: newQty });
  };

  // Financial calculations
  const returnSubtotal = useMemo(() => {
    return returnItems
      .filter((it) => it.is_selected)
      .reduce(
        (sum, it) =>
          sum + Number(it.return_qty || 0) * Number(it.unit_price || 0),
        0
      );
  }, [returnItems]);

  const newSubtotal = useMemo(() => {
    return newItems.reduce(
      (sum, it) => sum + Number(it.quantity || 0) * Number(it.unit_price || 0),
      0
    );
  }, [newItems]);

  const netDifference = newSubtotal - returnSubtotal;

  // Auto set paid amount when difference changes
  useEffect(() => {
    if (netDifference > 0) {
      setPaidAmount(String(netDifference));
    } else if (netDifference < 0) {
      setPaidAmount(String(Math.abs(netDifference)));
    } else {
      setPaidAmount('0');
    }
  }, [netDifference]);

  const handleSubmitExchange = async (e) => {
    e.preventDefault();
    setError('');

    const selectedReturns = returnItems.filter(
      (it) => it.is_selected && Number(it.return_qty || 0) > 0
    );
    if (!selectedReturns.length && !newItems.length) {
      return setError(
        'Please select at least one item to return or add at least one replacement item.'
      );
    }

    // Validation for new replacement items
    for (const it of newItems) {
      if (it.is_serial_tracked) {
        if (!it.serials || it.serials.length === 0) {
          setExpandedId(it.localId);
          return setError(
            `"${it.full_name || it.name}" requires serial/barcode(s). Please scan or input serials.`
          );
        }
        if (Number(it.quantity || 0) !== it.serials.length) {
          return setError(
            `"${it.full_name || it.name}" quantity (${it.quantity}) must match scanned serial count (${it.serials.length}).`
          );
        }
      }
      if (it.is_warranty_required) {
        if (
          it.warranty_months === '' ||
          it.warranty_months === null ||
          Number(it.warranty_months) <= 0
        ) {
          return setError(
            `"${it.full_name || it.name}" requires warranty duration.`
          );
        }
      }
      if (Number(it.quantity || 0) <= 0) {
        return setError(
          `Please specify valid quantity for "${it.full_name || it.name}"`
        );
      }
    }

    try {
      setProcessing(true);
      const payload = {
        original_sale_id: originalSale.id,
        original_invoice_no: originalSale.invoice_no,
        customer_id: originalSale.customer_id,
        returned_items: selectedReturns.map((r) => ({
          product_id: r.product_id,
          name: r.name,
          quantity: Number(r.return_qty),
          unit_price: Number(r.unit_price),
          condition: r.condition,
          reason: r.reason || exchangeNotes,
          serials: r.selected_serials,
        })),
        new_items: newItems.map((n) => ({
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
        sales_person: originalSale.sales_person || null,
        notes:
          exchangeNotes ||
          `Exchange for invoice #${originalSale.invoice_no}`,
      };

      const res = await fetch(`${API}/sales/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Failed to complete exchange');
        return;
      }

      if (onExchangeComplete) {
        onExchangeComplete(data.data);
      }
      onClose();
    } catch (err) {
      console.error('Exchange error:', err);
      setError('Server error while processing exchange');
    } finally {
      setProcessing(false);
    }
  };

  return {
    loading,
    error,
    setError,
    originalSale,
    returnItems,
    setReturnItems,
    newItems,
    expandedId,
    setExpandedId,
    searchQuery,
    setSearchQuery,
    isSearchOpen,
    setIsSearchOpen,
    barcodeInput,
    setBarcodeInput,
    barcodeError,
    paidAmount,
    setPaidAmount,
    paymentMethod,
    setPaymentMethod,
    exchangeNotes,
    setExchangeNotes,
    processing,
    searchContainerRef,
    searchInputRef,
    filteredProducts,
    addNewProduct,
    updateNewItem,
    removeNewItem,
    handleAddBarcode,
    handleRemoveBarcode,
    returnSubtotal,
    newSubtotal,
    netDifference,
    handleSubmitExchange,
  };
}
