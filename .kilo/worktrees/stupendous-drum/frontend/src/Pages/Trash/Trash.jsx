import React, { useState, useEffect, useMemo } from 'react';
import API from '../../services/api';

const MODULE_TABS = [
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
  { key: 'users', label: 'Staff / Users', bn: 'কর্মী', icon: '👤', color: '#64748b' }
];

export default function Trash() {
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
  const notifyDataChanged = () => {
    window.dispatchEvent(new CustomEvent('data_changed'));
    window.dispatchEvent(new CustomEvent('inventory_stock_changed'));
  };

  const handleRestore = async (item) => {
    try {
      setIsProcessing(true);
      const res = await fetch(`${API}/trash/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ module_name: item.module, id: item.id })
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
    const targetDesc = selectedModule === 'all' ? 'ALL items in the trash' : `all ${selectedModule} items`;
    if (!window.confirm(`Are you sure you want to restore ${targetDesc}? They will immediately be available in active records.`)) {
      return;
    }

    try {
      setIsProcessing(true);
      const res = await fetch(`${API}/trash/restore-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ module_name: selectedModule })
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
        body: JSON.stringify({ module_name: item.module, id: item.id })
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
    const targetDesc = selectedModule === 'all' ? 'the ENTIRE Recycle Bin (all modules)' : `all deleted ${selectedModule}`;
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
        body: JSON.stringify({ module_name: selectedModule })
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
    setSelectedIds(prev => 
      prev.includes(itemKey) ? prev.filter(k => k !== itemKey) : [...prev, itemKey]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === trashItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(trashItems.map(item => `${item.module}_${item.id}`));
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
          headers: { 'Content-Type': 'application/json',},
          body: JSON.stringify({ module_name: mod, id: parseInt(idStr, 10) })
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
    if (!window.confirm(`Permanently delete ${selectedIds.length} selected items? This CANNOT be undone!`)) return;

    setIsProcessing(true);
    let successCount = 0;

    for (const key of selectedIds) {
      const [mod, idStr] = key.split('_');
      try {
        const res = await fetch(`${API}/trash/permanent`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json',},
          body: JSON.stringify({ module_name: mod, id: parseInt(idStr, 10) })
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

  return (
    <div style={{
      padding: '16px 20px',
      background: '#0f172a',
      minHeight: 'calc(100vh - 70px)',
      color: '#f8fafc',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      {/* Toast Notification */}
      {actionMsg.text && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          background: actionMsg.type === 'error' ? '#ef4444' : '#10b981',
          color: '#fff',
          padding: '10px 18px',
          borderRadius: '8px',
          fontSize: '0.86rem',
          fontWeight: 700,
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>{actionMsg.type === 'error' ? '⚠' : '✓'}</span>
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* 1. TOP SINGLE-ROW CONSOLIDATED HEADER */}
      <div style={{
        background: '#1e293b',
        borderRadius: '12px',
        padding: '10px 16px',
        marginBottom: '14px',
        border: '1px solid #334155',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Left: Title & Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '9px',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            boxShadow: '0 0 12px rgba(239, 68, 68, 0.35)'
          }}>
            🗑️
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#fff', letterSpacing: '0.2px' }}>
                Global Trash &amp; Data Recovery
              </h2>
              <span style={{
                background: totalTrashCount > 0 ? '#ef4444' : '#334155',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.7rem',
                fontWeight: 800
              }}>
                {totalTrashCount} {totalTrashCount === 1 ? 'Record' : 'Records'}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '1px' }}>
              গ্লোবাল ট্র্যাশ ও ডেটা পুনরুদ্ধার কেন্দ্র • Store and safely restore any deleted user records
            </div>
          </div>
        </div>

        {/* Center: Realtime Search */}
        <div style={{ minWidth: '220px', maxWidth: '320px', flex: '1 1 220px' }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            <span style={{ position: 'absolute', left: '10px', fontSize: '0.85rem', color: '#94a3b8' }}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search trashed items by title, id, sku, amount..."
              style={{
                width: '100%',
                padding: '7px 10px 7px 32px',
                background: '#0f172a',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.8rem',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right: Global Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleRestoreAll}
            disabled={trashItems.length === 0 || isProcessing}
            title="Restore all records in this view back to their original tables"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: trashItems.length === 0 || isProcessing ? 'not-allowed' : 'pointer',
              opacity: trashItems.length === 0 || isProcessing ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
            }}
          >
            <span>🔄</span>
            <span>Restore All</span>
          </button>

          <button
            type="button"
            onClick={handleEmptyTrash}
            disabled={trashItems.length === 0 || isProcessing}
            title="Permanently wipe all records in this view"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              border: '1px solid #ef4444',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: trashItems.length === 0 || isProcessing ? 'not-allowed' : 'pointer',
              opacity: trashItems.length === 0 || isProcessing ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>⚠️</span>
            <span>Empty Trash</span>
          </button>

          <button
            type="button"
            onClick={() => { loadCounts(); loadTrash(selectedModule, searchQuery); }}
            title="Sync & refresh trash records"
            style={{
              background: '#0f172a',
              color: '#94a3b8',
              border: '1px solid #334155',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            🔁
          </button>
        </div>
      </div>

      {/* 2. HORIZONTAL MODULE SELECTOR TABS */}
      <div style={{
        background: '#131e32',
        borderRadius: '10px',
        padding: '6px',
        marginBottom: '14px',
        border: '1px solid #1e293b',
        display: 'flex',
        overflowX: 'auto',
        gap: '4px',
        scrollbarWidth: 'thin'
      }}>
        {MODULE_TABS.map(tab => {
          const tabCount = counts[tab.key] ?? 0;
          const isActive = selectedModule === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedModule(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '7px',
                border: 'none',
                background: isActive ? '#0284c7' : 'transparent',
                color: isActive ? '#ffffff' : '#94a3b8',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.76rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span style={{
                background: isActive ? 'rgba(255, 255, 255, 0.25)' : tabCount > 0 ? tab.color : '#334155',
                color: '#fff',
                borderRadius: '10px',
                padding: '1px 6px',
                fontSize: '0.64rem',
                fontWeight: 800
              }}>
                {tabCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Batch Action Toolbar (When items selected) */}
      {selectedIds.length > 0 && (
        <div style={{
          background: 'linear-gradient(90deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid #38bdf8',
          borderRadius: '10px',
          padding: '8px 16px',
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          animation: 'fadeIn 0.2s ease'
        }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#38bdf8' }}>
            ✓ {selectedIds.length} {selectedIds.length === 1 ? 'item' : 'items'} selected
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleBatchRestore}
              style={{
                background: '#10b981',
                color: '#fff',
                border: 'none',
                padding: '5px 14px',
                borderRadius: '6px',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ↩ Restore Selected
            </button>
            <button
              type="button"
              onClick={handleBatchDelete}
              style={{
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                padding: '5px 14px',
                borderRadius: '6px',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🗑️ Delete Selected Permanently
            </button>
          </div>
        </div>
      )}

      {/* 3. TRASH DATA TABLE & CARDS */}
      <div style={{
        background: '#1e293b',
        borderRadius: '12px',
        border: '1px solid #334155',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid #334155',
              borderTop: '3px solid #38bdf8',
              borderRadius: '50%',
              margin: '0 auto 12px',
              animation: 'spin 0.7s linear infinite'
            }} />
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>Loading global trash records...</span>
          </div>
        ) : trashItems.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>✨</div>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', color: '#fff' }}>
              Recycle Bin is Clean!
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
              {searchQuery
                ? `No trashed items matched "${searchQuery}".`
                : selectedModule === 'all'
                ? 'There are currently no deleted records in the system.'
                : `No deleted items in ${selectedModule}.`}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#131e32', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                  <th style={{ padding: '10px 14px', width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.length === trashItems.length && trashItems.length > 0}
                      onChange={handleSelectAll}
                      style={{ cursor: 'pointer', accentColor: '#0284c7' }}
                    />
                  </th>
                  <th style={{ padding: '10px 12px', width: '70px' }}>ID</th>
                  <th style={{ padding: '10px 14px', width: '140px' }}>Module / Type</th>
                  <th style={{ padding: '10px 14px' }}>Record Details &amp; Summary</th>
                  <th style={{ padding: '10px 14px', width: '160px' }}>Deleted Date</th>
                  <th style={{ padding: '10px 14px', width: '100px' }}>Deleted By</th>
                  <th style={{ padding: '10px 16px', width: '190px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trashItems.map((item) => {
                  const itemKey = `${item.module}_${item.id}`;
                  const isSelected = selectedIds.includes(itemKey);
                  return (
                    <tr
                      key={itemKey}
                      style={{
                        borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
                        background: isSelected ? 'rgba(2, 132, 199, 0.12)' : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '10px 14px' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(itemKey)}
                          style={{ cursor: 'pointer', accentColor: '#0284c7' }}
                        />
                      </td>

                      {/* ID */}
                      <td style={{ padding: '10px 12px', fontWeight: 800, color: '#64748b' }}>
                        #{item.id}
                      </td>

                      {/* Module Badge */}
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          background: '#0f172a',
                          color: '#38bdf8',
                          border: '1px solid #334155',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          whiteSpace: 'nowrap'
                        }}>
                          <span>{item.icon || '📦'}</span>
                          <span>{item.module_label || item.module}</span>
                        </span>
                      </td>

                      {/* Title & Subtitle */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{item.title}</span>
                          <button
                            type="button"
                            onClick={() => setPreviewItem(item)}
                            title="Inspect raw data record"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#38bdf8',
                              cursor: 'pointer',
                              padding: 0,
                              fontSize: '0.75rem',
                              textDecoration: 'underline'
                            }}
                          >
                            [Inspect]
                          </button>
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '0.74rem', marginTop: '2px' }}>
                          {item.subtitle}
                        </div>
                      </td>

                      {/* Deleted Date */}
                      <td style={{ padding: '10px 14px', color: '#f87171', fontSize: '0.76rem', whiteSpace: 'nowrap' }}>
                        {item.deleted_at ? new Date(item.deleted_at).toLocaleString() : 'Recently'}
                      </td>

                      {/* Deleted By */}
                      <td style={{ padding: '10px 14px', color: '#cbd5e1', fontSize: '0.76rem' }}>
                        {item.deleted_by || 'Admin'}
                      </td>

                      {/* Action Buttons */}
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {/* 1-Click Restore Button */}
                          <button
                            type="button"
                            onClick={() => handleRestore(item)}
                            disabled={isProcessing}
                            title="Restore this record back to active state"
                            style={{
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: '#fff',
                              border: 'none',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: '0 2px 5px rgba(16, 185, 129, 0.25)'
                            }}
                          >
                            <span>↩</span>
                            <span>Restore</span>
                          </button>

                          {/* Permanent Delete Button */}
                          <button
                            type="button"
                            onClick={() => handlePermanentDelete(item)}
                            disabled={isProcessing}
                            title="Permanently erase this record"
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              color: '#f87171',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              padding: '4px 9px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <span>🗑️</span>
                            <span>Wipe</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. RAW RECORD INSPECTOR MODAL */}
      {previewItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999999,
          padding: '16px'
        }}>
          <div style={{
            background: '#0f172a',
            color: '#f8fafc',
            width: '100%',
            maxWidth: '650px',
            maxHeight: '80vh',
            borderRadius: '14px',
            border: '1px solid #38bdf8',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '14px 18px',
              background: '#1e293b',
              borderBottom: '1px solid #334155',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>{previewItem.icon || '📦'}</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.96rem', color: '#fff' }}>
                    Record Snapshot: {previewItem.title}
                  </h4>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Module: <strong>{previewItem.module_label || previewItem.module}</strong> (Table: <code>{previewItem.table_name}</code>)
                  </div>
                </div>
              </div>

              <button
                onClick={() => setPreviewItem(null)}
                style={{
                  background: '#334155',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  width: '28px',
                  height: '28px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              <div style={{
                background: '#090d16',
                borderRadius: '8px',
                padding: '12px',
                border: '1px solid #334155',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                color: '#34d399',
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(previewItem.raw_data || previewItem, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '12px 18px',
              background: '#1e293b',
              borderTop: '1px solid #334155',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <button
                type="button"
                onClick={() => {
                  handleRestore(previewItem);
                  setPreviewItem(null);
                }}
                style={{
                  background: '#10b981',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 16px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                ↩ Restore Record Now
              </button>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                style={{
                  background: '#334155',
                  color: '#cbd5e1',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
