import React, { useState, useEffect, useMemo } from 'react';
import API from '../../services/api';
import PurchaseOrderModal from './PurchaseOrderModal';
import PurchaseQuotationModal from './PurchaseQuotationModal';
import AddSupplierModal from './AddSupplierModal';
import PurchasePrintModal from './PurchasePrintModal';
import PartyProfileModal from '../../components/PartyProfileModal';

export default function Purchases({ onOpenAddProduct, initialTab = 'history', initialSearch = '', navKey = 0 }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'history'); // 'history' | 'quotations' | 'suppliers'

  const [orders, setOrders] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [profileModalPartyId, setProfileModalPartyId] = useState(null);
  const [profileModalTab, setProfileModalTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [notification, setNotification] = useState({ message: '', type: '' });

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      if (initialSearch !== undefined) {
        setSearchQuery(initialSearch || '');
      }
    }
  }, [initialTab, initialSearch, navKey]);

  // Modals state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState(null);
  const [openActionOrderId, setOpenActionOrderId] = useState(null);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [newlyCreatedSupplier, setNewlyCreatedSupplier] = useState(null);
  const [printOrder, setPrintOrder] = useState(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Click outside to close action dropdowns
  useEffect(() => {
    const handleDocClick = () => setOpenActionOrderId(null);
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  const handleOpenPrintOrder = async (orderId) => {
    try {
      const res = await fetch(`${API}/purchase/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setPrintOrder(data);
        setIsPrintOpen(true);
      } else {
        showToast('Failed to load purchase order details for printing', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading purchase order for printing', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 4000);
  };

  const handleOpenAddSupplier = () => {
    setActiveTab('suppliers');
    setIsSupplierModalOpen(true);
  };

  const handleSupplierCreated = (createdSupplier) => {
    setNewlyCreatedSupplier(createdSupplier);
    setIsSupplierModalOpen(false);
    loadAllData();
    showToast('Supplier registered successfully');
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [orderRes, quoteRes, suppRes, prodRes] = await Promise.all([
        fetch(`${API}/purchase`).catch(() => null),
        fetch(`${API}/purchase/quotations`).catch(() => null),
        fetch(`${API}/purchase/suppliers`).catch(() => null),
        fetch(`${API}/master/products`).catch(() => null),
      ]);

      if (orderRes && orderRes.ok) {
        const oData = await orderRes.json();
        setOrders(Array.isArray(oData) ? oData : (oData.data || []));
      }
      if (quoteRes && quoteRes.ok) {
        const qData = await quoteRes.json();
        setQuotations(Array.isArray(qData) ? qData : (qData.data || []));
      }
      if (suppRes && suppRes.ok) {
        const sData = await suppRes.json();
        setSuppliers(Array.isArray(sData) ? sData : (sData.data || []));
      }
      if (prodRes && prodRes.ok) {
        const pData = await prodRes.json();
        setProducts(Array.isArray(pData) ? pData : (pData.data || []));
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load data from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    const refresh = () => loadAllData();
    window.addEventListener('inventory_stock_changed', refresh);
    window.addEventListener('data_changed', refresh);
    return () => {
      window.removeEventListener('inventory_stock_changed', refresh);
      window.removeEventListener('data_changed', refresh);
    };
  }, []);

  // Edit Order: Permitted within 72 hours
  const handleEditOrder = async (order) => {
    const createdAt = new Date(order.created_at || Date.now());
    const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursOld > 72) {
      showToast(`⚠️ Editing expired: PO #${order.po_number || order.id} was created ${Math.floor(hoursOld)}h ago. Edits are only permitted within 72 hours. Developer assistance required.`, 'error');
      return;
    }

    try {
      const res = await fetch(`${API}/purchase/${order.id}`);
      if (res.ok) {
        const fullData = await res.json();
        setOrderToEdit(fullData);
        setIsOrderModalOpen(true);
      } else {
        showToast('Failed to load order details for editing', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading purchase order for editing', 'error');
    }
  };

  // Delete Order: Permitted within 24 hours, blocked if sold
  const handleDeleteOrder = async (id, order) => {
    const createdAt = new Date(order?.created_at || Date.now());
    const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursOld > 24) {
      showToast(`⚠️ Deletion expired: PO #${order?.po_number || id} was created ${Math.floor(hoursOld)}h ago. Deletions are only permitted within 24 hours. Developer assistance required.`, 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete purchase order #${order?.po_number || id}? Items will be deducted from inventory.`)) return;
    try {
      const res = await fetch(`${API}/purchase/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('inventory_stock_changed'));
        window.dispatchEvent(new CustomEvent('data_changed'));
        loadAllData();
        showToast(data.message || 'Purchase order deleted successfully');
      } else {
        showToast(data.error || 'Failed to delete purchase order', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Server error while deleting order', 'error');
    }
  };

  // Delete Quotation
  const handleDeleteQuotation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this purchase quotation?')) return;
    try {
      const res = await fetch(`${API}/purchase/quotations/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('data_changed'));
        loadAllData();
        showToast(data.message || 'Quotation deleted successfully');
      } else {
        showToast(data.error || 'Failed to delete quotation', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Server error while deleting quotation', 'error');
    }
  };

  // Edit Quotation
  const handleEditQuotation = async (quoteOrId) => {
    const quoteId = typeof quoteOrId === 'object' ? (quoteOrId.id || quoteOrId.quotation_id) : quoteOrId;
    try {
      const res = await fetch(`${API}/purchase/quotations/${quoteId}`);
      if (res.ok) {
        const json = await res.json();
        setEditingQuotation(json.data || json);
        setIsQuotationModalOpen(true);
      } else {
        showToast('Failed to load quotation for editing', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error fetching quotation details', 'error');
    }
  };

  // Update Quotation Status
  const handleUpdateQuotationStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`${API}/purchase/quotations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setQuotations((prev) =>
          prev.map((q) => (q.id === id ? { ...q, status: newStatus } : q))
        );
        showToast(`Quotation status updated to ${newStatus}`);
      } else {
        showToast(data.error || 'Failed to update status', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Server error updating quotation status', 'error');
    }
  };

  // Delete Supplier
  const handleDeleteSupplier = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    try {
      const res = await fetch(`${API}/purchase/suppliers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('data_changed'));
        loadAllData();
        showToast(data.message || 'Supplier deleted successfully');
      } else {
        showToast(data.error || 'Cannot delete supplier', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Server error deleting supplier', 'error');
    }
  };

  // Filtered lists
  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) =>
      o.po_number?.toLowerCase().includes(q) ||
      o.supplier_name?.toLowerCase().includes(q) ||
      o.transaction_reference?.toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

  const filteredQuotations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return quotations;
    return quotations.filter((item) =>
      item.quotation_no?.toLowerCase().includes(q) ||
      item.supplier_name?.toLowerCase().includes(q) ||
      item.reference?.toLowerCase().includes(q)
    );
  }, [quotations, searchQuery]);

  const filteredSuppliers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter((s) =>
      s.name?.toLowerCase().includes(q) ||
      s.contact_person?.toLowerCase().includes(q) ||
      s.phone?.includes(q) ||
      s.mobile?.includes(q)
    );
  }, [suppliers, searchQuery]);

  // Totals
  const totalPurchasesCost = orders.reduce((sum, o) => sum + Number(o.total_cost || 0), 0);
  const totalPurchasesPaid = orders.reduce((sum, o) => sum + Number(o.total_paid || 0), 0);
  const totalPurchasesDue = orders.reduce((sum, o) => sum + Number(o.total_due || 0), 0);

  const totalQuotationAmount = quotations.reduce((sum, q) => sum + Number(q.total_amount || 0), 0);
  const totalSupplierDue = suppliers.reduce((sum, s) => sum + Number(s.payable_balance || 0), 0);

  const getQuotationBadgeStyle = (status) => {
    switch (status) {
      case 'approved':
        return { background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' };
      case 'ordered':
        return { background: '#f3e8ff', color: '#7e22ce', border: '1px solid #e9d5ff' };
      case 'rejected':
        return { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' };
      case 'pending':
        return { background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' };
      default:
        return { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' };
    }
  };

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'inherit' }}>
      {/* Toast Notification */}
      {notification.message && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 99999,
          padding: '12px 20px',
          borderRadius: '10px',
          fontWeight: 600,
          fontSize: '0.9rem',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
          background: notification.type === 'error' ? '#ef4444' : '#10b981',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>{notification.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* 1. Consolidated Header, Tabs & Action Buttons in a Single Sleek Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '1.5px solid #e2e8f0',
        }}
      >
        {/* Left: Compact Title & Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.3rem' }}>🚚</span>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Purchases & Procurement
            </h1>
          </div>
        </div>

        {/* Center: Inline Tab Navigation */}
        <div
          style={{
            display: 'flex',
            background: '#f1f5f9',
            padding: '3px',
            borderRadius: '8px',
            gap: '3px',
          }}
        >
          <button
            type="button"
            onClick={() => { setActiveTab('history'); setSearchQuery(''); }}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'history' ? '#0284c7' : 'transparent',
              color: activeTab === 'history' ? '#ffffff' : '#64748b',
              fontWeight: activeTab === 'history' ? 700 : 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Orders</span>
            <span
              style={{
                background: activeTab === 'history' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                color: activeTab === 'history' ? '#ffffff' : '#475569',
                padding: '1px 6px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}
            >
              {orders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('quotations'); setSearchQuery(''); }}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'quotations' ? '#4f46e5' : 'transparent',
              color: activeTab === 'quotations' ? '#ffffff' : '#64748b',
              fontWeight: activeTab === 'quotations' ? 700 : 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Quotations</span>
            <span
              style={{
                background: activeTab === 'quotations' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                color: activeTab === 'quotations' ? '#ffffff' : '#475569',
                padding: '1px 6px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}
            >
              {quotations.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('suppliers'); setSearchQuery(''); }}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'suppliers' ? '#059669' : 'transparent',
              color: activeTab === 'suppliers' ? '#ffffff' : '#64748b',
              fontWeight: activeTab === 'suppliers' ? 700 : 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Suppliers</span>
            <span
              style={{
                background: activeTab === 'suppliers' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                color: activeTab === 'suppliers' ? '#ffffff' : '#475569',
                padding: '1px 6px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}
            >
              {suppliers.length}
            </span>
          </button>
        </div>

        {/* Right: 3 Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              setActiveTab('history');
              setIsOrderModalOpen(true);
            }}
            style={{
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '6px 13px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 1px 3px rgba(2, 132, 199, 0.25)',
            }}
          >
            <span>+</span> Order
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('quotations');
              setIsQuotationModalOpen(true);
            }}
            style={{
              background: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              padding: '6px 13px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 1px 3px rgba(79, 70, 229, 0.25)',
            }}
          >
            <span>+</span> Quotation
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('suppliers');
              setIsSupplierModalOpen(true);
            }}
            style={{
              background: '#ffffff',
              color: '#059669',
              border: '1px solid #10b981',
              padding: '5px 12px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>+</span> Supplier
          </button>
        </div>
      </div>

      {/* TAB 1: PURCHASE HISTORY */}
      {activeTab === 'history' && (
        <div>
          {/* Stats Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '12px' }}>
            <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Total Purchase Cost
              </span>
              <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0 0', color: '#0284c7', fontWeight: 800 }}>
                ৳ {totalPurchasesCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Total Paid to Suppliers
              </span>
              <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0 0', color: '#16a34a', fontWeight: 800 }}>
                ৳ {totalPurchasesPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Outstanding Due
              </span>
              <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0 0', color: totalPurchasesDue > 0 ? '#ef4444' : '#64748b', fontWeight: 800 }}>
                ৳ {totalPurchasesDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Orders Placed
              </span>
              <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0 0', color: '#0f172a', fontWeight: 800 }}>
                {orders.length}
              </h3>
            </div>
          </div>

          {/* Search bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by PO number, supplier..."
              style={{
                maxWidth: '300px',
                width: '100%',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                outline: 'none',
                background: '#ffffff',
              }}
            />
            <button
              onClick={loadAllData}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                color: '#475569',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              🔄 Refresh
            </button>
          </div>

          {/* Table */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading purchase history...</div>
            ) : filteredOrders.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <p style={{ color: '#94a3b8', fontSize: '1.05rem', margin: 0 }}>No purchase orders found</p>
                <button
                  onClick={() => setIsOrderModalOpen(true)}
                  style={{
                    marginTop: '12px',
                    background: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  + Create First Purchase Order
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                      <th style={{ padding: '12px 16px' }}>PO Number</th>
                      <th style={{ padding: '12px 16px' }}>Supplier</th>
                      <th style={{ padding: '12px 16px' }}>Date</th>
                      <th style={{ padding: '12px 16px' }}>Items / Units</th>
                      <th style={{ padding: '12px 16px' }}>Total Cost</th>
                      <th style={{ padding: '12px 16px' }}>Paid</th>
                      <th style={{ padding: '12px 16px' }}>Due</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0284c7' }}>
                          {order.po_number}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#1e293b', fontWeight: 600 }}>
                          {order.supplier_name || `Supplier #${order.supplier_id}`}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.85rem' }}>
                          {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#475569' }}>
                          {order.item_count} Items ({order.unit_count} Units)
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                          ৳ {Number(order.total_cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#16a34a', fontWeight: 700 }}>
                          ৳ {Number(order.total_paid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 16px', color: Number(order.total_due) > 0 ? '#ef4444' : '#64748b', fontWeight: 700 }}>
                          ৳ {Number(order.total_due || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            background: '#dcfce7',
                            color: '#15803d',
                            fontWeight: 700,
                            textTransform: 'capitalize',
                          }}>
                            {order.status || 'Approved'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', position: 'relative' }}>
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionOrderId(openActionOrderId === order.id ? null : order.id);
                              }}
                              style={{
                                background: '#f8fafc',
                                border: '1.5px solid #cbd5e1',
                                borderRadius: '6px',
                                padding: '4px 10px',
                                fontSize: '0.95rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                color: '#334155',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease',
                              }}
                              title="Purchase Order Actions"
                            >
                              ⋮
                            </button>

                            {openActionOrderId === order.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  position: 'absolute',
                                  right: 0,
                                  top: 'calc(100% + 4px)',
                                  background: '#ffffff',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '8px',
                                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
                                  zIndex: 100,
                                  minWidth: '150px',
                                  padding: '4px 0',
                                  textAlign: 'left',
                                  animation: 'fadeIn 0.15s ease',
                                }}
                              >
                                {/* 1. Print / Preview */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionOrderId(null);
                                    handleOpenPrintOrder(order.id);
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
                                  <span>🖨️</span> Print / Preview
                                </button>

                                {/* 2. Edit Order (72h rule) */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionOrderId(null);
                                    handleEditOrder(order);
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
                                    color: '#d97706',
                                    cursor: 'pointer',
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = '#fffbeb')}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                >
                                  <span>✏️</span> Edit Order
                                </button>

                                {/* 3. Delete Order (24h rule) */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionOrderId(null);
                                    handleDeleteOrder(order.id, order);
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
                                    color: '#dc2626',
                                    cursor: 'pointer',
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                >
                                  <span>🗑️</span> Delete Order
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PURCHASE QUOTATION LIST */}
      {activeTab === 'quotations' && (
        <div>
          {/* Stats Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '12px' }}>
            <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Quotation Volume
              </span>
              <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0 0', color: '#4f46e5', fontWeight: 800 }}>
                ৳ {totalQuotationAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Total Quotes
              </span>
              <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0 0', color: '#0f172a', fontWeight: 800 }}>
                {quotations.length}
              </h3>
            </div>
            <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Approved
              </span>
              <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0 0', color: '#16a34a', fontWeight: 800 }}>
                {quotations.filter((q) => q.status === 'approved').length}
              </h3>
            </div>
            <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Pending Review
              </span>
              <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0 0', color: '#d97706', fontWeight: 800 }}>
                {quotations.filter((q) => q.status === 'draft' || q.status === 'pending').length}
              </h3>
            </div>
          </div>

          {/* Search bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search quotation no, supplier..."
              style={{
                maxWidth: '300px',
                width: '100%',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                outline: 'none',
                background: '#ffffff',
              }}
            />
            <button
              onClick={loadAllData}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                color: '#475569',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              🔄 Refresh
            </button>
          </div>

          {/* Table */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading purchase quotations...</div>
            ) : filteredQuotations.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <p style={{ color: '#94a3b8', fontSize: '1.05rem', margin: 0 }}>No purchase quotations found</p>
                <button
                  onClick={() => setIsQuotationModalOpen(true)}
                  style={{
                    marginTop: '12px',
                    background: '#4f46e5',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  + Create First Quotation
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                      <th style={{ padding: '12px 16px' }}>Quotation #</th>
                      <th style={{ padding: '12px 16px' }}>Supplier</th>
                      <th style={{ padding: '12px 16px' }}>Reference</th>
                      <th style={{ padding: '12px 16px' }}>Quote Date</th>
                      <th style={{ padding: '12px 16px' }}>Valid Until</th>
                      <th style={{ padding: '12px 16px' }}>Items</th>
                      <th style={{ padding: '12px 16px' }}>Total Amount</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuotations.map((quote) => (
                      <tr key={quote.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#4f46e5' }}>
                          {quote.quotation_no}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#1e293b', fontWeight: 600 }}>
                          <div>{quote.supplier_name || `Supplier #${quote.supplier_id}`}</div>
                          {quote.supplier_phone && (
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{quote.supplier_phone}</div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#475569' }}>
                          {quote.reference || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.85rem' }}>
                          {quote.quotation_date ? new Date(quote.quotation_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.85rem' }}>
                          {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : 'Open'}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#475569' }}>
                          {quote.item_count || 0} Units
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                          ৳ {Number(quote.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <select
                            value={quote.status || 'draft'}
                            onChange={(e) => handleUpdateQuotationStatus(quote.id, e.target.value)}
                            style={{
                              ...getQuotationBadgeStyle(quote.status),
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              textTransform: 'capitalize',
                              cursor: 'pointer',
                              outline: 'none',
                            }}
                          >
                            <option value="draft">Draft</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="ordered">Ordered</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button
                            type="button"
                            onClick={() => handleEditQuotation(quote.id)}
                            style={{
                              background: '#fffbeb',
                              color: '#d97706',
                              border: '1px solid #fde68a',
                              borderRadius: '6px',
                              padding: '5px 10px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              marginRight: '6px',
                            }}
                            title="Edit this quotation"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuotation(quote.id)}
                            style={{
                              background: '#fef2f2',
                              color: '#b91c1c',
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              padding: '5px 10px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                            title="Delete this quotation"
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SUPPLIER LIST */}
      {activeTab === 'suppliers' && (
        <div>
          {/* Stats Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '12px' }}>
            <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Suppliers
              </span>
              <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0 0', color: '#059669', fontWeight: 800 }}>
                {suppliers.length}
              </h3>
            </div>
            <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Outstanding Due
              </span>
              <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0 0', color: totalSupplierDue > 0 ? '#ef4444' : '#16a34a', fontWeight: 800 }}>
                ৳ {totalSupplierDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Pending Balance
              </span>
              <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0 0', color: '#d97706', fontWeight: 800 }}>
                {suppliers.filter((s) => Number(s.payable_balance) > 0).length}
              </h3>
            </div>
          </div>

          {/* Search bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by supplier name, phone..."
              style={{
                maxWidth: '300px',
                width: '100%',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                outline: 'none',
                background: '#ffffff',
              }}
            />
            <button
              onClick={loadAllData}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                color: '#475569',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              🔄 Refresh
            </button>
          </div>

          {/* Table */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading suppliers...</div>
            ) : filteredSuppliers.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <p style={{ color: '#94a3b8', fontSize: '1.05rem', margin: 0 }}>No suppliers found</p>
                <button
                  onClick={() => setIsSupplierModalOpen(true)}
                  style={{
                    marginTop: '12px',
                    background: '#059669',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  + Add First Supplier
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                      <th style={{ padding: '12px 16px' }}>Supplier / Company</th>
                      <th style={{ padding: '12px 16px' }}>Contact Person</th>
                      <th style={{ padding: '12px 16px' }}>Phone / Mobile</th>
                      <th style={{ padding: '12px 16px' }}>Email</th>
                      <th style={{ padding: '12px 16px' }}>Address</th>
                      <th style={{ padding: '12px 16px' }}>Payable Due</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSuppliers.map((s) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setProfileModalPartyId(s.id);
                              setProfileModalTab('overview');
                            }}
                            style={{
                              border: 'none',
                              background: 'none',
                              padding: 0,
                              fontWeight: 700,
                              color: '#0f172a',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: '0.92rem'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#059669')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#0f172a')}
                          >
                            {s.name}
                          </button>
                          {s.contact_code && (
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Code: {s.contact_code}</div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#334155', fontWeight: 500 }}>
                          {s.contact_person || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#475569' }}>
                          <div>{s.phone || '—'}</div>
                          {s.mobile && s.mobile !== s.phone && (
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{s.mobile}</div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>
                          {s.email || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#64748b', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.address || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <strong style={{ fontWeight: 700, color: Number(s.payable_balance) > 0 ? '#ef4444' : '#16a34a' }}>
                            ৳ {Number(s.payable_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </strong>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {Number(s.payable_balance) > 0 ? 'Payable Due' : Number(s.payable_balance) < 0 ? 'Advance Given (Credit)' : 'Cleared'}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setProfileModalPartyId(s.id);
                                setProfileModalTab('overview');
                              }}
                              style={{
                                background: '#ecfdf5',
                                color: '#059669',
                                border: '1px solid #a7f3d0',
                                borderRadius: '6px',
                                padding: '5px 10px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                              title="View supplier profile & ledger"
                            >
                              <span>👤</span> Profile
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSupplier(s.id)}
                              style={{
                                background: '#fef2f2',
                                color: '#b91c1c',
                                border: '1px solid #fecaca',
                                borderRadius: '6px',
                                padding: '5px 10px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                              title="Delete this supplier"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* POPUP MODAL 1: New / Edit Purchase Order */}
      {isOrderModalOpen && (
        <PurchaseOrderModal
          products={products}
          suppliers={suppliers}
          orderToEdit={orderToEdit}
          newlyCreatedSupplier={newlyCreatedSupplier}
          onOpenAddSupplier={handleOpenAddSupplier}
          onOpenAddProduct={onOpenAddProduct}
          onClose={() => {
            setIsOrderModalOpen(false);
            setOrderToEdit(null);
          }}
          onSaved={() => {
            setIsOrderModalOpen(false);
            setOrderToEdit(null);
            loadAllData();
            showToast(orderToEdit ? 'Purchase order updated successfully' : 'Purchase order saved successfully');
          }}
        />
      )}

      {/* POPUP MODAL 2: New Purchase Quotation */}
      {isQuotationModalOpen && (
        <PurchaseQuotationModal
          isOpen={isQuotationModalOpen}
          products={products}
          suppliers={suppliers}
          newlyCreatedSupplier={newlyCreatedSupplier}
          onOpenAddSupplier={handleOpenAddSupplier}
          onOpenAddProduct={onOpenAddProduct}
          editingQuotation={editingQuotation}
          onClose={() => { setIsQuotationModalOpen(false); setEditingQuotation(null); }}
          onQuotationCreated={() => {
            setIsQuotationModalOpen(false);
            setEditingQuotation(null);
            loadAllData();
            showToast(editingQuotation ? 'Purchase quotation updated successfully' : 'Purchase quotation created successfully');
          }}
        />
      )}

      {/* POPUP MODAL 3: Add Supplier */}
      {isSupplierModalOpen && (
        <AddSupplierModal
          isOpen={isSupplierModalOpen}
          onClose={() => setIsSupplierModalOpen(false)}
          onSupplierCreated={handleSupplierCreated}
        />
      )}

      {/* POPUP MODAL 4: Print & Share Invoice */}
      <PurchasePrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        order={printOrder}
      />

      {/* POPUP MODAL 5: Supplier Profile Modal */}
      {profileModalPartyId && (
        <PartyProfileModal
          isOpen={Boolean(profileModalPartyId)}
          partyType="supplier"
          partyId={profileModalPartyId}
          initialTab={profileModalTab}
          onClose={() => setProfileModalPartyId(null)}
          onPartyUpdated={() => {
            loadAllData();
          }}
        />
      )}
    </div>
  );
}
