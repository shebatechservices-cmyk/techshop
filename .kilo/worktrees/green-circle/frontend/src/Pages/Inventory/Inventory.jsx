import React, { useState, useEffect, useMemo, useRef } from 'react';
import API from '../../services/api';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getWarrantyValidity = (dateStr) => {
  if (!dateStr) return null;
  const exp = new Date(dateStr);
  if (isNaN(exp.getTime())) return null;
  const now = new Date();
  const expDay = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = expDay.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return { expired: true, text: `Expired (${Math.abs(diffDays)}d ago)`, color: '#ef4444', bg: '#fef2f2' };
  }
  const months = Math.floor(diffDays / 30);
  const days = diffDays % 30;
  let text = '';
  if (months > 0 && days > 0) text = `${months}m ${days}d left`;
  else if (months > 0) text = `${months}m left`;
  else text = `${days}d left`;
  const isNear = diffDays <= 15;
  return {
    expired: false,
    text,
    diffDays,
    color: isNear ? '#b45309' : '#15803d',
    bg: isNear ? '#fef3c7' : '#dcfce7'
  };
};

export default function Inventory({ onOpenNewSale }) {
  // Data states
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(1);
  const [summary, setSummary] = useState({
    total_products: 0,
    total_units: 0,
    total_cost_valuation: 0,
    total_retail_valuation: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filter and search states
  const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  // Cost confidentiality toggle (individual per-row eye toggle)
  const [revealedCostIds, setRevealedCostIds] = useState(new Set());
  const [showCostValuation, setShowCostValuation] = useState(false);

  // Active three-dot action dropdown (per-row)
  const [openActionId, setOpenActionId] = useState(null);

  const toggleCostVisibility = (id) => {
    setRevealedCostIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Click outside to close action menu
  useEffect(() => {
    const handleDocClick = () => setOpenActionId(null);
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Notification toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Modals state
  const [warrantyModalProduct, setWarrantyModalProduct] = useState(null);
  const [warrantyData, setWarrantyData] = useState({ loading: false, serials: [], product: null });

  const [labelModalProduct, setLabelModalProduct] = useState(null);
  const [labelQuantity, setLabelQuantity] = useState(4);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    product_id: '',
    source_warehouse_id: 1,
    dest_warehouse_id: 2,
    quantity: 1,
    notes: '',
  });
  const [transferSubmitting, setTransferSubmitting] = useState(false);

  const [isPriceListOpen, setIsPriceListOpen] = useState(false);

  const printLabelRef = useRef(null);
  const printPriceListRef = useRef(null);

  const showNotification = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // Load Inventory & Warehouses
  const loadInventory = async () => {
    try {
      setLoading(true);
      const [invRes, whRes] = await Promise.all([
        fetch(`${API}/inventory?warehouse_id=${selectedWarehouseId}`).catch(() => null),
        fetch(`${API}/inventory/warehouses`).catch(() => null),
      ]);

      if (invRes && invRes.ok) {
        const json = await invRes.json();
        if (json.success) {
          setProducts(json.data || []);
          if (json.summary) setSummary(json.summary);
        }
      }

      if (whRes && whRes.ok) {
        const whJson = await whRes.json();
        if (whJson.success && Array.isArray(whJson.data)) {
          setWarehouses(whJson.data);
          const defaultWh = whJson.data.find(w => w.is_default);
          if (defaultWh && !selectedWarehouseId) {
            setSelectedWarehouseId(defaultWh.id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
      showNotification('Failed to connect to inventory server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [selectedWarehouseId]);

  useEffect(() => {
    const handleStockChanged = () => {
      loadInventory();
    };
    window.addEventListener('inventory_stock_changed', handleStockChanged);
    return () => window.removeEventListener('inventory_stock_changed', handleStockChanged);
  }, [selectedWarehouseId]);

  // Unique categories for filter dropdown
  const categoryList = useMemo(() => {
    const cats = new Set();
    products.forEach((p) => {
      if (p.category_name) cats.add(p.category_name);
    });
    return Array.from(cats).sort();
  }, [products]);

  // Active supplier warranty count
  const activeWarrantyCount = useMemo(() => {
    return products.filter((p) => {
      const v = getWarrantyValidity(p.supplier_warranty_expire_date);
      return v && !v.expired;
    }).length;
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    let result = products;

    // Filter by Stock Status
    if (stockFilter === 'in_stock') {
      result = result.filter((p) => Number(p.stock) > 0);
    } else if (stockFilter === 'low_stock') {
      result = result.filter((p) => p.stock_status === 'low_stock');
    } else if (stockFilter === 'out_of_stock') {
      result = result.filter((p) => p.stock_status === 'out_of_stock');
    }

    // Filter by Category
    if (categoryFilter !== 'ALL') {
      result = result.filter((p) => p.category_name === categoryFilter);
    }

    // Search query matching Composite Name, SKU, Barcode, Brand, Model, Category
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((p) => {
        return (
          (p.composite_name && p.composite_name.toLowerCase().includes(q)) ||
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.barcode && p.barcode.toLowerCase().includes(q)) ||
          (p.brand_name && p.brand_name.toLowerCase().includes(q)) ||
          (p.model_name && p.model_name.toLowerCase().includes(q)) ||
          (p.series_name && p.series_name.toLowerCase().includes(q)) ||
          (p.category_name && p.category_name.toLowerCase().includes(q)) ||
          (p.sub_category_name && p.sub_category_name.toLowerCase().includes(q))
        );
      });
    }

    return result;
  }, [products, stockFilter, categoryFilter, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedProducts = useMemo(() => {
    const start = (currentPageSafe - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPageSafe, itemsPerPage]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [stockFilter, categoryFilter, searchQuery]);

  // Checkbox selection
  const isAllSelected =
    paginatedProducts.length > 0 &&
    paginatedProducts.every((p) => selectedProductIds.includes(p.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const pageIds = paginatedProducts.map((p) => p.id);
      setSelectedProductIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      const pageIds = paginatedProducts.map((p) => p.id);
      setSelectedProductIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle E-Commerce Active status
  const handleToggleEcommerce = async (product) => {
    try {
      const newStatus = !product.is_ecommerce_active;
      // Optimistic update
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_ecommerce_active: newStatus } : p))
      );

      const res = await fetch(`${API}/inventory/product/${product.id}/ecommerce`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_ecommerce_active: newStatus }),
      });

      if (res.ok) {
        showNotification(
          `"${product.composite_name || product.name}" is now ${newStatus ? 'Active in E-Commerce' : 'Hidden from E-Commerce'}`
        );
      } else {
        // Revert on error
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, is_ecommerce_active: !newStatus } : p))
        );
        showNotification('Failed to update e-commerce status', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Network error while updating e-commerce', 'error');
    }
  };

  // Open Warranty Modal
  const handleOpenWarrantyModal = async (product) => {
    setWarrantyModalProduct(product);
    setWarrantyData({ loading: true, serials: [], product });
    try {
      const res = await fetch(`${API}/inventory/product/${product.id}/warranty`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setWarrantyData({
            loading: false,
            serials: json.serials || [],
            product: json.product || product,
          });
        }
      }
    } catch (err) {
      console.error(err);
      setWarrantyData({ loading: false, serials: [], product });
    }
  };

  // Open Label Print Modal
  const handleOpenLabelModal = (product) => {
    setLabelModalProduct(product);
    setLabelQuantity(4);
  };

  const handlePrintLabels = () => {
    if (!printLabelRef.current) return;
    const printContent = printLabelRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Print Labels - ${labelModalProduct?.composite_name || labelModalProduct?.name}</title>
          <style>
            @page { size: auto; margin: 10mm; }
            body { font-family: 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 10px; }
            .label-grid { display: flex; flex-wrap: wrap; gap: 14px; }
            .label-sticker {
              width: 58mm;
              height: 38mm;
              border: 1px dashed #94a3b8;
              border-radius: 6px;
              padding: 6px 8px;
              display: flex;
              flex-direction: column;
              justifyContent: space-between;
              box-sizing: border-box;
              page-break-inside: avoid;
            }
            .store-name { font-size: 8pt; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 0.5px; }
            .prod-title { font-size: 8pt; font-weight: 700; color: #0f172a; line-height: 1.1; max-height: 2.2em; overflow: hidden; }
            .prod-sku { font-size: 7pt; font-family: monospace; color: #475569; }
            .barcode-lines { height: 18px; background: repeating-linear-gradient(90deg, #000 0, #000 2px, transparent 2px, transparent 4px, #000 4px, #000 7px, transparent 7px, transparent 9px); }
            .prod-price { font-size: 10pt; font-weight: 900; color: #0f172a; text-align: right; }
          </style>
        </head>
        <body>
          <div class="label-grid">
            ${printContent}
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  // Open Stock Transfer Modal
  const handleOpenTransferModal = (product = null) => {
    const defaultDest = warehouses.find((w) => w.id !== selectedWarehouseId)?.id || 2;
    setTransferForm({
      product_id: product ? product.id : products[0]?.id || '',
      source_warehouse_id: selectedWarehouseId,
      dest_warehouse_id: defaultDest,
      quantity: 1,
      notes: '',
    });
    setIsTransferModalOpen(true);
  };

  const handleExecuteTransfer = async (e) => {
    e.preventDefault();
    if (!transferForm.product_id) {
      showNotification('Please select a product to transfer', 'error');
      return;
    }
    if (transferForm.source_warehouse_id === transferForm.dest_warehouse_id) {
      showNotification('Source and destination warehouses cannot be the same', 'error');
      return;
    }
    if (transferForm.quantity <= 0) {
      showNotification('Quantity must be greater than 0', 'error');
      return;
    }

    try {
      setTransferSubmitting(true);
      const res = await fetch(`${API}/inventory/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferForm),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showNotification(json.message || 'Stock transfer executed successfully!');
        setIsTransferModalOpen(false);
        loadInventory();
      } else {
        showNotification(json.error || 'Failed to transfer stock', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Network error during transfer', 'error');
    } finally {
      setTransferSubmitting(false);
    }
  };

  // Emergency Force Clean Inventory Stock
  const handleForceCleanStock = async () => {
    const action = window.prompt(
      "⚡ INVENTORY STOCK FORCE CLEAN:\n\nType 'ZERO' to reset all product stock quantities to 0 across all warehouses.\nType 'WIPE' to wipe test products and stock completely for a clean launch.\n\nEnter ZERO or WIPE:",
      ""
    );
    if (!action) return;

    const normalized = action.trim().toUpperCase();
    if (normalized !== 'ZERO' && normalized !== 'WIPE') {
      alert("Action cancelled. Please enter 'ZERO' or 'WIPE'.");
      return;
    }

    const mode = normalized === 'WIPE' ? 'wipe_all' : 'zero_stock';
    try {
      setLoading(true);
      const res = await fetch(`${API}/inventory/clean-stock-force`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, reason: 'Inventory page emergency force clean' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(data.message || 'Inventory stock force cleaned successfully!', 'success');
        loadInventory();
        window.dispatchEvent(new CustomEvent('inventory_stock_changed'));
      } else {
        showNotification(data.error || 'Failed to clean stock', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Network error executing stock clean', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Price List Export & Actions
  const getSelectedOrAllProducts = () => {
    if (selectedProductIds.length > 0) {
      return products.filter((p) => selectedProductIds.includes(p.id));
    }
    return filteredProducts;
  };

  const handleDownloadCsv = () => {
    const list = getSelectedOrAllProducts();
    if (list.length === 0) {
      showNotification('No products available to export', 'error');
      return;
    }

    const headers = ['Product ID', 'Product Title', 'Brand', 'Model', 'Category', 'SKU', 'Barcode', 'Available Stock', 'Sale Price (BDT)', 'Warranty (Months)', 'Status'];
    const rows = list.map((p) => [
      p.id,
      `"${(p.composite_name || p.name).replace(/"/g, '""')}"`,
      `"${(p.brand_name || '').replace(/"/g, '""')}"`,
      `"${(p.model_name || '').replace(/"/g, '""')}"`,
      `"${(p.category_name || '').replace(/"/g, '""')}"`,
      `"${(p.sku || '').replace(/"/g, '""')}"`,
      `"${(p.barcode || '').replace(/"/g, '""')}"`,
      p.stock,
      p.sale_price,
      p.warranty_months || 0,
      p.stock_status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Price_List_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification(`Exported ${list.length} products to CSV`);
  };

  const handleCopyPriceList = () => {
    const list = getSelectedOrAllProducts();
    if (list.length === 0) return;

    let text = `📦 SHEBA TECHNOLOGY - PRICE LIST (${new Date().toLocaleDateString('en-BD')})\n\n`;
    list.slice(0, 50).forEach((p, idx) => {
      text += `${idx + 1}. ${p.composite_name || p.name} | SKU: ${p.sku || 'N/A'} | Price: ৳${p.sale_price} | Stock: ${p.stock}\n`;
    });
    if (list.length > 50) text += `... and ${list.length - 50} more items.\n`;

    navigator.clipboard.writeText(text);
    showNotification('Price list copied to clipboard!');
  };

  const handlePrintPriceList = async () => {
    const list = getSelectedOrAllProducts();
    let shop = {};
    try {
      const res = await fetch(`${API}/settings`);
      const json = await res.json();
      if (json && json.data) shop = json.data;
    } catch (e) {}
    const shopName = shop.shop_name || 'Sheba Technology & Networking';
    const shopTagline = shop.shop_title || 'Official Warehouse Stock & Product Price Catalog';
    const shopAddress = shop.address ? `<p>${shop.address}</p>` : '';
    const shopPhone = [shop.phone, shop.alt_phone].filter(Boolean).join(', ');
    const contactLine = [shopPhone, shop.email].filter(Boolean).join(' · ');
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Price Catalog - ${shopName}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 10px; color: #0f172a; }
            .header { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end; }
            .header h1 { margin: 0; font-size: 1.6rem; color: #0284c7; }
            .header p { margin: 2px 0 0 0; color: #64748b; font-size: 0.85rem; }
            table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
            th { background: #f1f5f9; text-align: left; padding: 8px 10px; border-bottom: 2px solid #cbd5e1; color: #334155; }
            td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
            .price { font-weight: 800; text-align: right; color: #0f172a; }
            .stock { font-weight: 700; text-align: center; }
            .in { color: #16a34a; }
            .low { color: #d97706; }
            .out { color: #dc2626; }
            .footer { margin-top: 24px; font-size: 0.75rem; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>${shopName}</h1>
              <p>${shopTagline}</p>
              ${shopAddress}
              ${contactLine ? `<p>${contactLine}</p>` : ''}
            </div>
            <div style="text-align: right;">
              <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-BD')}</p>
              <p><strong>Total Items:</strong> ${list.length}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 35px;">#</th>
                <th>Product Description</th>
                <th>SKU / Code</th>
                <th>Category</th>
                <th style="text-align: center;">Stock</th>
                <th style="text-align: right;">Selling Price</th>
              </tr>
            </thead>
            <tbody>
              ${list
                .map(
                  (p, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><strong>${p.composite_name || p.name}</strong></td>
                  <td style="font-family: monospace;">${p.sku || p.barcode || '—'}</td>
                  <td>${p.category_name || '—'}</td>
                  <td class="stock ${p.stock <= 0 ? 'out' : p.stock <= p.min_stock ? 'low' : 'in'}">${p.stock} pcs</td>
                  <td class="price">৳ ${Number(p.sale_price || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          <div class="footer">
            Generated from ${shopName} ERP System • All prices subject to change without prior notice.
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Toast notification */}
      {toast.show && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 99999,
            padding: '12px 20px',
            borderRadius: '8px',
            background: toast.type === 'error' ? '#ef4444' : '#10b981',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.9rem',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <span>{toast.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. Sleek Compact Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1.5px solid #e2e8f0', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.3rem' }}>🏢</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Inventory & Central Warehouse
              </h1>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: '#e0f2fe', color: '#0369a1' }}>
                LIVE STOCK
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Stock Transfer Action */}
          <button
            type="button"
            onClick={() => handleOpenTransferModal()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: '#0284c7',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(2,132,199,0.2)',
            }}
          >
            <span>🔄</span> Stock Transfer
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={loadInventory}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontWeight: 600,
              fontSize: '0.78rem',
              cursor: 'pointer',
            }}
          >
            <span style={{ transform: loading ? 'rotate(180deg)' : 'none', transition: 'transform 0.5s ease' }}>🔄</span>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>

          {/* Clean Stock Force Button */}
          <button
            type="button"
            onClick={handleForceCleanStock}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #fca5a5',
              background: '#fef2f2',
              color: '#dc2626',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
            }}
            title="Emergency option to reset all warehouse stocks to 0 or wipe test catalog"
          >
            <span>⚡</span> Clean Stock Force
          </button>
        </div>
      </div>

      {/* 2. Warehouse & Valuation Summary Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '12px' }}>
        {/* Total SKUs */}
        <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Total SKUs</span>
            <span style={{ fontSize: '0.95rem' }}>📦</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
            {summary.total_products.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Unique registered</span>
        </div>

        {/* Total Stock Units */}
        <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>In-Stock Units</span>
            <span style={{ fontSize: '0.95rem' }}>📊</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>
            {summary.total_units.toLocaleString()} <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>pcs</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>In all locations</span>
        </div>

        {/* Stock Valuation (Cost Basis) */}
        <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Cost Valuation</span>
            <button
              type="button"
              onClick={() => setShowCostValuation(!showCostValuation)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                color: '#64748b',
                padding: '0',
              }}
              title={showCostValuation ? 'Hide Cost Valuation' : 'Show Cost Valuation'}
            >
              {showCostValuation ? '👁️' : '🙈'}
            </button>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#334155', marginTop: '2px' }}>
            {showCostValuation ? taka(summary.total_cost_valuation) : '৳ ••••••'}
          </div>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Stock capital</span>
        </div>

        {/* Retail Valuation */}
        <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase' }}>Retail Value</span>
            <span style={{ fontSize: '0.95rem' }}>📈</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a', marginTop: '2px' }}>
            {taka(summary.total_retail_valuation)}
          </div>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Est. sales value</span>
        </div>

        {/* Low Stock Warning (Interactive Click to Filter) */}
        <div
          onClick={() => {
            setStockFilter(stockFilter === 'low_stock' ? 'all' : 'low_stock');
            setCurrentPage(1);
          }}
          style={{
            background: stockFilter === 'low_stock' ? '#fff7ed' : '#ffffff',
            padding: '10px 14px',
            borderRadius: '8px',
            border: stockFilter === 'low_stock' ? '2px solid #ea580c' : '1px solid #fed7aa',
            borderLeft: '4px solid #f97316',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Click to filter products with low stock"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#c2410c', textTransform: 'uppercase' }}>
              Low Stock {stockFilter === 'low_stock' && '✓'}
            </span>
            <span style={{ fontSize: '0.95rem' }}>⚠️</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ea580c', marginTop: '2px' }}>
            {summary.low_stock_count} <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>items</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#9a3412' }}>{stockFilter === 'low_stock' ? 'Filtered' : 'Reorder needed'}</span>
        </div>

        {/* Out of Stock Warning (Interactive Click to Filter) */}
        <div
          onClick={() => {
            setStockFilter(stockFilter === 'out_of_stock' ? 'all' : 'out_of_stock');
            setCurrentPage(1);
          }}
          style={{
            background: stockFilter === 'out_of_stock' ? '#fef2f2' : '#ffffff',
            padding: '10px 14px',
            borderRadius: '8px',
            border: stockFilter === 'out_of_stock' ? '2px solid #dc2626' : '1px solid #fecaca',
            borderLeft: '4px solid #ef4444',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Click to filter out of stock products"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase' }}>
              Out of Stock {stockFilter === 'out_of_stock' && '✓'}
            </span>
            <span style={{ fontSize: '0.95rem' }}>🚫</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>
            {summary.out_of_stock_count} <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>items</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#b91c1c' }}>{stockFilter === 'out_of_stock' ? 'Filtered' : 'Empty stock'}</span>
        </div>

        {/* Supplier 60-Day Warranty Tracking Status */}
        <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', borderLeft: '4px solid #0284c7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase' }}>Supplier Warranty</span>
            <span style={{ fontSize: '0.95rem' }}>🛡️</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>
            {activeWarrantyCount} <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>active</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>60d validity tracking</span>
        </div>
      </div>

      {/* 3. Unified Compact Control & Filter Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '8px 12px',
          marginBottom: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        {/* Row 1: Warehouse + Search + Category + Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Warehouse Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>📍 Warehouse:</span>
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(Number(e.target.value))}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid #0284c7',
                background: '#f0f9ff',
                color: '#0369a1',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} {wh.is_default ? '★ (Default)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Search Bar */}
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.8rem' }}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product, SKU, barcode..."
              style={{
                width: '100%',
                padding: '5px 28px 5px 28px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="ALL">All Categories</option>
            {categoryList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Export/Print Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              onClick={handlePrintPriceList}
              style={{
                padding: '5px 9px',
                borderRadius: '5px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
              title="Print formatted price catalog"
            >
              <span>🖨️</span> Print
            </button>
            <button
              type="button"
              onClick={handleDownloadCsv}
              style={{
                padding: '5px 9px',
                borderRadius: '5px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
              title="Download Excel / CSV"
            >
              <span>📥</span> CSV
            </button>
            <button
              type="button"
              onClick={handleCopyPriceList}
              style={{
                padding: '5px 9px',
                borderRadius: '5px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
              title="Copy price list text"
            >
              <span>📋</span> Share
            </button>
          </div>
        </div>

        {/* Row 2: Status Pills inline */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: `All (${products.length})`, activeBg: '#0f172a', activeColor: '#ffffff', idleBg: '#f1f5f9', idleColor: '#475569' },
              { id: 'in_stock', label: `In Stock (${products.filter((p) => p.stock > 0).length})`, activeBg: '#16a34a', activeColor: '#ffffff', idleBg: '#f0fdf4', idleColor: '#15803d' },
              { id: 'low_stock', label: `Low Stock (${summary.low_stock_count})`, activeBg: '#ea580c', activeColor: '#ffffff', idleBg: '#fff7ed', idleColor: '#c2410c' },
              { id: 'out_of_stock', label: `Out of Stock (${summary.out_of_stock_count})`, activeBg: '#dc2626', activeColor: '#ffffff', idleBg: '#fef2f2', idleColor: '#b91c1c' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStockFilter(st.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '5px',
                  border: 'none',
                  background: stockFilter === st.id ? st.activeBg : st.idleBg,
                  color: stockFilter === st.id ? st.activeColor : st.idleColor,
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                {st.label}
              </button>
            ))}
          </div>

          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> products
          </span>
        </div>
      </div>

      {/* 4. Main Inventory Table */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #cbd5e1',
          overflow: 'visible',
          minHeight: '280px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ overflowX: 'auto', minHeight: '260px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {/* 1. Checkbox */}
                <th style={{ padding: '12px 14px', width: '38px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer' }}
                    title="Select All"
                  />
                </th>
                {/* 2. Image */}
                <th style={{ padding: '12px 8px', width: '48px', textAlign: 'center' }}>Image</th>
                {/* 3. Product Info */}
                <th style={{ padding: '12px 14px', minWidth: '220px' }}>Product Info</th>
                {/* 4. Item Code */}
                <th style={{ padding: '12px 12px', minWidth: '110px' }}>Item Code</th>
                {/* 5. Category (merged with Sub-Category) */}
                <th style={{ padding: '12px 12px' }}>Category</th>
                {/* 6. Available Stock & Total Record (merged) */}
                <th style={{ padding: '12px 12px', textAlign: 'center', minWidth: '110px' }}>Stock / Record</th>
                {/* 7. Cost Price */}
                <th style={{ padding: '12px 12px', textAlign: 'right', minWidth: '110px' }}>Cost Price</th>
                {/* 10. Sale Price */}
                <th style={{ padding: '12px 12px', textAlign: 'right', minWidth: '100px' }}>Sale Price</th>
                {/* 11. Warranty Info */}
                <th style={{ padding: '12px 12px', textAlign: 'center', minWidth: '110px' }}>Warranty Info</th>
                {/* 12. E-Commerce */}
                <th style={{ padding: '12px 12px', textAlign: 'center', minWidth: '95px' }}>E-Commerce</th>
                {/* 13. Actions */}
                <th style={{ padding: '12px 14px', textAlign: 'center', width: '70px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <div style={{ fontSize: '1.4rem', marginBottom: '8px' }}>🔄</div>
                    <div>Loading warehouse inventory...</div>
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '48px 16px', color: '#64748b' }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📦</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>
                      No inventory records found
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem' }}>
                      Try adjusting your search query, stock status, or category filter.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const stock = Number(p.stock || 0);
                  const minStock = Number(p.min_stock || 5);
                  const isOut = stock <= 0;
                  const isLow = stock <= minStock && !isOut;
                  const isSelected = selectedProductIds.includes(p.id);

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: isSelected ? '#f0f9ff' : '#ffffff',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* 1. Checkbox */}
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(p.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>

                      {/* 2. Image Thumbnail */}
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '8px',
                            background: '#f1f5f9',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            margin: '0 auto',
                          }}
                        >
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <span style={{ fontSize: '1.1rem' }}>📷</span>
                          )}
                        </div>
                      </td>

                      {/* 3. Product Name (Composite: Brand + Name + Model + Series) */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                          {p.composite_name || p.name}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                          {p.brand_name && <span style={{ fontWeight: 600 }}>{p.brand_name}</span>}
                          {p.model_name && <span> • Model: {p.model_name}</span>}
                          {p.series_name && <span> • Series: {p.series_name}</span>}
                        </div>
                      </td>

                      {/* 4. Item Code (SKU / Barcode) */}
                      <td style={{ padding: '10px 12px' }}>
                        <div
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: '#0284c7',
                            background: '#f0f9ff',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            display: 'inline-block',
                          }}
                        >
                          {p.sku || p.barcode || `PRD-${p.id}`}
                        </div>
                      </td>

                      {/* 5. Category + Sub-Category (merged) */}
                      <td style={{ padding: '10px 12px', color: '#334155', fontWeight: 600 }}>
                        {p.category_name || '—'}
                        {p.sub_category_name && (
                          <span style={{ color: '#94a3b8', fontWeight: 500 }}>
                            {' '}/ {p.sub_category_name}
                          </span>
                        )}
                      </td>

                      {/* 6. Available Stock / Total Record (merged) */}
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            background: isOut ? '#fef2f2' : isLow ? '#fff7ed' : '#f0fdf4',
                            color: isOut ? '#dc2626' : isLow ? '#ea580c' : '#16a34a',
                            border: `1px solid ${isOut ? '#fecaca' : isLow ? '#fed7aa' : '#bbf7d0'}`,
                          }}
                        >
                          {stock} pcs
                        </span>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px', fontWeight: 600 }}>
                          Record: {p.total_inflow_units || p.purchase_count || stock} pcs
                        </div>
                      </td>

                      {/* 7. Cost Price (Independent per-row eye hide/show) */}
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700, color: '#475569', fontSize: '0.88rem' }}>
                            {revealedCostIds.has(p.id) ? taka(p.cost_price) : '৳ ••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleCostVisibility(p.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px 4px',
                              fontSize: '0.9rem',
                              borderRadius: '4px',
                              color: revealedCostIds.has(p.id) ? '#0284c7' : '#94a3b8',
                              transition: 'transform 0.15s ease',
                            }}
                            title={revealedCostIds.has(p.id) ? 'Hide unit cost' : 'Show unit cost'}
                            aria-label={revealedCostIds.has(p.id) ? 'Hide cost' : 'Show cost'}
                          >
                            {revealedCostIds.has(p.id) ? '👁️' : '🙈'}
                          </button>
                        </div>
                      </td>

                      {/* 10. Sale Price */}
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                        {taka(p.sale_price)}
                      </td>

                      {/* 11. Warranty Info */}
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenWarrantyModal(p)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            background: '#eef2ff',
                            border: '1px solid #c7d2fe',
                            borderRadius: '6px',
                            color: '#4338ca',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                          title="View serial numbers and warranty records"
                        >
                          <span>🛡️</span>
                          <span>{p.warranty_months ? `${p.warranty_months}m` : 'Serials'}</span>
                        </button>
                        {p.supplier_warranty_expire_date && (() => {
                          const validity = getWarrantyValidity(p.supplier_warranty_expire_date);
                          return (
                            <div style={{ marginTop: '4px', textAlign: 'center' }}>
                              <div
                                style={{ fontSize: '0.67rem', color: '#0369a1', fontWeight: 600, whiteSpace: 'nowrap' }}
                                title="Supplier Warranty Expiration (+60d from entry)"
                              >
                                Sup: {new Date(p.supplier_warranty_expire_date).toLocaleDateString()}
                              </div>
                              {validity && (
                                <span
                                  style={{
                                    display: 'inline-block',
                                    marginTop: '2px',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    fontSize: '0.66rem',
                                    fontWeight: 700,
                                    background: validity.bg,
                                    color: validity.color,
                                    whiteSpace: 'nowrap',
                                  }}
                                  title={`Remaining validity: ${validity.text}`}
                                >
                                  {validity.text}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* 12. E-Commerce Interactive Toggle */}
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleEcommerce(p)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '999px',
                            border: 'none',
                            background: p.is_ecommerce_active ? '#dcfce7' : '#f1f5f9',
                            color: p.is_ecommerce_active ? '#15803d' : '#64748b',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            transition: 'all 0.15s ease',
                          }}
                          title="Click to toggle e-commerce visibility"
                        >
                          <span style={{ fontSize: '0.7rem' }}>{p.is_ecommerce_active ? '🌐' : '🔒'}</span>
                          <span>{p.is_ecommerce_active ? 'Active' : 'Off'}</span>
                        </button>
                      </td>

                      {/* 13. Actions (Three-Dot Menu) */}
                      <td style={{ padding: '10px 14px', textAlign: 'center', position: 'relative' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenActionId((current) => (current === p.id ? null : p.id));
                          }}
                          style={{
                            background: openActionId === p.id ? '#e2e8f0' : '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '1rem',
                            color: '#475569',
                            transition: 'all 0.15s ease',
                          }}
                          title="Actions"
                          aria-label="Actions"
                        >
                          ⋮
                        </button>

                        {openActionId === p.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              position: 'absolute',
                              right: '12px',
                              top: 'calc(100% - 4px)',
                              background: '#ffffff',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 4px 6px -2px rgba(0,0,0,0.05)',
                              zIndex: 100,
                              minWidth: '160px',
                              padding: '6px 0',
                              textAlign: 'left',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionId(null);
                                if (onOpenNewSale) {
                                  onOpenNewSale(p);
                                } else {
                                  showNotification(`Starting sale for "${p.composite_name || p.name}"`);
                                }
                              }}
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 14px',
                                background: 'none',
                                border: 'none',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                color: '#166534',
                                cursor: 'pointer',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#f0fdf4')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                            >
                              <span>🛒</span> New Sale
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionId(null);
                                handleOpenLabelModal(p);
                              }}
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 14px',
                                background: 'none',
                                border: 'none',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                color: '#334155',
                                cursor: 'pointer',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                            >
                              <span>🏷️</span> Print Labels
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionId(null);
                                handleOpenTransferModal(p);
                              }}
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 14px',
                                background: 'none',
                                border: 'none',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                color: '#0284c7',
                                cursor: 'pointer',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f9ff')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                            >
                              <span>🔄</span> Transfer Stock
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Bottom Controls */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '0.84rem', color: '#64748b' }}>
            Showing{' '}
            <strong>
              {filteredProducts.length === 0 ? 0 : (currentPageSafe - 1) * itemsPerPage + 1}
            </strong>{' '}
            to{' '}
            <strong>
              {Math.min(currentPageSafe * itemsPerPage, filteredProducts.length)}
            </strong>{' '}
            of <strong>{filteredProducts.length}</strong> products
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Previous Button */}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPageSafe <= 1}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: currentPageSafe <= 1 ? '#f1f5f9' : '#ffffff',
                color: currentPageSafe <= 1 ? '#94a3b8' : '#334155',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: currentPageSafe <= 1 ? 'not-allowed' : 'pointer',
              }}
            >
              « Previous
            </button>

            {/* Numeric Page Buttons */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                if (totalPages <= 7) return true;
                return (
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPageSafe) <= 1
                );
              })
              .map((page, idx, arr) => {
                const prevPage = arr[idx - 1];
                const showEllipsis = prevPage && page - prevPage > 1;

                return (
                  <React.Fragment key={`page-${page}`}>
                    {showEllipsis && <span style={{ padding: '0 4px', color: '#94a3b8' }}>...</span>}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: page === currentPageSafe ? 'none' : '1px solid #cbd5e1',
                        background: page === currentPageSafe ? '#0284c7' : '#ffffff',
                        color: page === currentPageSafe ? '#ffffff' : '#334155',
                        fontWeight: page === currentPageSafe ? 700 : 500,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        minWidth: '32px',
                      }}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              })}

            {/* Next Button */}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPageSafe >= totalPages}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: currentPageSafe >= totalPages ? '#f1f5f9' : '#ffffff',
                color: currentPageSafe >= totalPages ? '#94a3b8' : '#334155',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: currentPageSafe >= totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              Next »
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: WARRANTY & SERIAL NUMBERS MODAL                                  */}
      {/* ========================================================================= */}
      {warrantyModalProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
            backdropFilter: 'blur(3px)',
          }}
          onClick={() => setWarrantyModalProduct(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              maxWidth: '750px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              padding: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '18px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.4rem' }}>🛡️</span>
                  <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a', fontWeight: 800 }}>
                    Warranty & Serial Numbers
                  </h2>
                </div>
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                  {warrantyModalProduct.composite_name || warrantyModalProduct.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWarrantyModalProduct(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: '#94a3b8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Product Meta Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '18px' }}>
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Warranty Duration</span>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#4338ca' }}>
                  {warrantyModalProduct.warranty_months ? `${warrantyModalProduct.warranty_months} Months` : 'None / General'}
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Supplier Exp (+60d)</span>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0369a1' }}>
                  {warrantyModalProduct.supplier_warranty_expire_date ? new Date(warrantyModalProduct.supplier_warranty_expire_date).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Current Stock</span>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#16a34a' }}>
                  {warrantyModalProduct.stock} units
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Total Tracked Serials</span>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0284c7' }}>
                  {warrantyData.serials.length} serials
                </div>
              </div>
            </div>

            {/* Serials Table */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Serial Number</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Purchase PO</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Supplier</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Supplier Exp</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Sale Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {warrantyData.loading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        Loading serial warranty records...
                      </td>
                    </tr>
                  ) : warrantyData.serials.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '30px 16px', color: '#64748b' }}>
                        <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>🏷️</div>
                        <div style={{ fontWeight: 600 }}>No individual serials registered for this product</div>
                        <p style={{ fontSize: '0.8rem', margin: '4px 0 0 0', color: '#94a3b8' }}>
                          Serials are automatically registered when purchase orders with barcode scans are completed.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    warrantyData.serials.map((s) => (
                      <tr key={s.serial_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                          {s.serial_code}
                        </td>
                        <td style={{ padding: '8px 12px', color: '#64748b' }}>
                          {s.po_number || 'Initial'}
                        </td>
                        <td style={{ padding: '8px 12px', color: '#334155' }}>
                          {s.supplier_name || 'Vendor'}
                        </td>
                        <td style={{ padding: '8px 12px', color: '#0369a1', fontSize: '0.78rem', fontWeight: 600 }}>
                          {s.supplier_warranty_expire_date ? new Date(s.supplier_warranty_expire_date).toLocaleDateString() : '—'}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              background: s.status === 'Sold' ? '#fef3c7' : '#dcfce7',
                              color: s.status === 'Sold' ? '#b45309' : '#15803d',
                            }}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', color: '#0284c7' }}>
                          {s.sale_invoice_no || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setWarrantyModalProduct(null)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PRINT BARCODE & PRICE LABELS MODAL                               */}
      {/* ========================================================================= */}
      {labelModalProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
            backdropFilter: 'blur(3px)',
          }}
          onClick={() => setLabelModalProduct(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              maxWidth: '600px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  Print Barcode Labels
                </h3>
                <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '0.84rem' }}>
                  {labelModalProduct.composite_name || labelModalProduct.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLabelModalProduct(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: '#94a3b8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Label Quantity Selector */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Number of Labels to Print:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 4, 8, 12, 24].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setLabelQuantity(qty)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      border: labelQuantity === qty ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      background: labelQuantity === qty ? '#e0f2fe' : '#ffffff',
                      color: labelQuantity === qty ? '#0284c7' : '#334155',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    {qty}
                  </button>
                ))}
              </div>
            </div>

            {/* Sticker Preview Box */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                Sticker Preview (58mm x 38mm)
              </div>
              <div
                style={{
                  width: '240px',
                  background: '#ffffff',
                  border: '1.5px dashed #94a3b8',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  margin: '0 auto',
                }}
              >
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  SHEBA TECHNOLOGY
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', margin: '4px 0 2px 0', lineHeight: 1.2 }}>
                  {labelModalProduct.composite_name || labelModalProduct.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                  SKU: {labelModalProduct.sku || labelModalProduct.barcode || `PRD-${labelModalProduct.id}`}
                </div>
                {/* Simulated Barcode */}
                <div
                  style={{
                    height: '24px',
                    margin: '6px 0',
                    background: 'repeating-linear-gradient(90deg, #000 0, #000 2px, transparent 2px, transparent 4px, #000 4px, #000 6px, transparent 6px, transparent 8px)',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                    {labelModalProduct.warranty_months ? `Warranty: ${labelModalProduct.warranty_months}m` : ''}
                  </span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a' }}>
                    {taka(labelModalProduct.sale_price)}
                  </span>
                </div>
              </div>
            </div>

            {/* Hidden Printable Elements Generator */}
            <div style={{ display: 'none' }} ref={printLabelRef}>
              {Array.from({ length: labelQuantity }).map((_, idx) => (
                <div key={idx} className="label-sticker">
                  <div className="store-name">SHEBA TECHNOLOGY</div>
                  <div className="prod-title">{labelModalProduct.composite_name || labelModalProduct.name}</div>
                  <div className="prod-sku">SKU: {labelModalProduct.sku || labelModalProduct.barcode || `PRD-${labelModalProduct.id}`}</div>
                  <div className="barcode-lines"></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '7pt', color: '#64748b' }}>
                      {labelModalProduct.warranty_months ? `Warranty: ${labelModalProduct.warranty_months}m` : ''}
                    </span>
                    <span className="prod-price">{taka(labelModalProduct.sale_price)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setLabelModalProduct(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
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
                onClick={handlePrintLabels}
                style={{
                  padding: '8px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>🖨️</span> Print {labelQuantity} Labels
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: STOCK TRANSFER MODAL                                             */}
      {/* ========================================================================= */}
      {isTransferModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
            backdropFilter: 'blur(3px)',
          }}
          onClick={() => setIsTransferModalOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  🔄 Transfer Stock Between Warehouses
                </h3>
                <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '0.84rem' }}>
                  Move stock items from one warehouse or branch to another
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: '#94a3b8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer}>
              {/* Product Selection */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Select Product:
                </label>
                <select
                  value={transferForm.product_id}
                  onChange={(e) => setTransferForm({ ...transferForm, product_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    background: '#ffffff',
                  }}
                  required
                >
                  <option value="">-- Choose Product --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.composite_name || p.name} (In-Stock: {p.stock} pcs)
                    </option>
                  ))}
                </select>
              </div>

              {/* Source & Destination Warehouses */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    From (Source):
                  </label>
                  <select
                    value={transferForm.source_warehouse_id}
                    onChange={(e) => setTransferForm({ ...transferForm, source_warehouse_id: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      background: '#f8fafc',
                    }}
                  >
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    To (Destination):
                  </label>
                  <select
                    value={transferForm.dest_warehouse_id}
                    onChange={(e) => setTransferForm({ ...transferForm, dest_warehouse_id: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      background: '#f0fdf4',
                    }}
                  >
                    {warehouses
                      .filter((wh) => wh.id !== transferForm.source_warehouse_id)
                      .map((wh) => (
                        <option key={wh.id} value={wh.id}>
                          {wh.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Transfer Quantity */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Transfer Quantity (Units):
                </label>
                <input
                  type="number"
                  min="1"
                  value={transferForm.quantity}
                  onChange={(e) => setTransferForm({ ...transferForm, quantity: parseInt(e.target.value, 10) || 1 })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>

              {/* Transfer Notes */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Reference / Transfer Note:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Branch replenishment, showroom display, etc."
                  value={transferForm.notes}
                  onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
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
                  type="submit"
                  disabled={transferSubmitting}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#0284c7',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: transferSubmitting ? 'not-allowed' : 'pointer',
                    opacity: transferSubmitting ? 0.7 : 1,
                  }}
                >
                  {transferSubmitting ? 'Transferring...' : '✓ Confirm Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
