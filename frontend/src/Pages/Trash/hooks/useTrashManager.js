import { useState, useEffect } from 'react';
import API from '../../../services/api';

export const MODULE_TABS = [
  { key: 'all', label: 'All Trashed Data', bn: 'সব ডেটা', icon: '🗑️', color: '#0284c7' },
  { key: 'products', label: 'Products', bn: 'পণ্য', icon: '📦', color: '#38bdf8' },
  { key: 'sales', label: 'Sales Invoices', bn: 'বিক্রয় মেমো', icon: '🧾', color: '#10b981' },
  { key: 'purchases', label: 'Purchases', bn: 'ক্রয় চালান', icon: '🛒', color: '#f59e0b' },
  { key: 'customers', label: 'Customers', bn: 'গ্রাহক', icon: '👥', color: '#8b5cf6' },
  { key: 'suppliers', label: 'Suppliers', bn: 'সরবরাহকারী', icon: '🏭', color: '#ec4899' },
  { key: 'expenses', label: 'Expenses', bn: 'দৈনিক খরচ', icon: '💸', color: '#f43f5e' },
  { key: 'projects', label: 'Projects', bn: 'সার্ভিস প্রজেক্ট', icon: '🛠️', color: '#6366f1' },
  { key: 'ecommerce', label: 'E-Commerce', bn: 'অনলাইন অর্ডার', icon: '🌐', color: '#06b6d4' },
  { key: 'categories', label: 'Categories', bn: 'ক্যাটাগরি', icon: '🏷️', color: '#14b8a6' },
  { key: 'sub_categories', label: 'Sub-Categories', bn: 'সাব-ক্যাটাগরি', icon: '📂', color: '#06b6d4' },
  { key: 'brands', label: 'Brands', bn: 'ব্র্যান্ড', icon: '🏷️', color: '#eab308' },
  { key: 'product_names', label: 'Product Names', bn: 'পণ্যের নাম', icon: '📝', color: '#22c55e' },
  { key: 'models', label: 'Models', bn: 'মডেল', icon: '📐', color: '#a855f7' },
  { key: 'series', label: 'Series', bn: 'সিরিজ', icon: '🔖', color: '#f97316' },
  { key: 'quotations', label: 'Quotations', bn: 'কোটেশন', icon: '📑', color: '#a855f7' },
  { key: 'warranty_claims', label: 'Warranty', bn: 'ওয়ারেন্টি', icon: '🛡️', color: '#0ea5e9' },
  { key: 'users', label: 'Staff / Users', bn: 'কর্মী', icon: '👤', color: '#64748b' },
];

export default function useTrashManager() {
  const [selectedModule, setSelectedModule] = useState('all');
  const [trashItems, setTrashItems] = useState([]);
  const [counts, setCounts] = useState({ all: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [actionMsg, setActionMsg] = useState({ text: '', type: 'success' });
  const [previewItem, setPreviewItem] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const showToast = (text, type = 'success') => {
    setActionMsg({ text, type });
    setTimeout(() => setActionMsg({ text: '', type: 'success' }), 4000);
  };

  const notifyDataChanged = () => {
    window.dispatchEvent(new CustomEvent('data_changed'));
    window.dispatchEvent(new CustomEvent('inventory_stock_changed'));
  };

  // Load counts for all tabs
  const loadCounts = async () => {
    try {
      const res = await fetch(`${API}/trash/counts`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.counts) {
          setCounts(data.counts);
        }
      }
    } catch (err) {
      console.error('Error fetching trash counts:', err);
    }
  };

  // Load trash items (either 'all' or specific module)
  const loadTrash = async (mod = selectedModule, search = searchQuery) => {
    try {
      setLoading(true);
      const url = `${API}/trash/all?module=${mod}${search ? `&search=${encodeURIComponent(search)}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTrashItems(data.data || []);
      } else {
        setTrashItems([]);
      }
    } catch (err) {
      console.error('Error loading trash items:', err);
      showToast('Failed to load trash data', 'error');
    } finally {
      setLoading(false);
      setSelectedIds([]);
    }
  };

  useEffect(() => {
    loadCounts();
    loadTrash(selectedModule, searchQuery);
  }, [selectedModule]);

  // Handle Search Input with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      loadTrash(selectedModule, searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Restore Single Item
  const handleRestore = async (item) => {
    try {
      setIsProcessing(true);
      const res = await fetch(`${API}/trash/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ module_name: item.module, id: item.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Item restored successfully!', 'success');
        notifyDataChanged();
        loadCounts();
        loadTrash(selectedModule, searchQuery);
      } else {
        showToast(data.message || 'Failed to restore', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error communicating with server', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Restore All Items (in current view or all)
  const handleRestoreAll = async () => {
    const targetDesc =
      selectedModule === 'all' ? 'ALL items in the trash' : `all ${selectedModule} items`;
    if (
      !window.confirm(
        `Are you sure you want to restore ${targetDesc}? They will immediately be available in active records.`
      )
    ) {
      return;
    }

    try {
      setIsProcessing(true);
      const res = await fetch(`${API}/trash/restore-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ module_name: selectedModule }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'All items restored successfully!', 'success');
        notifyDataChanged();
        loadCounts();
        loadTrash(selectedModule, searchQuery);
      } else {
        showToast(data.message || 'Failed to restore all items', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error communicating with server', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Permanent Delete Single Item
  const handlePermanentDelete = async (item) => {
    const confirmPrompt = window.confirm(
      `⚠️ PERMANENT DELETE WARNING:
Are you absolutely sure you want to permanently delete:
"${item.title}"?

This action CANNOT be undone! The record will be permanently wiped from the database.`
    );
    if (!confirmPrompt) return;

    try {
      setIsProcessing(true);
      const res = await fetch(`${API}/trash/permanent`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ module_name: item.module, id: item.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Item permanently deleted!', 'success');
        notifyDataChanged();
        loadCounts();
        loadTrash(selectedModule, searchQuery);
      } else {
        showToast(data.message || 'Failed to delete item', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error communicating with server', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Empty Entire Trash
  const handleEmptyTrash = async () => {
    const targetDesc =
      selectedModule === 'all'
        ? 'the ENTIRE Recycle Bin (all modules)'
        : `all deleted ${selectedModule}`;
    const firstCheck = window.confirm(
      `🚨 CRITICAL ACTION:
You are about to EMPTY ${targetDesc}!

All deleted items will be permanently destroyed. Are you sure?`
    );
    if (!firstCheck) return;

    try {
      setIsProcessing(true);
      const res = await fetch(`${API}/trash/empty`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ module_name: selectedModule }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Trash emptied successfully!', 'success');
        notifyDataChanged();
        loadCounts();
        loadTrash(selectedModule, searchQuery);
      } else {
        showToast(data.message || 'Failed to empty trash', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error communicating with server', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle selection
  const handleToggleSelect = (itemKey) => {
    setSelectedIds((prev) =>
      prev.includes(itemKey) ? prev.filter((k) => k !== itemKey) : [...prev, itemKey]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === trashItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(trashItems.map((item) => `${item.module}_${item.id}`));
    }
  };

  // Batch restore selected
  const handleBatchRestore = async () => {
    if (!selectedIds.length) return;
    setIsProcessing(true);
    let successCount = 0;

    for (const key of selectedIds) {
      const [mod, idStr] = key.split('_');
      try {
        const res = await fetch(`${API}/trash/restore`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ module_name: mod, id: parseInt(idStr, 10) }),
        });
        if (res.ok) successCount++;
      } catch (e) {}
    }

    showToast(`✓ Successfully restored ${successCount} items!`, 'success');
    setIsProcessing(false);
    notifyDataChanged();
    loadCounts();
    loadTrash(selectedModule, searchQuery);
  };

  // Batch permanent delete selected
  const handleBatchDelete = async () => {
    if (!selectedIds.length) return;
    if (
      !window.confirm(
        `Permanently delete ${selectedIds.length} selected items? This CANNOT be undone!`
      )
    )
      return;

    setIsProcessing(true);
    let successCount = 0;

    for (const key of selectedIds) {
      const [mod, idStr] = key.split('_');
      try {
        const res = await fetch(`${API}/trash/permanent`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ module_name: mod, id: parseInt(idStr, 10) }),
        });
        if (res.ok) successCount++;
      } catch (e) {}
    }

    showToast(`✓ Permanently deleted ${successCount} items!`, 'success');
    setIsProcessing(false);
    notifyDataChanged();
    loadCounts();
    loadTrash(selectedModule, searchQuery);
  };

  const totalTrashCount = counts.all || 0;

  return {
    MODULE_TABS,
    selectedModule,
    setSelectedModule,
    trashItems,
    counts,
    loading,
    searchQuery,
    setSearchQuery,
    selectedIds,
    actionMsg,
    previewItem,
    setPreviewItem,
    isProcessing,
    showToast,
    loadCounts,
    loadTrash,
    handleRestore,
    handleRestoreAll,
    handlePermanentDelete,
    handleEmptyTrash,
    handleToggleSelect,
    handleSelectAll,
    handleBatchRestore,
    handleBatchDelete,
    totalTrashCount,
  };
}
