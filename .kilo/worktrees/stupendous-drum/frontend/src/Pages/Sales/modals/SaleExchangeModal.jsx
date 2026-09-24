import React, { useState, useEffect, useMemo, useRef } from 'react';
import API from '../../../services/api';
import { fullCatalogName, isProductSerialTracked, isProductWarrantyRequired } from '../../../utils/productUtils';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function SaleExchangeModal({
  isOpen,
  onClose,
  saleId,
  products = [],
  onExchangeComplete,
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
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
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
      return full.includes(q) || name.includes(q) || brand.includes(q) || sku.includes(q) || barcode.includes(q);
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
    const catalogWarranty = prod.warranty_months !== undefined && prod.warranty_months !== null
      ? Number(prod.warranty_months)
      : (isWarrantyReq ? '' : 0);

    const exchangePrice = Number(
      prod.sale_price !== undefined && prod.sale_price !== null && Number(prod.sale_price) > 0
        ? prod.sale_price
        : (prod.salePrice !== undefined && prod.salePrice !== null && Number(prod.salePrice) > 0
          ? prod.salePrice
          : (prod.selling_price !== undefined && prod.selling_price !== null && Number(prod.selling_price) > 0
            ? prod.selling_price
            : (prod.final_sale_price !== undefined && prod.final_sale_price !== null && Number(prod.final_sale_price) > 0
              ? prod.final_sale_price
              : (prod.mrp !== undefined && prod.mrp !== null && Number(prod.mrp) > 0
                ? prod.mrp
                : (prod.cost_price || prod.costPrice || prod.purchase_price || 0)))))
    );
    const exchangeCost = Number(
      prod.cost_price !== undefined && prod.cost_price !== null
        ? prod.cost_price
        : (prod.costPrice !== undefined && prod.costPrice !== null
          ? prod.costPrice
          : (prod.purchase_price || prod.last_purchase_price || 0))
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
    setNewItems((prev) => prev.map((it) => (it.localId === localId ? { ...it, ...patch } : it)));
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
      setBarcodeError((prev) => ({ ...prev, [localId]: 'Barcode already scanned' }));
      return;
    }

    const newSerials = [...existing, raw];
    const newQty = targetItem.is_serial_tracked ? newSerials.length : Math.max(Number(targetItem.quantity || 1), newSerials.length);
    updateNewItem(localId, { serials: newSerials, quantity: newQty });
    setBarcodeInput('');
    setBarcodeError((prev) => ({ ...prev, [localId]: '' }));
  };

  const handleRemoveBarcode = (localId, code) => {
    const targetItem = newItems.find((it) => it.localId === localId);
    if (!targetItem) return;
    const newSerials = (targetItem.serials || []).filter((s) => s !== code);
    const newQty = targetItem.is_serial_tracked ? newSerials.length : Math.max(1, (targetItem.serials || []).length > 1 ? Number(targetItem.quantity || 1) : 1);
    updateNewItem(localId, { serials: newSerials, quantity: newQty });
  };

  // Financial calculations
  const returnSubtotal = useMemo(() => {
    return returnItems
      .filter((it) => it.is_selected)
      .reduce((sum, it) => sum + Number(it.return_qty || 0) * Number(it.unit_price || 0), 0);
  }, [returnItems]);

  const newSubtotal = useMemo(() => {
    return newItems.reduce((sum, it) => sum + Number(it.quantity || 0) * Number(it.unit_price || 0), 0);
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

    const selectedReturns = returnItems.filter((it) => it.is_selected && Number(it.return_qty || 0) > 0);
    if (!selectedReturns.length && !newItems.length) {
      return setError('Please select at least one item to return or add at least one replacement item.');
    }

    // Validation for new replacement items
    for (const it of newItems) {
      if (it.is_serial_tracked) {
        if (!it.serials || it.serials.length === 0) {
          setExpandedId(it.localId);
          return setError(`"${it.full_name || it.name}" requires serial/barcode(s). Please scan or input serials.`);
        }
        if (Number(it.quantity || 0) !== it.serials.length) {
          return setError(`"${it.full_name || it.name}" quantity (${it.quantity}) must match scanned serial count (${it.serials.length}).`);
        }
      }
      if (it.is_warranty_required) {
        if (it.warranty_months === '' || it.warranty_months === null || Number(it.warranty_months) <= 0) {
          return setError(`"${it.full_name || it.name}" requires warranty duration.`);
        }
      }
      if (Number(it.quantity || 0) <= 0) {
        return setError(`Please specify valid quantity for "${it.full_name || it.name}"`);
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
        payment_details: money(paidAmount) > 0 ? [{ method: paymentMethod, amount: money(paidAmount), isAccepted: true }] : [],
        sales_person: originalSale.sales_person || null,
        notes: exchangeNotes || `Exchange for invoice #${originalSale.invoice_no}`,
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

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        style={{
          background: '#f8fafc',
          borderRadius: '16px',
          width: 'min(1100px, calc(100vw - 32px))',
          maxHeight: 'calc(100vh - 32px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateRows: 'auto minmax(0, 1fr) auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>🔄</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                Sale Product Exchange
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#c7d2fe' }}>
                {originalSale ? `Exchanging items from Invoice #${originalSale.invoice_no} (${originalSale.customer_name})` : 'Loading invoice...'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#fff',
              fontSize: '1.2rem',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {error && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '0.88rem', fontWeight: 600 }}>
              ⚠️ {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading sale details...</div>
          ) : (
            <>
              {/* SECTION 1: ITEMS TO RETURN */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>
                    1. Select Items to Return (Restock & Credit)
                  </h4>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669' }}>
                    Total Return Credit: {taka(returnSubtotal)}
                  </span>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px', width: '40px' }}>Return?</th>
                      <th style={{ padding: '8px 10px' }}>Product</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', width: '90px' }}>Return Qty</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', width: '110px' }}>Unit Credit</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', width: '120px' }}>Condition</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', width: '120px' }}>Total Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnItems.map((r, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: r.is_selected ? '#f8fafc' : '#ffffff' }}>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={r.is_selected}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setReturnItems((prev) =>
                                prev.map((it, i) => (i === idx ? { ...it, is_selected: checked } : it))
                              );
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <strong>{r.name}</strong>
                          {r.serials && r.serials.length > 0 && (
                            <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>
                              S/N: {r.serials.join(', ')}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <input
                            type="number"
                            min="1"
                            max={r.original_qty}
                            disabled={!r.is_selected}
                            value={r.return_qty}
                            onChange={(e) => {
                              const val = Math.min(r.original_qty, Math.max(1, parseInt(e.target.value) || 1));
                              setReturnItems((prev) =>
                                prev.map((it, i) => (i === idx ? { ...it, return_qty: val } : it))
                              );
                            }}
                            style={{
                              width: '50px',
                              padding: '4px',
                              borderRadius: '4px',
                              border: '1px solid #cbd5e1',
                              textAlign: 'center',
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                          {taka(r.unit_price)}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <select
                            disabled={!r.is_selected}
                            value={r.condition}
                            onChange={(e) => {
                              const cond = e.target.value;
                              setReturnItems((prev) =>
                                prev.map((it, i) => (i === idx ? { ...it, condition: cond } : it))
                              );
                            }}
                            style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                          >
                            <option value="Good">Good (Restock)</option>
                            <option value="Damaged">Damaged (Quarantine)</option>
                          </select>
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                          {r.is_selected ? taka(r.return_qty * r.unit_price) : taka(0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* SECTION 2: REPLACEMENT / NEW PRODUCTS */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>
                    2. Select Replacement / New Items to Issue
                  </h4>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4338ca' }}>
                    New Items Subtotal: {taka(newSubtotal)}
                  </span>
                </div>

                {/* Product search bar */}
                <div ref={searchContainerRef} style={{ position: 'relative', marginBottom: '14px' }}>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onFocus={() => setIsSearchOpen(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchOpen(true);
                    }}
                    placeholder="🔍 Search replacement products by name, brand, SKU or barcode..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #4338ca',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {isSearchOpen && filteredProducts.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 50,
                        marginTop: '4px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                        maxHeight: '220px',
                        overflowY: 'auto',
                      }}
                    >
                      {filteredProducts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => addNewProduct(p)}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f1f5f9',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <strong>{fullCatalogName(p)}</strong>
                            <span style={{ fontSize: '0.74rem', color: '#64748b', marginLeft: '6px' }}>
                              Stock: {p.stock || 0}
                            </span>
                          </div>
                          <span style={{ fontWeight: 700, color: '#16a34a' }}>
                            {taka(p.sale_price ?? p.salePrice ?? p.selling_price ?? p.purchase_price ?? 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Replacement items table */}
                {newItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
                    No replacement items added yet. Use the search bar above to add items.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                    <thead>
                      <tr style={{ background: '#4338ca', color: '#ffffff', textAlign: 'left' }}>
                        <th style={{ padding: '8px 10px' }}>Product</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', width: '80px' }}>Warranty</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', width: '80px' }}>Qty</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right', width: '110px' }}>Price</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right', width: '110px' }}>Total</th>
                        <th style={{ padding: '8px 10px', width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {newItems.map((it) => {
                        const isSerialMissing = it.is_serial_tracked && (!it.serials || it.serials.length === 0);
                        const isWarrantyMissing = it.is_warranty_required && (it.warranty_months === '' || it.warranty_months === null || Number(it.warranty_months) <= 0);
                        const qty = it.is_serial_tracked ? (it.serials || []).length : Number(it.quantity || 1);
                        const isExpanded = expandedId === it.localId;

                        return (
                          <React.Fragment key={it.localId}>
                            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px 10px' }}>
                                <div style={{ fontWeight: 700, color: '#1e293b' }}>{it.full_name || it.name}</div>
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                                  {it.is_serial_tracked && (
                                    <span style={{ fontSize: '0.68rem', color: isSerialMissing ? '#b91c1c' : '#4f46e5', background: isSerialMissing ? '#fef2f2' : '#eef2ff', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                                      {isSerialMissing ? '⚠️ Serial Required' : 'Serial Tracked'}
                                    </span>
                                  )}
                                  {(it.serials || []).map((s, sIdx) => (
                                    <span key={sIdx} style={{ fontSize: '0.68rem', fontFamily: 'monospace', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '1px 5px', borderRadius: '3px' }}>
                                      {s}{' '}
                                      <button type="button" onClick={() => handleRemoveBarcode(it.localId, s)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}>
                                        ×
                                      </button>
                                    </span>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => setExpandedId(isExpanded ? null : it.localId)}
                                    style={{
                                      fontSize: '0.68rem',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      border: isSerialMissing ? '1.5px solid #ef4444' : '1px dashed #cbd5e1',
                                      background: isSerialMissing ? '#fef2f2' : '#f8fafc',
                                      color: isSerialMissing ? '#dc2626' : '#4338ca',
                                      cursor: 'pointer',
                                      fontWeight: 700,
                                    }}
                                  >
                                    {isExpanded ? '✕ Close' : isSerialMissing ? '⚠️ + Add Serial' : '+ Barcode'}
                                  </button>
                                </div>
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                <input
                                  type="number"
                                  min="0"
                                  value={it.warranty_months !== undefined ? it.warranty_months : ''}
                                  onChange={(e) => updateNewItem(it.localId, { warranty_months: e.target.value })}
                                  placeholder={it.is_warranty_required ? 'Req' : '0'}
                                  style={{
                                    width: '46px',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    border: isWarrantyMissing ? '2px solid #ef4444' : '1px solid #cbd5e1',
                                    backgroundColor: isWarrantyMissing ? '#fef2f2' : '#ffffff',
                                    color: isWarrantyMissing ? '#b91c1c' : '#1e293b',
                                    textAlign: 'center',
                                  }}
                                />
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                {it.is_serial_tracked ? (
                                  <input
                                    type="number"
                                    readOnly
                                    value={qty}
                                    title="Auto-calculated from serials count"
                                    style={{
                                      width: '46px',
                                      padding: '4px',
                                      borderRadius: '4px',
                                      border: isSerialMissing ? '2px solid #ef4444' : '1px solid #cbd5e1',
                                      backgroundColor: isSerialMissing ? '#fef2f2' : '#f1f5f9',
                                      color: isSerialMissing ? '#b91c1c' : '#475569',
                                      textAlign: 'center',
                                      fontWeight: 700,
                                    }}
                                  />
                                ) : (
                                  <input
                                    type="number"
                                    min="1"
                                    value={it.quantity || 1}
                                    onChange={(e) => updateNewItem(it.localId, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                                    style={{ width: '46px', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'center' }}
                                  />
                                )}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                                {taka(it.unit_price)}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>
                                {taka(qty * Number(it.unit_price || 0))}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => removeNewItem(it.localId)}
                                  style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem' }}
                                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr>
                                <td colSpan="6" style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px dashed #cbd5e1' }}>
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4338ca' }}>📦 Scan Serial / Barcode:</span>
                                    <input
                                      type="text"
                                      value={barcodeInput}
                                      onChange={(e) => setBarcodeInput(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleAddBarcode(it.localId);
                                        }
                                      }}
                                      placeholder="Scan barcode or enter serial number..."
                                      style={{ padding: '5px 8px', borderRadius: '4px', border: '1px solid #818cf8', fontSize: '0.82rem', flex: 1, maxWidth: '300px' }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleAddBarcode(it.localId)}
                                      style={{ padding: '5px 10px', background: '#4338ca', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                      + Add
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* SECTION 3: RECONCILIATION SUMMARY */}
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '16px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>
                  3. Exchange Settlement & Payment
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ padding: '10px 14px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                    <div style={{ fontSize: '0.74rem', color: '#065f46', fontWeight: 700, textTransform: 'uppercase' }}>Return Credit Value</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#047857' }}>{taka(returnSubtotal)}</div>
                  </div>
                  <div style={{ padding: '10px 14px', background: '#eef2ff', borderRadius: '8px', border: '1px solid #c7d2fe' }}>
                    <div style={{ fontSize: '0.74rem', color: '#3730a3', fontWeight: 700, textTransform: 'uppercase' }}>New Items Subtotal</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#4338ca' }}>{taka(newSubtotal)}</div>
                  </div>
                  <div style={{ padding: '10px 14px', background: netDifference >= 0 ? '#fff7ed' : '#f0f9ff', borderRadius: '8px', border: `1px solid ${netDifference >= 0 ? '#fed7aa' : '#bae6fd'}` }}>
                    <div style={{ fontSize: '0.74rem', color: netDifference >= 0 ? '#9a3412' : '#0369a1', fontWeight: 700, textTransform: 'uppercase' }}>
                      {netDifference > 0 ? 'Customer Owes (Extra)' : netDifference < 0 ? 'Customer Refund / Credit' : 'Even Exchange (৳0)'}
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: netDifference > 0 ? '#c2410c' : netDifference < 0 ? '#0284c7' : '#15803d' }}>
                      {taka(Math.abs(netDifference))}
                    </div>
                  </div>
                </div>

                {netDifference !== 0 && (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        {netDifference > 0 ? 'Amount Paid by Customer:' : 'Amount Refunded to Customer (Cash):'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                      />
                    </div>
                    {netDifference > 0 && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                          Payment Method:
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                        >
                          <option value="Cash">Cash Drawer</option>
                          <option value="Bank">Bank Transfer</option>
                          <option value="MFS">bKash / Nagad</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#475569',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmitExchange}
            disabled={processing || loading}
            style={{
              padding: '8px 24px',
              borderRadius: '8px',
              border: 'none',
              background: '#4338ca',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: processing || loading ? 'not-allowed' : 'pointer',
              opacity: processing || loading ? 0.7 : 1,
            }}
          >
            {processing ? 'Processing Exchange...' : '✓ Confirm & Create Exchange Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}
