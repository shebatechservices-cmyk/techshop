import { useState, useEffect, useMemo, useRef } from 'react';
import API from '../../../services/api';
import {
  money,
  taka,
  getWarrantyValidity,
  exportToCsv,
  generateLabelPrintHtml,
  generatePriceListHtml,
} from '../utils/inventoryUtils';

// Re-export pure helpers for backwards compatibility
export { money, taka, getWarrantyValidity };

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
    const html = generateLabelPrintHtml(printContent, labelModalProduct);
    const win = window.open('', '_blank');
    win.document.write(html);
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
    const exported = exportToCsv(list);
    if (exported) {
      showNotification(`Exported ${list.length} products to CSV`);
    }
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

    const html = generatePriceListHtml(list, shop);
    const win = window.open('', '_blank');
    win.document.write(html);
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
