import React, { useState, useEffect, useMemo, useRef } from 'react';
import API from '../../../services/api';
import SalePrintModal from './SalePrintModal';
import { fullCatalogName, productLabel } from '../../../utils/productUtils';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function SaleQuotationModal({
  isOpen,
  onClose,
  customers = [],
  products = [],
  newlyCreatedCustomer,
  onOpenAddCustomer,
  onQuotationCreated,
  editingQuotation = null,
}) {
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState('1. Prices are valid for 7 days from quotation date.\n2. Standard manufacturer warranty applies where indicated.');
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [vat, setVat] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [printQuotation, setPrintQuotation] = useState(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const searchContainerRef = useRef(null);

  // Auto-select newly created customer
  useEffect(() => {
    if (newlyCreatedCustomer && newlyCreatedCustomer.id) {
      setCustomerId(String(newlyCreatedCustomer.id));
      setCustomerName(newlyCreatedCustomer.name || '');
      setCustomerPhone(newlyCreatedCustomer.phone || '');
      setCustomerAddress(newlyCreatedCustomer.address || '');
    }
  }, [newlyCreatedCustomer]);

  // Hydrate form when editing an existing quotation
  useEffect(() => {
    if (isOpen && editingQuotation && editingQuotation.id) {
      setCustomerId(editingQuotation.customer_id ? String(editingQuotation.customer_id) : '');
      setCustomerName(editingQuotation.customer_name || '');
      setCustomerPhone(editingQuotation.customer_phone || '');
      setCustomerAddress(editingQuotation.customer_address || '');
      setValidUntil(editingQuotation.valid_until ? String(editingQuotation.valid_until).slice(0, 10) : '');
      setNotes(editingQuotation.notes || '');
      setDiscount(money(editingQuotation.discount));
      setVat(money(editingQuotation.vat));
      setItems(
        Array.isArray(editingQuotation.items)
          ? editingQuotation.items.map((it, idx) => {
              const prodInList = (products || []).find((p) => p.id === it.product_id);
              const fullName = fullCatalogName(prodInList || it);
              return {
                localId: `${Date.now()}-${idx}`,
                product_id: it.product_id,
                product_name: fullName,
                full_name: fullName,
                brand_name: it.brand_name || (prodInList && prodInList.brand_name) || '',
                quantity: Number(it.quantity || 1),
                unit_price: money(it.unit_price),
                line_total: money(it.line_total) || (Number(it.quantity || 1) * money(it.unit_price)),
                warranty_months: it.warranty_months !== undefined && it.warranty_months !== null ? Number(it.warranty_months) : (prodInList ? Number(prodInList.warranty_months || 0) : 0),
              };
            })
          : []
      );
      setError('');
    }
  }, [isOpen, editingQuotation, products]);

  // When customer dropdown changes
  const handleCustomerChange = (idStr) => {
    setCustomerId(idStr);
    const sel = customers.find((c) => String(c.id) === String(idStr));
    if (sel) {
      setCustomerName(sel.name || '');
      setCustomerPhone(sel.phone || '');
      setCustomerAddress(sel.address || '');
    } else {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
    }
  };

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products for search (quotations only quote items from current inventory stock, no stock effect)
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return (products || []).filter((p) => {
      if (Number(p.stock || 0) <= 0) return false;
      const full = fullCatalogName(p).toLowerCase();
      const name = (p.name || '').toLowerCase();
      const brand = (p.brand_name || '').toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      const barcode = (p.barcode || '').toLowerCase();
      return full.includes(q) || name.includes(q) || brand.includes(q) || sku.includes(q) || barcode.includes(q);
    }).slice(0, 15);
  }, [searchQuery, products]);

  const handleAddItem = (prod) => {
    const fullName = fullCatalogName(prod);
    const existing = items.find((it) => it.product_id === prod.id);
    if (existing) {
      setItems((prev) =>
        prev.map((it) =>
          it.product_id === prod.id ? { ...it, quantity: it.quantity + 1, line_total: (it.quantity + 1) * it.unit_price } : it
        )
      );
    } else {
      const price = Number(
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
      setItems((prev) => [
        ...prev,
        {
          localId: `${Date.now()}-${prod.id}`,
          product_id: prod.id,
          product_name: fullName,
          full_name: fullName,
          brand_name: prod.brand_name || '',
          quantity: 1,
          unit_price: price,
          line_total: price,
          warranty_months: prod.warranty_months !== undefined && prod.warranty_months !== null ? Number(prod.warranty_months) : 0,
        },
      ]);
    }
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const handleUpdateItem = (localId, field, val) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.localId !== localId) return it;
        const updated = { ...it, [field]: val };
        const qty = Number(field === 'quantity' ? val : it.quantity) || 1;
        const price = Number(field === 'unit_price' ? val : it.unit_price) || 0;
        updated.line_total = qty * price;
        return updated;
      })
    );
  };

  const handleRemoveItem = (localId) => {
    setItems((prev) => prev.filter((it) => it.localId !== localId));
  };

  const subtotal = items.reduce((sum, it) => sum + (Number(it.line_total) || 0), 0);
  const totalDiscount = money(discount);
  const totalVat = money(vat);
  const grandTotal = Math.max(0, subtotal - totalDiscount + totalVat);

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
        line_total: money(it.unit_price) * Number(it.quantity || 1),
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
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            background: 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>📋</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                New Sales Quotation
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#c7d2fe' }}>
                Prepare formal pricing quotes for corporate, wholesale, or retail clients
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

        {/* Modal Body */}
        <form onSubmit={handleSaveQuotation} style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Customer & Quote Meta Card */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '18px',
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr 1fr',
              gap: '14px',
              alignItems: 'flex-end',
            }}
          >
            {/* Customer Select + Add Button */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>
                Customer / Client
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <select
                  value={customerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.86rem',
                    background: '#ffffff',
                    outline: 'none',
                  }}
                >
                  <option value="">-- Choose Registered Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenAddCustomer) onOpenAddCustomer();
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #6366f1',
                    background: '#eef2ff',
                    color: '#4f46e5',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                  }}
                  title="Add New Customer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Manual Client Name if Walk-in */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>
                Client Name
              </label>
              <input
                type="text"
                placeholder="Walk-in / Company name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.86rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Valid Until Date */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>
                Valid Until
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.86rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Product Search & Dropdown */}
          <div ref={searchContainerRef} style={{ position: 'relative', marginBottom: '18px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                placeholder="🔍 Search products by name, SKU, or barcode to add to quotation..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '9px',
                  border: '1.5px solid #6366f1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  background: '#ffffff',
                }}
              />
            </div>

            {/* Floating Dropdown */}
            {isSearchOpen && filteredProducts.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 20,
                  marginTop: '4px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  boxShadow: '0 12px 28px rgba(0, 0, 0, 0.15)',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  padding: '6px',
                }}
              >
                {filteredProducts.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => handleAddItem(prod)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                      fontSize: '0.86rem',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#eef2ff')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div>
                      <strong style={{ color: '#0f172a' }}>{fullCatalogName(prod)}</strong>
                      <span style={{ fontSize: '0.76rem', color: '#64748b', marginLeft: '8px' }}>
                        SKU: {prod.sku || 'N/A'} · Stock: {prod.stock || 0}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, color: '#4f46e5' }}>
                      {taka(prod.selling_price || prod.purchase_price || 0)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quotation Items Table */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '18px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '10px 12px' }}>Product Description</th>
                  <th style={{ padding: '10px 12px', width: '110px' }}>Unit Rate ৳</th>
                  <th style={{ padding: '10px 12px', width: '90px' }}>Qty</th>
                  <th style={{ padding: '10px 12px', width: '110px' }}>Warranty</th>
                  <th style={{ padding: '10px 12px', width: '120px', textAlign: 'right' }}>Total ৳</th>
                  <th style={{ padding: '10px 12px', width: '40px', textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                      No items added yet. Search and click products above to add them to this quotation.
                    </td>
                  </tr>
                ) : (
                  items.map((it) => (
                    <tr key={it.localId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 12px' }}>
                        <strong style={{ color: '#0f172a' }}>{it.product_name}</strong>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={it.unit_price}
                          onChange={(e) => handleUpdateItem(it.localId, 'unit_price', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.85rem',
                          }}
                        />
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <input
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={(e) => handleUpdateItem(it.localId, 'quantity', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.85rem',
                          }}
                        />
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <input
                          type="number"
                          min="0"
                          value={it.warranty_months}
                          onChange={(e) => handleUpdateItem(it.localId, 'warranty_months', e.target.value)}
                          placeholder="0 Mos"
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.85rem',
                          }}
                        />
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        {taka(it.line_total)}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(it.localId)}
                          style={{
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: '6px',
                            width: '26px',
                            height: '26px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                          }}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Notes & Financial Breakdown Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '18px', alignItems: 'flex-start' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>
                Quotation Notes, Delivery & Payment Terms
              </label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specify terms, delivery timeframe, or account details..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.84rem',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem' }}>
                <span>Subtotal:</span>
                <strong>{taka(subtotal)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: '0.85rem' }}>
                <span>Discount ৳:</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  style={{
                    width: '90px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    textAlign: 'right',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: '0.85rem' }}>
                <span>VAT / Tax ৳:</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={vat}
                  onChange={(e) => setVat(e.target.value)}
                  style={{
                    width: '90px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    textAlign: 'right',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0 4px 0',
                  borderTop: '2px solid #cbd5e1',
                  marginTop: '8px',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: '#0f172a',
                }}
              >
                <span>Grand Total:</span>
                <span style={{ color: '#4f46e5' }}>{taka(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '22px',
              borderTop: '1px solid #f1f5f9',
              paddingTop: '16px',
            }}
          >
            <button
              type="button"
              onClick={handleOpenPrintPreview}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1.5px solid #4f46e5',
                background: '#eef2ff',
                color: '#4f46e5',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              🖨️ Print Preview
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '9px 24px',
                borderRadius: '8px',
                border: 'none',
                background: '#4f46e5',
                color: '#ffffff',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)',
              }}
            >
              {saving ? 'Saving...' : editingQuotation && editingQuotation.id ? '✓ Update Quotation' : '✓ Save Quotation'}
            </button>
          </div>
        </form>
      </div>

      {/* Quotation Print Modal */}
      <SalePrintModal
        isOpen={isPrintOpen}
        onClose={() => {
          setIsPrintOpen(false);
          if (printQuotation && printQuotation.id !== 'DRAFT') {
            onClose();
          }
        }}
        sale={printQuotation}
        isQuotation={true}
      />
    </div>
  );
}
