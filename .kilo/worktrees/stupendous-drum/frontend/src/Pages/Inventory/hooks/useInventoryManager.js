import { useState, useEffect, useMemo, useRef } from 'react';
import API from '../../../services/api';

export const money = (val) => Number.parseFloat(val || 0) || 0;
export const taka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const getWarrantyValidity = (dateStr) => {
  if (!dateStr) return null;
  const exp = new Date(dateStr);
  if (isNaN(exp.getTime())) return null;
  const now = new Date();
  const expDay = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = expDay.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return { expired: true, text: `Expired (${Math.abs(diffDays)}d ago)`, colorClass: 'text-red-500 bg-red-50' };
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
    colorClass: isNear ? 'text-amber-700 bg-amber-100' : 'text-green-700 bg-green-100'
  };
};

export default function useInventoryManager({ onOpenNewSale } = {}) {
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
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
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
        fetch(`${API}/warehouses?active=true`).catch(() => null),
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
          const defaultWh = whJson.data.find((w) => w.is_default);
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

    const headers = ['Product ID', 'Product Title', 'Brand', 'Model', 'Category', 'SKU', 'Barcode', 'Available Stock', 'Cost Price (BDT)', 'Sale Price (BDT)', 'Warranty (Months)', 'Status'];
    const rows = list.map((p) => [
      p.id,
      `"${(p.composite_name || p.name).replace(/"/g, '""')}"`,
      `"${(p.brand_name || '').replace(/"/g, '""')}"`,
      `"${(p.model_name || '').replace(/"/g, '""')}"`,
      `"${(p.category_name || '').replace(/"/g, '""')}"`,
      `"${(p.sku || '').replace(/"/g, '""')}"`,
      `"${(p.barcode || '').replace(/"/g, '""')}"`,
      p.stock,
      p.cost_price ?? p.costPrice ?? 0,
      p.sale_price ?? p.salePrice ?? 0,
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

  return {
    // States
    products,
    setProducts,
    warehouses,
    setWarehouses,
    selectedWarehouseId,
    setSelectedWarehouseId,
    summary,
    loading,
    stockFilter,
    setStockFilter,
    categoryFilter,
    setCategoryFilter,
    searchQuery,
    setSearchQuery,
    selectedProductIds,
    setSelectedProductIds,
    revealedCostIds,
    showCostValuation,
    setShowCostValuation,
    openActionId,
    setOpenActionId,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    toast,
    setToast,
    isWarehouseModalOpen,
    setIsWarehouseModalOpen,
    warrantyModalProduct,
    setWarrantyModalProduct,
    warrantyData,
    setWarrantyData,
    labelModalProduct,
    setLabelModalProduct,
    labelQuantity,
    setLabelQuantity,
    isTransferModalOpen,
    setIsTransferModalOpen,
    transferForm,
    setTransferForm,
    transferSubmitting,
    isPriceListOpen,
    setIsPriceListOpen,

    // Refs
    printLabelRef,
    printPriceListRef,

    // Computed / Memos
    categoryList,
    activeWarrantyCount,
    filteredProducts,
    totalPages,
    currentPageSafe,
    paginatedProducts,
    isAllSelected,

    // Handlers
    showNotification,
    loadInventory,
    toggleCostVisibility,
    toggleSelectAll,
    toggleSelectRow,
    handleToggleEcommerce,
    handleOpenWarrantyModal,
    handleOpenLabelModal,
    handlePrintLabels,
    handleOpenTransferModal,
    handleExecuteTransfer,
    handleDownloadCsv,
    handleCopyPriceList,
    handlePrintPriceList,
  };
}
