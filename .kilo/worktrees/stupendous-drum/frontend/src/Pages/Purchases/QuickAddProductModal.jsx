import React, { useState, useEffect } from 'react';
import API_BASE from '../../services/api';

const generateSku = (brand, name) => {
  const b = (brand || 'PRD').slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'P');
  const n = (name || 'ITM').slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${b}-${n}-${rand}`;
};

export default function QuickAddProductModal({
  isOpen,
  onClose,
  onProductCreated,
  existingProducts = [],
}) {
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    category_name: '',
    brand_id: '',
    brand_name: '',
    model_name: '',
    series_name: '',
    purchase_price: '',
    selling_price: '',
    sku: '',
    barcode: '',
    warranty_months: '12',
    isSerialRequired: true,
    isWarrantyRequired: true,
  });

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [duplicateAlert, setDuplicateAlert] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    // Load categories & brands for dropdowns
    const loadLookups = async () => {
      try {
        const [catRes, brRes] = await Promise.all([
          fetch(`${API_BASE}/categories`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
          fetch(`${API_BASE}/master/brands`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
        ]);
        setCategories(Array.isArray(catRes) ? catRes : catRes.data || []);
        setBrands(Array.isArray(brRes) ? brRes : brRes.data || []);
      } catch (_) {}
    };
    loadLookups();

    // Auto-generate a fresh SKU
    setFormData({
      name: '',
      category_id: '',
      category_name: '',
      brand_id: '',
      brand_name: '',
      model_name: '',
      series_name: '',
      purchase_price: '',
      selling_price: '',
      sku: generateSku('', ''),
      barcode: '',
      warranty_months: '12',
      isSerialRequired: true,
      isWarrantyRequired: true,
    });
    setError('');
    setDuplicateAlert(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'brand_name' || field === 'name') {
        const b = field === 'brand_name' ? value : prev.brand_name;
        const n = field === 'name' ? value : prev.name;
        if (!prev.sku || prev.sku.startsWith('PRD-') || prev.sku.startsWith('ITM-')) {
          next.sku = generateSku(b, n);
        }
      }
      return next;
    });
    if (error) setError('');
    if (duplicateAlert) setDuplicateAlert(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setError('Product name is required');
      return;
    }

    setLoading(true);
    setError('');
    setDuplicateAlert(false);

    try {
      const isSerialReq = Boolean(formData.isSerialRequired);
      const isWarrantyReq = Boolean(formData.isWarrantyRequired || Number(formData.warranty_months || 0) > 0);

      const payload = {
        name: trimmedName,
        category_name: formData.category_name || (categories.find((c) => String(c.id) === String(formData.category_id))?.name || ''),
        category_id: formData.category_id ? Number(formData.category_id) : null,
        brand_name: formData.brand_name || (brands.find((b) => String(b.id) === String(formData.brand_id))?.name || ''),
        brand_id: formData.brand_id ? Number(formData.brand_id) : null,
        model_name: formData.model_name.trim(),
        series_name: formData.series_name.trim(),
        purchase_price: Number(formData.purchase_price || 0),
        selling_price: Number(formData.selling_price || 0),
        sku: formData.sku.trim(),
        barcode: formData.barcode.trim(),
        warranty_months: isWarrantyReq ? Number(formData.warranty_months || 0) : 0,
        isSerialRequired: isSerialReq,
        is_serial_required: isSerialReq,
        is_serial_tracked: isSerialReq,
        tracks_serial: isSerialReq,
        isWarrantyRequired: isWarrantyReq,
        is_warranty_required: isWarrantyReq,
      };

      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (res.status === 409 || !res.ok) {
        if (res.status === 409 || (resData.message && resData.message.includes('Already added'))) {
          setDuplicateAlert(true);
          return;
        }
        throw new Error(resData.message || resData.error || 'Failed to create product');
      }

      const created = resData.data || {
        ...payload,
        id: resData.id || Date.now(),
      };

      if (onProductCreated) {
        onProductCreated(created);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error creating product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100030,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '680px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          border: '1px solid #cbd5e1',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '94vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>📦</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                Add New Catalog Product
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                Create product directly into catalog and append to this purchase order
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.3rem',
              color: '#64748b',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Duplicate Notification Modal */}
        {duplicateAlert && (
          <div
            style={{
              margin: '16px 24px 0',
              padding: '14px 18px',
              borderRadius: '10px',
              background: '#fef2f2',
              border: '1.5px solid #ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.4rem' }}>⚠️</span>
              <div>
                <strong style={{ color: '#991b1b', fontSize: '0.92rem', display: 'block' }}>
                  Already added this product, add a new product for catalog
                </strong>
                <span style={{ fontSize: '0.78rem', color: '#b91c1c' }}>
                  A product with the same name, model, SKU, or barcode already exists in the catalog.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDuplicateAlert(false)}
              style={{
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', fontSize: '0.84rem' }}>
              {error}
            </div>
          )}

          {/* Product Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
              Product Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. AC1200 Dual Band Gigabit Router"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Category & Brand */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Category
              </label>
              <input
                type="text"
                list="category-options"
                value={formData.category_name}
                onChange={(e) => handleChange('category_name', e.target.value)}
                placeholder="e.g. Routers / Networking"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.86rem',
                  boxSizing: 'border-box',
                }}
              />
              <datalist id="category-options">
                {categories.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Brand
              </label>
              <input
                type="text"
                list="brand-options"
                value={formData.brand_name}
                onChange={(e) => handleChange('brand_name', e.target.value)}
                placeholder="e.g. TP-Link, Netis, Dahua"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.86rem',
                  boxSizing: 'border-box',
                }}
              />
              <datalist id="brand-options">
                {brands.map((b) => (
                  <option key={b.id} value={b.name} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Model & Series */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Model
              </label>
              <input
                type="text"
                value={formData.model_name}
                onChange={(e) => handleChange('model_name', e.target.value)}
                placeholder="e.g. Archer C6, NC21"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.86rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Series
              </label>
              <input
                type="text"
                value={formData.series_name}
                onChange={(e) => handleChange('series_name', e.target.value)}
                placeholder="e.g. Pro, V4, Gigabit"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.86rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Pricing: Purchase Cost & Selling Price */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0284c7', marginBottom: '4px' }}>
                Purchase Cost Price ৳ *
              </label>
              <input
                type="number"
                step="any"
                required
                value={formData.purchase_price}
                onChange={(e) => handleChange('purchase_price', e.target.value)}
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #38bdf8',
                  fontSize: '0.88rem',
                  boxSizing: 'border-box',
                  background: '#ffffff',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#16a34a', marginBottom: '4px' }}>
                Selling Retail Price ৳
              </label>
              <input
                type="number"
                step="any"
                value={formData.selling_price}
                onChange={(e) => handleChange('selling_price', e.target.value)}
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #4ade80',
                  fontSize: '0.88rem',
                  boxSizing: 'border-box',
                  background: '#ffffff',
                }}
              />
            </div>
          </div>

          {/* SKU & Barcode */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                  Auto SKU Code
                </label>
                <button
                  type="button"
                  onClick={() => handleChange('sku', generateSku(formData.brand_name || 'PRD', formData.name || 'ITM'))}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#3b82f6',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  ⚡ Regenerate
                </button>
              </div>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => handleChange('sku', e.target.value)}
                placeholder="e.g. NET-ROU-4821"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.86rem',
                  boxSizing: 'border-box',
                  fontWeight: 600,
                  color: '#1e293b',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Barcode
              </label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => handleChange('barcode', e.target.value)}
                placeholder="e.g. 890123456789"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.86rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Serial / Barcode & Warranty Tracking Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '0.84rem' }}>
              <span>
                <strong style={{ color: formData.isSerialRequired ? '#166534' : '#1e293b' }}>
                  📦 Requires Serial / Barcode Tracking
                </strong>
                <br />
                <small style={{ color: '#64748b' }}>Enforces barcode scanning on purchase and sale rows</small>
              </span>
              <input
                type="checkbox"
                checked={Boolean(formData.isSerialRequired)}
                onChange={(e) => handleChange('isSerialRequired', e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#16a34a', cursor: 'pointer' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '0.84rem', borderTop: '1px dashed #e2e8f0', paddingTop: '8px' }}>
              <span>
                <strong style={{ color: formData.isWarrantyRequired ? '#1e40af' : '#1e293b' }}>
                  🛡️ Requires Warranty Tracking
                </strong>
                <br />
                <small style={{ color: '#64748b' }}>Enforces batch warranty on purchase and customer invoice</small>
              </span>
              <input
                type="checkbox"
                checked={Boolean(formData.isWarrantyRequired)}
                onChange={(e) => handleChange('isWarrantyRequired', e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#2563eb', cursor: 'pointer' }}
              />
            </label>

            {formData.isWarrantyRequired && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingTop: '4px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e40af' }}>
                  Default Warranty (Months):
                </span>
                <input
                  type="number"
                  min="0"
                  value={formData.warranty_months}
                  onChange={(e) => handleChange('warranty_months', e.target.value)}
                  placeholder="12"
                  style={{
                    width: '80px',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: '1px solid #93c5fd',
                    fontSize: '0.84rem',
                    textAlign: 'center',
                    fontWeight: 700,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '10px',
              paddingTop: '12px',
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '9px 22px',
                borderRadius: '8px',
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
              }}
            >
              {loading ? 'Creating...' : '✓ Add Product to PO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
