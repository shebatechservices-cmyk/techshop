import React, { useState, useEffect, useMemo } from 'react';
import API from '../../services/api';

const today = () => new Date().toISOString().slice(0, 10);
const futureDate = (days = 15) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const productLabel = (product) => {
  if (!product) return '';
  const parts = [product.brand_name, product.name, product.model_name, product.series_name]
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index);
  return parts.length ? parts.join(' ') : (product.name || 'Product');
};

export default function PurchaseQuotationModal({
  isOpen,
  onClose,
  onQuotationCreated,
  suppliers: externalSuppliers,
  newlyCreatedSupplier,
  onOpenAddSupplier,
  onOpenAddProduct,
  editingQuotation = null,
}) {
  const [suppliers, setSuppliers] = useState(Array.isArray(externalSuppliers) ? externalSuppliers : []);
  const [products, setProducts] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [reference, setReference] = useState('');
  const [validUntil, setValidUntil] = useState(futureDate(15));
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);
  
  // Product Search & Add
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (Array.isArray(externalSuppliers) && externalSuppliers.length > 0) {
      setSuppliers(externalSuppliers);
    }
  }, [externalSuppliers]);

  useEffect(() => {
    if (isOpen && editingQuotation && editingQuotation.id) {
      setSupplierId(editingQuotation.supplier_id ? String(editingQuotation.supplier_id) : '');
      setReference(editingQuotation.reference || '');
      setValidUntil(editingQuotation.valid_until ? String(editingQuotation.valid_until).slice(0, 10) : '');
      setNotes(editingQuotation.notes || '');
      setItems(
        Array.isArray(editingQuotation.items)
          ? editingQuotation.items.map((it, idx) => ({
              localId: `${Date.now()}-${idx}`,
              product_id: it.product_id || null,
              name: it.product_name || 'Product',
              quantity: Number(it.quantity || 1),
              unit_price: Number(it.unit_price || 0) || '',
              notes: it.notes || '',
            }))
          : []
      );
      setError('');
    }
  }, [isOpen, editingQuotation]);

  useEffect(() => {
    if (newlyCreatedSupplier && newlyCreatedSupplier.id) {
      setSuppliers((prev) => {
        const found = prev.some((s) => s.id === newlyCreatedSupplier.id);
        if (found) return prev;
        return [...prev, newlyCreatedSupplier];
      });
      setSupplierId(String(newlyCreatedSupplier.id));
    }
  }, [newlyCreatedSupplier]);

  useEffect(() => {
    if (!isOpen) return;

    const loadOptions = async () => {
      try {
        const suppRes = await fetch(`${API}/purchase/suppliers`).catch(() => null);
        if (suppRes && suppRes.ok) {
          const sData = await suppRes.json();
          const sList = Array.isArray(sData) ? sData : (sData.data || []);
          setSuppliers(sList);
          if (sList.length > 0 && !supplierId) {
            setSupplierId(String(sList[0].id));
          }
        }

        let pList = [];
        try {
          const prodRes = await fetch(`${API}/master/products`);
          if (prodRes.ok) {
            const pData = await prodRes.json();
            pList = Array.isArray(pData) ? pData : (pData.data || []);
          }
        } catch (_) {}

        if (!pList.length) {
          try {
            const pRes = await fetch(`${API}/products`);
            if (pRes.ok) {
              const pData = await pRes.json();
              pList = Array.isArray(pData) ? pData : (pData.data || []);
            }
          } catch (_) {}
        }
        setProducts(pList);
      } catch (err) {
        console.error(err);
      }
    };

    loadOptions();
  }, [isOpen]);

  const filteredProducts = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return list.filter((p) => {
      const full = productLabel(p).toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      const barcode = (p.barcode || '').toLowerCase();
      const cat = (p.category_name || '').toLowerCase();
      const brand = (p.brand_name || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      return (
        full.includes(q) ||
        name.includes(q) ||
        sku.includes(q) ||
        barcode.includes(q) ||
        cat.includes(q) ||
        brand.includes(q)
      );
    }).slice(0, 25);
  }, [products, searchQuery]);

  const handleAddItem = (product) => {
    setItems((prev) => {
      const exists = prev.find((it) => it.product_id === product.id);
      if (exists) {
        return prev.map((it) =>
          it.product_id === product.id
            ? { ...it, quantity: Number(it.quantity || 0) + 1 }
            : it
        );
      }
      return [
        ...prev,
        {
          localId: `${Date.now()}-${product.id}`,
          product_id: product.id,
          name: productLabel(product),
          quantity: 1,
          unit_price: Number(product.purchase_price || 0) || '',
          notes: '',
        },
      ];
    });
    setSearchQuery('');
  };

  const handleUpdateItem = (localId, field, val) => {
    setItems((prev) =>
      prev.map((it) => (it.localId === localId ? { ...it, [field]: val } : it))
    );
  };

  const handleRemoveItem = (localId) => {
    setItems((prev) => prev.filter((it) => it.localId !== localId));
  };

  const totalAmount = useMemo(() => {
    return items.reduce((sum, it) => {
      const q = Number(it.quantity) || 0;
      const p = Number(it.unit_price) || 0;
      return sum + q * p;
    }, 0);
  }, [items]);

  const totalUnits = useMemo(() => {
    return items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  }, [items]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId) {
      setError('Please select a supplier');
      return;
    }
    if (items.length === 0) {
      setError('Please add at least one product item to the quotation');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        supplier_id: Number(supplierId),
        reference: reference.trim() || null,
        valid_until: validUntil || null,
        notes: notes.trim() || null,
        items: items.map((it) => ({
          product_id: it.product_id,
          quantity: Number(it.quantity) || 1,
          unit_price: Number(it.unit_price) || 0,
          notes: it.notes || null,
        })),
      };

      const isEdit = Boolean(editingQuotation && editingQuotation.id);
      const res = await fetch(
        `${API}/purchase/quotations${isEdit ? `/${editingQuotation.id}` : ''}`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save purchase quotation');
      }

      if (onQuotationCreated) {
        onQuotationCreated(data.data || data);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save quotation');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '860px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
              {editingQuotation && editingQuotation.id ? 'Edit Purchase Quotation' : 'Create Purchase Quotation'}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Request or record price estimates from suppliers before placing an official order
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.4rem',
              cursor: 'pointer',
              color: '#94a3b8',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.875rem',
              marginBottom: '16px',
            }}>
              {error}
            </div>
          )}

          {/* Quotation Meta */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Supplier <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  required
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    background: '#fff',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.phone ? `(${s.phone})` : ''}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => onOpenAddSupplier && onOpenAddSupplier()}
                  style={{
                    width: '38px',
                    height: '38px',
                    border: '1px solid #7dd3fc',
                    borderRadius: '8px',
                    color: '#0369a1',
                    background: '#f0f9ff',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                  title="Add New Supplier"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Reference / RFQ No.
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. RFQ-2026-088"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Quotation Valid Until
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Product Search & Add Section */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '20px',
          }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
              Search & Add Products to Quotation
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products by name, brand, SKU..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    background: '#ffffff',
                  }}
                />

                {filteredProducts.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    zIndex: 20,
                    maxHeight: '200px',
                    overflowY: 'auto',
                  }}>
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleAddItem(p)}
                      style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <strong style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.92rem' }}>
                            {productLabel(p)}
                          </strong>
                          {p.category_name && (
                            <span style={{ fontSize: '0.72rem', padding: '1px 6px', background: '#e2e8f0', color: '#334155', borderRadius: '4px', fontWeight: 600 }}>
                              {p.category_name}
                            </span>
                          )}
                          {p.brand_name && (
                            <span style={{ fontSize: '0.72rem', padding: '1px 6px', background: '#e0f2fe', color: '#0369a1', borderRadius: '4px', fontWeight: 600 }}>
                              {p.brand_name}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          <span>Stock: <strong style={{ color: p.stock > 0 ? '#15803d' : '#dc2626' }}>{p.stock ?? 0}</strong></span>
                          {p.sku && <span>SKU: {p.sku}</span>}
                          {Number(p.purchase_price) > 0 && <span>Last Cost: ৳{Number(p.purchase_price).toLocaleString()}</span>}
                        </div>
                      </div>
                      <span style={{
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#ffffff',
                        background: '#4f46e5',
                        padding: '5px 12px',
                        borderRadius: '6px',
                        flexShrink: 0,
                      }}>
                        + Add Item
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                if (onClose) onClose();
                if (onOpenAddProduct) {
                  onOpenAddProduct();
                } else {
                  window.dispatchEvent(new CustomEvent('open-add-product'));
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                background: '#0f766e',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.86rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 1px 3px rgba(15,118,110,0.2)',
              }}
              title="Navigate to Catalog & open Add Product popup"
            >
              + New Product
            </button>
          </div>
        </div>

          {/* Quotation Line Items Table */}
          <div style={{
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            overflow: 'hidden',
            marginBottom: '20px',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px' }}>Product</th>
                  <th style={{ padding: '10px 14px', width: '110px' }}>Quantity</th>
                  <th style={{ padding: '10px 14px', width: '140px' }}>Est. Unit Price</th>
                  <th style={{ padding: '10px 14px', width: '140px' }}>Line Total</th>
                  <th style={{ padding: '10px 14px' }}>Specification / Notes</th>
                  <th style={{ padding: '10px 14px', width: '40px', textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                      No items added yet. Search products above to add them to this quotation.
                    </td>
                  </tr>
                ) : (
                  items.map((it) => {
                    const lineTotal = (Number(it.quantity) || 0) * (Number(it.unit_price) || 0);
                    return (
                      <tr key={it.localId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1e293b' }}>
                          {it.name}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
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
                              outline: 'none',
                              fontSize: '0.85rem',
                              boxSizing: 'border-box',
                            }}
                          />
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={it.unit_price}
                            onChange={(e) => handleUpdateItem(it.localId, 'unit_price', e.target.value)}
                            placeholder="0.00"
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              outline: 'none',
                              fontSize: '0.85rem',
                              boxSizing: 'border-box',
                            }}
                          />
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>
                          ৳ {lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <input
                            type="text"
                            value={it.notes}
                            onChange={(e) => handleUpdateItem(it.localId, 'notes', e.target.value)}
                            placeholder="e.g. 1 Year warranty"
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              outline: 'none',
                              fontSize: '0.85rem',
                              boxSizing: 'border-box',
                            }}
                          />
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(it.localId)}
                            style={{
                              background: '#fef2f2',
                              color: '#ef4444',
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              width: '28px',
                              height: '28px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                            }}
                            title="Remove item"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Totals and Notes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'flex-start' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Terms & Conditions / Remarks
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specify delivery timeline, payment conditions, or special warranties..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: '#64748b' }}>
                <span>Total Items:</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{items.length} ({totalUnits} Units)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '10px', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                <span>Estimated Total:</span>
                <span style={{ color: '#0284c7' }}>৳ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid #f1f5f9',
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '9px 24px',
                borderRadius: '8px',
                border: 'none',
                background: '#0284c7',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Saving Quotation...' : editingQuotation && editingQuotation.id ? 'Update Quotation' : 'Save Quotation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
