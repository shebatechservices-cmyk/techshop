import React, { useState, useEffect } from 'react';
import API_BASE from '../../services/api';

export default function ProductsCatalog() {
  const [activeTab, setActiveTab] = useState('products');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    brand_id: '',
    purchase_price: '',
    sale_price: '',
    stock: ''
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/master/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ name: '', category_id: '', brand_id: '', purchase_price: '', sale_price: '', stock: '' });
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
          onClick={() => setIsModalOpen(true)}
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
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((item) => (
                  <tr key={item.id}>
                    <td><input type="checkbox" /></td>
                    <td><div style={{ width: '40px', height: '40px', background: '#e2e8f0', borderRadius: '6px' }}></div></td>
                    <td><span style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</span></td>
                    <td>SKU-{item.id}</td>
                    <td>{item.category_name || 'General'}</td>
                    <td>-</td>
                    <td><span style={{ padding: '4px 10px', background: '#dcfce7', color: '#166534', borderRadius: '6px', fontWeight: 600 }}>{item.stock || 0}</span></td>
                    <td><button style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', fontWeight: 600 }}>Edit</button></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No products found. Click "+ Add Product" to add one.</td>
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
            <h2 style={{ margin: '0 0 20px 0', fontSize: '1.3rem', color: '#0f172a' }}>Add New Product</h2>
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
              <div className="modal-footer">
                <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}