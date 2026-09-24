import React, { useState, useEffect } from 'react';
import API_BASE from '../../services/api';
import { fullCatalogName, isProductSerialTracked, isProductWarrantyRequired } from '../../utils/productUtils';

export default function ProductsCatalog() {
  const [activeTab, setActiveTab] = useState('products');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    brand_id: '',
    purchase_price: '',
    sale_price: '',
    stock: '',
    isSerialRequired: false,
    is_serial_required: false,
    is_serial_tracked: false,
    isWarrantyRequired: false,
    is_warranty_required: false,
    warranty_months: 12
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBrands();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/master/products`);
      if (res.ok) setProducts(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/master/categories`);
      if (res.ok) setCategories(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchBrands = async () => {
    try {
      const res = await fetch(`${API_BASE}/master/brands`);
      if (res.ok) setBrands(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category_id: '',
      brand_id: '',
      purchase_price: '',
      sale_price: '',
      stock: '',
      isSerialRequired: false,
      is_serial_required: false,
      is_serial_tracked: false,
      isWarrantyRequired: false,
      is_warranty_required: false,
      warranty_months: 12
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    const isSerialReq = Boolean(
      product.isSerialRequired ??
      product.is_serial_required ??
      product.is_serial_tracked ??
      product.tracks_serial ??
      false
    );
    const isWarrantyReq = Boolean(
      product.isWarrantyRequired ??
      product.is_warranty_required ??
      (Number(product.warranty_months || 0) > 0)
    );
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      category_id: product.category_id || '',
      brand_id: product.brand_id || '',
      purchase_price: product.purchase_price || '',
      sale_price: product.selling_price || product.sale_price || '',
      stock: product.stock !== undefined ? product.stock : '',
      isSerialRequired: isSerialReq,
      is_serial_required: isSerialReq,
      is_serial_tracked: isSerialReq,
      isWarrantyRequired: isWarrantyReq,
      is_warranty_required: isWarrantyReq,
      warranty_months: product.warranty_months || 12
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const isSerialReq = Boolean(
        formData.isSerialRequired ??
        formData.is_serial_required ??
        formData.is_serial_tracked ??
        false
      );
      const isWarrantyReq = Boolean(
        formData.isWarrantyRequired ??
        formData.is_warranty_required ??
        false
      );
      const payload = {
        ...formData,
        isSerialRequired: isSerialReq,
        is_serial_required: isSerialReq,
        is_serial_tracked: isSerialReq,
        tracks_serial: isSerialReq,
        isWarrantyRequired: isWarrantyReq,
        is_warranty_required: isWarrantyReq,
        warranty_months: isWarrantyReq ? (Number(formData.warranty_months) || 12) : 0
      };
      const url = editingProduct ? `${API_BASE}/master/products/${editingProduct.id}` : `${API_BASE}/master/products`;
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingProduct(null);
        setFormData({
          name: '',
          category_id: '',
          brand_id: '',
          purchase_price: '',
          sale_price: '',
          stock: '',
          isSerialRequired: false,
          is_serial_required: false,
          is_serial_tracked: false,
          isWarrantyRequired: false,
          is_warranty_required: false,
          warranty_months: 12
        });
        fetchProducts();
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ padding: '30px', background: '#f1f5f9', minHeight: '100vh', boxSizing: 'border-box' }}>
      <style>{`
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .page-title { font-size: 1.6rem; font-weight: 700; color: #0f172a; margin: 0; }
        .primary-btn { background: #0284c7; color: #fff; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
        .primary-btn:hover { background: #0369a1; }
        
        .tabs-container { display: flex; gap: 10px; border-bottom: 2px solid #cbd5e1; margin-bottom: 24px; }
        .tab-btn { padding: 10px 20px; background: transparent; border: none; font-size: 0.95rem; font-weight: 600; color: #64748b; cursor: pointer; border-bottom: 3px solid transparent; margin-bottom: -2px; }
        .tab-btn.active { color: #0284c7; border-bottom-color: #0284c7; }
        
        .content-card { background: #fff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); padding: 20px; overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; text-align: left; }
        .data-table th, .data-table td { padding: 14px 16px; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem; color: #334155; }
        .data-table th { background: #f8fafc; font-weight: 600; color: #475569; }
        
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 10000; }
        .modal-box { background: #fff; width: 100%; max-width: 520px; border-radius: 14px; padding: 28px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-size: 0.85rem; font-weight: 600; color: #334155; margin-bottom: 6px; }
        .form-input { width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; outline: none; }
        .form-input:focus { border-color: #0284c7; box-shadow: 0 0 0 3px rgba(2,132,199,0.15); }
        .modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
        .secondary-btn { background: #e2e8f0; color: #475569; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; }
      `}</style>

      {/* Consolidated Header, Tabs & Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '1.5px solid #cbd5e1',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.3rem' }}>📦</span>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Products &amp; Catalog</h1>
        </div>

        <div style={{ display: 'flex', background: '#e2e8f0', padding: '3px', borderRadius: '8px', gap: '3px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'products' ? '#0284c7' : 'transparent',
              color: activeTab === 'products' ? '#ffffff' : '#475569',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            Product List ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('attributes')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'attributes' ? '#0284c7' : 'transparent',
              color: activeTab === 'attributes' ? '#ffffff' : '#475569',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            Categories &amp; Attributes
          </button>
        </div>

        <button
          className="primary-btn"
          onClick={handleOpenAddModal}
          style={{ padding: '6px 14px', fontSize: '0.8rem' }}
        >
          + Add Product
        </button>
      </div>

      {/* Tab 1: Product List */}
      {activeTab === 'products' && (
        <div className="content-card">
          <table className="data-table">
            <thead>
              <tr>
                <th><input type="checkbox" /></th>
                <th>Image</th>
                <th>Product Details</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Sub-category</th>
                <th>Stock</th>
                <th>Serial Tracked</th>
                <th>Warranty</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((item) => (
                  <tr key={item.id}>
                    <td><input type="checkbox" /></td>
                    <td>
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4 }} />
                      ) : (
                        '📷'
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{fullCatalogName(item) || item.name}</span>
                    </td>
                    <td>SKU-{item.id}</td>
                    <td>{item.category_name || 'General'}</td>
                    <td>-</td>
                    <td><span style={{ padding: '4px 10px', background: '#dcfce7', color: '#166534', borderRadius: '6px', fontWeight: 600 }}>{item.stock || 0}</span></td>
                    <td>
                      {isProductSerialTracked(item) ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe' }}>
                          ✅ Yes
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}>
                          ❌ No
                        </span>
                      )}
                    </td>
                    <td>
                      {isProductWarrantyRequired(item) ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
                          🛡️ {item.warranty_months || 12}M
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}>
                          ❌ No
                        </span>
                      )}
                    </td>
                    <td><button type="button" onClick={() => handleOpenEditModal(item)} style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', fontWeight: 600 }}>Edit</button></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No products found. Click "+ Add Product" to add one.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Categories & Attributes */}
      {activeTab === 'attributes' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="content-card">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#0f172a' }}>Categories</h3>
            <ul style={{ paddingLeft: '20px', margin: 0, color: '#334155' }}>
              {categories.length > 0 ? categories.map(c => <li key={c.id} style={{ padding: '6px 0' }}>{c.name}</li>) : <p style={{ color: '#94a3b8' }}>No categories found.</p>}
            </ul>
          </div>
          <div className="content-card">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#0f172a' }}>Brands</h3>
            <ul style={{ paddingLeft: '20px', margin: 0, color: '#334155' }}>
              {brands.length > 0 ? brands.map(b => <li key={b.id} style={{ padding: '6px 0' }}>{b.name}</li>) : <p style={{ color: '#94a3b8' }}>No brands found.</p>}
            </ul>
          </div>
        </div>
      )}

      {/* Popup Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2 style={{ margin: '0 0 20px 0', fontSize: '1.3rem', color: '#0f172a' }}>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Product Name</label>
                <input type="text" className="form-input" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Hikvision 2MP Camera" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Category</label>
                  <select className="form-input" value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: e.target.value})}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Brand</label>
                  <select className="form-input" value={formData.brand_id} onChange={(e) => setFormData({...formData, brand_id: e.target.value})}>
                    <option value="">Select Brand</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label>Purchase Price</label>
                  <input type="number" step="0.01" className="form-input" value={formData.purchase_price} onChange={(e) => setFormData({...formData, purchase_price: e.target.value})} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label>Sale Price</label>
                  <input type="number" step="0.01" className="form-input" required value={formData.sale_price} onChange={(e) => setFormData({...formData, sale_price: e.target.value})} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label>Initial Stock</label>
                  <input type="number" className="form-input" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} placeholder="0" />
                </div>
              </div>

              {/* Serial & Warranty Configuration */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginTop: '12px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                  <input
                    type="checkbox"
                    name="is_serial_required"
                    checked={Boolean(formData.is_serial_required || formData.isSerialRequired || formData.is_serial_tracked)}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setFormData(prev => ({
                        ...prev,
                        is_serial_required: val,
                        is_serial_tracked: val,
                        isSerialRequired: val,
                        tracks_serial: val
                      }));
                    }}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span>📦 Requires Serial / Barcode Tracking</span>
                </label>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                    <input
                      type="checkbox"
                      name="is_warranty_required"
                      checked={Boolean(formData.is_warranty_required || formData.isWarrantyRequired)}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setFormData(prev => ({
                          ...prev,
                          is_warranty_required: val,
                          isWarrantyRequired: val
                        }));
                      }}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span>🛡️ Requires Warranty Tracking</span>
                  </label>
                  {(formData.isWarrantyRequired || formData.is_warranty_required) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={formData.warranty_months}
                        onChange={(e) => setFormData(prev => ({ ...prev, warranty_months: e.target.value }))}
                        className="form-input"
                        style={{ width: '70px', padding: '4px 8px', textAlign: 'center', fontSize: '0.85rem' }}
                      />
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>months</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-btn">{editingProduct ? 'Save Changes' : 'Save Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}