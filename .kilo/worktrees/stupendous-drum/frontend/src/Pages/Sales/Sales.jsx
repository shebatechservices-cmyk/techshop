import React, { useState, useEffect, useMemo } from 'react';
import API from '../../services/api';
import NewSaleModal from './modals/NewSaleModal';
import SalePrintModal from './modals/SalePrintModal';
import SaleExchangeModal from './modals/SaleExchangeModal';
import SalesLayout from './SalesLayout';
import CustomerList from './CustomerList';
import SalesQuotations from './SalesQuotations';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Sales({ initialTab = 'history', initialSearch = '', navKey = 0, currentUser }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'history'); // 'history' | 'quotations' | 'customers'

  const authUser = currentUser || (() => {
    try {
      const saved = localStorage.getItem('sheba_auth_user') || sessionStorage.getItem('sheba_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const isAdmin = Boolean(
    !authUser ||
    Number(authUser.role_id) === 1 ||
    Number(authUser.role_id) === 2 ||
    ['admin', 'super admin', 'owner', 'manager'].some((r) =>
      String(authUser.role_name || authUser.role_title || authUser.role || '').toLowerCase().includes(r)
    )
  );

  const [actionLoading, setActionLoading] = useState({});

  const [shopSettings, setShopSettings] = useState({
    allow_invoice_modification: true,
    invoice_edit_time_limit_hours: 360,
    security_pin: '1234'
  });

  const [overrideModal, setOverrideModal] = useState({
    isOpen: false,
    actionType: null, // 'edit' | 'delete'
    sale: null,
    enteredPin: '',
    error: '',
    lockReason: ''
  });

  // Data states
  const [sales, setSales] = useState([]);
  const [quotationsCount, setQuotationsCount] = useState(0);
  const [customersCount, setCustomersCount] = useState(0);
  const [modalCustomers, setModalCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  // Dedicated search & filter states for Invoices
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState(initialTab === 'history' ? initialSearch : '');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('ALL');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      if (initialTab === 'history') {
        setInvoiceSearchQuery(initialSearch || '');
        if (initialSearch) setInvoiceStatusFilter('ALL');
      }
    }
  }, [initialTab, initialSearch, navKey]);

  const [notification, setNotification] = useState({ message: '', type: '' });

  // Modals state
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [newlyCreatedCustomer, setNewlyCreatedCustomer] = useState(null);
  const [exchangeSaleId, setExchangeSaleId] = useState(null);

  // Print state
  const [printData, setPrintData] = useState(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 4000);
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [salesRes, quoteRes, prodRes, settingsRes] = await Promise.all([
        fetch(`${API}/sales`).catch(() => null),
        fetch(`${API}/sales/quotations`).catch(() => null),
        fetch(`${API}/master/products`).catch(() => null),
        fetch(`${API}/settings`).catch(() => null),
      ]);

      if (salesRes && salesRes.ok) {
        const json = await salesRes.json();
        setSales(Array.isArray(json) ? json : (json.data || []));
      }

      if (quoteRes && quoteRes.ok) {
        const json = await quoteRes.json();
        const list = Array.isArray(json) ? json : (json.data || []);
        setQuotationsCount(list.length);
      }

      // Sync customer count for SalesLayout header badges
      fetch(`${API}/sales/customers`)
        .then((r) => r.json())
        .then((d) => setCustomersCount(Array.isArray(d) ? d.length : (d?.data?.length || 0)))
        .catch(() => {});

      if (prodRes && prodRes.ok) {
        const json = await prodRes.json();
        setProducts(Array.isArray(json) ? json : (json.data || []));
      }

      if (settingsRes && settingsRes.ok) {
        const json = await settingsRes.json();
        if (json?.data) {
          setShopSettings({
            allow_invoice_modification: json.data.allow_invoice_modification !== false,
            invoice_edit_time_limit_hours: json.data.invoice_edit_time_limit_hours ?? 360,
            security_pin: json.data.security_pin || '1234'
          });
        }
      }
    } catch (err) {
      console.error('Failed to load sales and customer data:', err);
      showToast('Error loading data from server', 'error');
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

  // Refresh the product catalog and customer list whenever the New Sale modal opens,
  // so freshly-added items are immediately searchable
  useEffect(() => {
    if (isSaleModalOpen) {
      fetch(`${API}/master/products`)
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          const list = Array.isArray(json) ? json : (json && Array.isArray(json.data) ? json.data : null);
          if (list) setProducts(list);
        })
        .catch(() => {});

      fetch(`${API}/sales/customers`)
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          const list = Array.isArray(json) ? json : (json && Array.isArray(json.data) ? json.data : null);
          if (list) setModalCustomers(list);
        })
        .catch(() => {});
    }
  }, [isSaleModalOpen]);

  // Customer created callback
  const handleCustomerCreated = (createdCustomer) => {
    setNewlyCreatedCustomer(createdCustomer);
    setCustomersCount((c) => c + 1);
    setModalCustomers((prev) => [createdCustomer, ...prev]);
    showToast(`Customer "${createdCustomer.name}" registered successfully!`);
  };

  // Sale created callback
  const handleSaleCreated = (newSale) => {
    setIsSaleModalOpen(false);
    setEditingSale(null);
    loadAllData();
    showToast(`Sale Invoice #${newSale.invoice_no || newSale.id} created successfully!`);
    if (newSale && (newSale.items || newSale.id)) {
      handleOpenPrintSale(newSale.id || newSale);
    }
  };

  // Edit Sale callback
  const handleSaleUpdated = (updatedSale) => {
    setIsSaleModalOpen(false);
    setEditingSale(null);
    loadAllData();
    showToast(`Sale Invoice #${updatedSale.invoice_no || updatedSale.id} updated successfully!`);
    if (updatedSale && (updatedSale.items || updatedSale.id)) {
      handleOpenPrintSale(updatedSale.id || updatedSale);
    }
  };

  // Helper to determine lock status for a sale record based on policy rules
  const getSaleLockStatus = (sale) => {
    const hoursOld = sale?.created_at ? (Date.now() - new Date(sale.created_at).getTime()) / (1000 * 60 * 60) : 0;
    const allowMod = shopSettings.allow_invoice_modification !== false;
    const editLimitHours = shopSettings.invoice_edit_time_limit_hours ?? 360;
    const isShiftClosed = Boolean(sale?.is_shift_closed);

    // Edit lock
    let isEditLocked = false;
    let editLockReason = '';
    if (!allowMod) {
      isEditLocked = true;
      editLockReason = 'Invoice modification is disabled by administrative policy.';
    } else if (isShiftClosed) {
      isEditLocked = true;
      editLockReason = 'Register shift is closed and locked.';
    } else if (hoursOld > editLimitHours) {
      isEditLocked = true;
      editLockReason = `Edit window closed — invoices are only editable within ${Math.floor(editLimitHours / 24)} days (${editLimitHours} hours).`;
    }

    // Delete lock
    let isDeleteLocked = false;
    let deleteLockReason = '';
    if (!allowMod) {
      isDeleteLocked = true;
      deleteLockReason = 'Invoice deletion is disabled by administrative policy.';
    } else if (isShiftClosed) {
      isDeleteLocked = true;
      deleteLockReason = 'Register shift is closed and locked.';
    } else if (hoursOld > 168) { // 7 days
      isDeleteLocked = true;
      deleteLockReason = 'Delete window (7 days) has expired.';
    }

    return {
      hoursOld,
      isShiftClosed,
      isEditLocked,
      editLockReason,
      isDeleteLocked,
      deleteLockReason,
    };
  };

  // Open Edit Sale Form with full invoice details
  const executeEditSale = async (id, adminPin = null) => {
    try {
      setActionLoading(prev => ({ ...prev, [id]: 'edit' }));
      const res = await fetch(`${API}/sales/${id}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load sale invoice');
      const saleData = data.data;
      if (adminPin) {
        saleData.admin_pin = adminPin;
      }
      setEditingSale(saleData);
      setIsSaleModalOpen(true);
    } catch (err) {
      showToast(`Could not open sale invoice for editing: ${err.message}`, 'error');
    } finally {
      setActionLoading(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleInitiateEditSale = (id, saleObj) => {
    const lockStatus = getSaleLockStatus(saleObj);
    if (lockStatus.isEditLocked) {
      if (!isAdmin) {
        showToast(lockStatus.editLockReason, 'error');
        return;
      }
      // If Admin, prompt for Admin Security PIN override
      setOverrideModal({
        isOpen: true,
        actionType: 'edit',
        sale: saleObj,
        enteredPin: '',
        error: '',
        lockReason: lockStatus.editLockReason
      });
      return;
    }
    executeEditSale(id);
  };

  // Open Print for Sale
  const handleOpenPrintSale = async (saleOrId) => {
    const saleId = typeof saleOrId === 'object' ? (saleOrId?.id || saleOrId?.invoice_id) : saleOrId;
    if (typeof saleOrId === 'object' && saleOrId !== null && Array.isArray(saleOrId.items) && saleOrId.items.length > 0) {
      setPrintData(saleOrId);
      setIsPrintOpen(true);
      return;
    }

    try {
      if (saleId) {
        setActionLoading((prev) => ({ ...prev, [saleId]: 'print' }));
      }
      const res = await fetch(`${API}/sales/${saleId}`);
      if (res.ok) {
        const json = await res.json();
        setPrintData(json.data || json);
        setIsPrintOpen(true);
      } else {
        const json = await res.json().catch(() => ({}));
        showToast(json.message || 'Failed to load invoice details for printing', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error fetching invoice details', 'error');
    } finally {
      if (saleId) {
        setActionLoading((prev) => {
          const next = { ...prev };
          delete next[saleId];
          return next;
        });
      }
    }
  };

  // Delete Sale with optional Admin PIN override
  const executeDeleteSale = async (id, saleObj, adminPin = null) => {
    if (!adminPin && !window.confirm(`Are you sure you want to delete sale invoice #${saleObj?.invoice_no || id}? This will restore product stock and reverse ledger entries.`)) return;
    try {
      setActionLoading((prev) => ({ ...prev, [id]: 'delete' }));
      const res = await fetch(`${API}/sales/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(adminPin ? { 'x-admin-pin': adminPin } : {})
        },
        body: JSON.stringify({ admin_pin: adminPin })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        window.dispatchEvent(new CustomEvent('inventory_stock_changed'));
        window.dispatchEvent(new CustomEvent('data_changed'));
        loadAllData();
        showToast(data.message || `Sale invoice #${saleObj?.invoice_no || id} deleted successfully!`);
      } else {
        showToast(data.message || 'Failed to delete sale invoice', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Server error deleting sale record', 'error');
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleInitiateDeleteSale = (id, saleObj) => {
    const lockStatus = getSaleLockStatus(saleObj);
    if (lockStatus.isDeleteLocked) {
      if (!isAdmin) {
        showToast(lockStatus.deleteLockReason, 'error');
        return;
      }
      // If Admin, prompt for Admin Security PIN override
      setOverrideModal({
        isOpen: true,
        actionType: 'delete',
        sale: saleObj,
        enteredPin: '',
        error: '',
        lockReason: lockStatus.deleteLockReason
      });
      return;
    }
    executeDeleteSale(id, saleObj);
  };

  const handleConfirmOverride = () => {
    const entered = String(overrideModal.enteredPin || '').trim();
    if (!entered) {
      setOverrideModal(prev => ({ ...prev, error: 'Please enter the Admin Security PIN.' }));
      return;
    }
    const configuredPin = String(shopSettings.security_pin || '1234').trim();
    if (configuredPin && entered !== configuredPin) {
      setOverrideModal(prev => ({ ...prev, error: 'Invalid Admin Security PIN. Please try again.' }));
      return;
    }

    const { actionType, sale } = overrideModal;
    setOverrideModal({ isOpen: false, actionType: null, sale: null, enteredPin: '', error: '', lockReason: '' });

    if (actionType === 'edit') {
      executeEditSale(sale.id, entered);
    } else if (actionType === 'delete') {
      executeDeleteSale(sale.id, sale, entered);
    }
  };

  // Quick Action: New Sale for a specific customer
  const handleStartSaleForCustomer = (cust) => {
    setNewlyCreatedCustomer(cust);
    setEditingSale(null);
    setActiveTab('history');
    setIsSaleModalOpen(true);
  };

  // Quick Action: New Quote for a specific customer
  const handleStartQuoteForCustomer = (cust) => {
    setActiveTab('quotations');
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('sales:open_modal', { detail: { type: 'quotation', customer: cust } })
      );
    }, 50);
  };

  // Filtered Sales (Invoices)
  const filteredSales = useMemo(() => {
    const q = invoiceSearchQuery.trim().toLowerCase();
    return sales.filter((s) => {
      const matchesSearch =
        !q ||
        (s.invoice_no && s.invoice_no.toLowerCase().includes(q)) ||
        (s.customer_name && s.customer_name.toLowerCase().includes(q)) ||
        (s.customer_phone && s.customer_phone.toLowerCase().includes(q)) ||
        (s.customer_email && s.customer_email.toLowerCase().includes(q)) ||
        (s.sales_person && s.sales_person.toLowerCase().includes(q)) ||
        (s.destination && s.destination.toLowerCase().includes(q)) ||
        (s.attention && s.attention.toLowerCase().includes(q)) ||
        (s.notes && s.notes.toLowerCase().includes(q)) ||
        (s.payment_status && s.payment_status.toLowerCase().includes(q)) ||
        (s.total_amount && String(s.total_amount).includes(q)) ||
        (s.id && String(s.id) === q);

      const matchesStatus =
        invoiceStatusFilter === 'ALL' ||
        (invoiceStatusFilter === 'PAID' && (s.payment_status === 'paid' || money(s.due_amount) <= 0)) ||
        (invoiceStatusFilter === 'PARTIAL' && s.payment_status === 'partial') ||
        (invoiceStatusFilter === 'DUE' && (s.payment_status === 'due' || (money(s.due_amount) > 0 && money(s.paid_amount) === 0)));

      return matchesSearch && matchesStatus;
    });
  }, [sales, invoiceSearchQuery, invoiceStatusFilter]);

  // Metrics Calculations
  const totalSalesVolume = useMemo(() => {
    return sales.reduce((sum, s) => sum + money(s.total_amount || s.grand_total), 0);
  }, [sales]);

  const totalCollectedAmount = useMemo(() => {
    return sales.reduce((sum, s) => sum + money(s.paid_amount), 0);
  }, [sales]);

  const totalSalesDue = useMemo(() => {
    return sales.reduce((sum, s) => sum + money(s.due_amount), 0);
  }, [sales]);

  const getPaymentBadgeStyle = (status, due) => {
    if (money(due) <= 0 || status === 'paid') {
      return { background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', label: 'Paid' };
    }
    if (status === 'partial' || (money(due) > 0 && status !== 'due')) {
      return { background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', label: 'Partial' };
    }
    return { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', label: 'Due' };
  };

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'inherit' }}>
      {/* Toast Notification */}
      {notification.message && (
        <div
          style={{
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
          }}
        >
          <span>{notification.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Extracted Header & Tab Bar (SalesLayout) */}
      <SalesLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        salesCount={sales.length}
        filteredSalesCount={filteredSales.length}
        hasSaleFilter={Boolean(invoiceSearchQuery || invoiceStatusFilter !== 'ALL')}
        quotationsCount={quotationsCount}
        filteredQuotationsCount={quotationsCount}
        hasQuotationFilter={false}
        customersCount={customersCount}
        filteredCustomersCount={customersCount}
        hasCustomerFilter={false}
        onNewSale={() => {
          setActiveTab('history');
          setEditingSale(null);
          setIsSaleModalOpen(true);
        }}
        onNewQuotation={() => {
          setActiveTab('quotations');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('sales:open_modal', { detail: 'quotation' }));
          }, 50);
        }}
        onNewCustomer={() => {
          setActiveTab('customers');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('sales:open_modal', { detail: 'customer' }));
          }, 50);
        }}
      />

      {/* KPI Metrics Cards (Compact) */}
      {activeTab === 'history' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '14px' }}>
          <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Sales Volume</span>
            <h3 style={{ fontSize: '1.25rem', margin: '4px 0 0 0', color: '#16a34a', fontWeight: 800 }}>{taka(totalSalesVolume)}</h3>
          </div>
          <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Invoices</span>
            <h3 style={{ fontSize: '1.25rem', margin: '4px 0 0 0', color: '#0f172a', fontWeight: 800 }}>{sales.length}</h3>
          </div>
          <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Collected (Paid)</span>
            <h3 style={{ fontSize: '1.25rem', margin: '4px 0 0 0', color: '#0284c7', fontWeight: 800 }}>{taka(totalCollectedAmount)}</h3>
          </div>
          <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Outstanding Due</span>
            <h3 style={{ fontSize: '1.25rem', margin: '4px 0 0 0', color: totalSalesDue > 0 ? '#ef4444' : '#10b981', fontWeight: 800 }}>{taka(totalSalesDue)}</h3>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'customers' ? (
        <CustomerList
          initialSearch={initialTab === 'customers' ? initialSearch : ''}
          onStartSale={handleStartSaleForCustomer}
          onStartQuote={handleStartQuoteForCustomer}
          onCustomersLoaded={(list) => setCustomersCount(list.length)}
          onCustomerCreated={handleCustomerCreated}
        />
      ) : activeTab === 'quotations' ? (
        <SalesQuotations
          initialSearch={initialTab === 'quotations' ? initialSearch : ''}
          onQuotationsLoaded={(list) => setQuotationsCount(list.length)}
        />
      ) : (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {/* TAB 1: SALES HISTORY (INVOICES) */}
        {activeTab === 'history' && (
          <div>
            {/* Dedicated Invoice Search & Filter Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '440px' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.95rem' }}>🔍</span>
                  <input
                    type="text"
                    value={invoiceSearchQuery}
                    onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                    placeholder="Search invoices by invoice #, customer, phone, salesperson..."
                    style={{
                      width: '100%',
                      padding: '10px 36px 10px 38px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      background: '#ffffff',
                    }}
                  />
                  {invoiceSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setInvoiceSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94a3b8',
                        fontSize: '0.9rem',
                      }}
                      title="Clear invoice search"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Quick Payment Status Filter */}
                <select
                  value={invoiceStatusFilter}
                  onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                  style={{
                    padding: '9.5px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.88rem',
                    background: '#fff',
                    cursor: 'pointer',
                    color: '#334155',
                    fontWeight: 500,
                  }}
                >
                  <option value="ALL">All Payment Status</option>
                  <option value="PAID">Paid Only</option>
                  <option value="PARTIAL">Partial Only</option>
                  <option value="DUE">Due Only</option>
                </select>

                {/* Match Counter Badge */}
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#15803d',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  padding: '6px 12px',
                  borderRadius: '999px',
                }}>
                  Showing {filteredSales.length} of {sales.length} Invoices
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={loadAllData}
                  title="Refresh Invoices"
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    padding: '9px 15px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#475569',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>🔄</span> Refresh
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              {loading ? (
                <p style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Loading sales records...</p>
              ) : filteredSales.length === 0 ? (
                invoiceSearchQuery || invoiceStatusFilter !== 'ALL' ? (
                  <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
                    <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                      No sales invoices match your search "{invoiceSearchQuery || invoiceStatusFilter}"
                    </p>
                    <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '16px' }}>
                      Try searching with another invoice number, customer name, phone number, or salesperson.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setInvoiceSearchQuery('');
                        setInvoiceStatusFilter('ALL');
                      }}
                      style={{
                        background: '#f1f5f9',
                        color: '#334155',
                        border: '1px solid #cbd5e1',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Clear Search & Filter
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8' }}>
                    <p style={{ fontSize: '1.2rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>No sales records found</p>
                    <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>Start by creating a new sales transaction from the top button.</p>
                    <button
                      type="button"
                      onClick={() => {
              setEditingSale(null);
              setIsSaleModalOpen(true);
            }}
                      style={{
                        background: '#16a34a',
                        color: '#fff',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      + Create First Sale
                    </button>
                  </div>
                )
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.03em' }}>
                    <th style={{ padding: '12px 14px' }}>Invoice No</th>
                    <th style={{ padding: '12px 14px' }}>Customer</th>
                    <th style={{ padding: '12px 14px' }}>Payment Status</th>
                    <th style={{ padding: '12px 14px' }}>Grand Total</th>
                    <th style={{ padding: '12px 14px' }}>Paid</th>
                    <th style={{ padding: '12px 14px' }}>Due</th>
                    <th style={{ padding: '12px 14px' }}>Date</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale) => {
                    const badge = getPaymentBadgeStyle(sale.payment_status, sale.due_amount);
                    return (
                      <tr key={sale.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0284c7' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenPrintSale(sale.id)}
                            title="Click to view & print invoice"
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              font: 'inherit',
                              fontWeight: 700,
                              color: '#0284c7',
                              cursor: 'pointer',
                              textAlign: 'left',
                              textDecoration: 'underline',
                              textUnderlineOffset: '2px',
                            }}
                          >
                            {sale.invoice_no || `INV-${sale.id}`}
                          </button>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {sale.customer_id ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('customers');
                                setTimeout(() => {
                                  window.dispatchEvent(
                                    new CustomEvent('sales:open_customer_profile', {
                                      detail: { customerId: sale.customer_id, tab: 'overview' },
                                    })
                                  );
                                }, 50);
                              }}
                              title="Click to view customer profile & history"
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                font: 'inherit',
                                fontWeight: 600,
                                color: '#1e293b',
                                cursor: 'pointer',
                                textAlign: 'left',
                                textDecoration: 'underline',
                                textUnderlineOffset: '2px',
                              }}
                            >
                              {sale.customer_name || 'Walk-in Customer'}
                            </button>
                          ) : (
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{sale.customer_name || 'Walk-in Customer'}</div>
                          )}
                          {sale.customer_phone && <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{sale.customer_phone}</div>}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              ...badge,
                              padding: '3px 9px',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              display: 'inline-block',
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>
                          {taka(sale.total_amount || sale.grand_total)}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#16a34a' }}>
                          {taka(sale.paid_amount || 0)}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: money(sale.due_amount) > 0 ? '#ef4444' : '#64748b' }}>
                          {taka(sale.due_amount || 0)}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '0.82rem' }}>
                          {sale.created_at ? new Date(sale.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          {(() => {
                            const isPrinting = actionLoading[sale.id] === 'print';
                            const isEditing = actionLoading[sale.id] === 'edit';
                            const isDeleting = actionLoading[sale.id] === 'delete';
                            const anyLoading = isPrinting || isEditing || isDeleting;
                            const lock = getSaleLockStatus(sale);

                            return (
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                                {/* Print Button */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenPrintSale(sale.id)}
                                  disabled={anyLoading}
                                  style={{
                                    background: '#f0fdf4',
                                    color: '#15803d',
                                    border: '1px solid #bbf7d0',
                                    borderRadius: '6px',
                                    padding: '6px 10px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    cursor: anyLoading ? 'not-allowed' : 'pointer',
                                    opacity: anyLoading && !isPrinting ? 0.6 : 1,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                  title="Print invoice / receipt"
                                >
                                  {isPrinting ? (
                                    <>
                                      <span style={{ display: 'inline-block', width: '10px', height: '10px', border: '2px solid #15803d', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                      <span>Loading...</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>🖨️</span> Print
                                    </>
                                  )}
                                </button>

                                {/* Exchange Button */}
                                <button
                                  type="button"
                                  onClick={() => setExchangeSaleId(sale.id)}
                                  disabled={anyLoading}
                                  style={{
                                    background: '#faf5ff',
                                    color: '#7c3aed',
                                    border: '1px solid #e9d5ff',
                                    borderRadius: '6px',
                                    padding: '6px 10px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    cursor: anyLoading ? 'not-allowed' : 'pointer',
                                    opacity: anyLoading ? 0.6 : 1,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                  title="Exchange products on this invoice"
                                >
                                  <span>🔄</span> Exchange
                                </button>

                                {/* Edit Button */}
                                <button
                                  type="button"
                                  onClick={() => handleInitiateEditSale(sale.id, sale)}
                                  disabled={anyLoading}
                                  title={
                                    lock.isEditLocked
                                      ? (isAdmin ? `Locked (${lock.editLockReason}) — Admin Override Available` : `Locked: ${lock.editLockReason}`)
                                      : 'Edit invoice'
                                  }
                                  style={{
                                    background: lock.isEditLocked ? '#fef3c7' : '#eff6ff',
                                    color: lock.isEditLocked ? '#92400e' : '#1d4ed8',
                                    border: `1px solid ${lock.isEditLocked ? '#fcd34d' : '#bfdbfe'}`,
                                    borderRadius: '6px',
                                    padding: '6px 10px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    cursor: anyLoading ? 'not-allowed' : 'pointer',
                                    opacity: anyLoading && !isEditing ? 0.6 : 1,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  {isEditing ? (
                                    <>
                                      <span style={{ display: 'inline-block', width: '10px', height: '10px', border: '2px solid #1d4ed8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                      <span>Loading...</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>{lock.isEditLocked ? '🔒' : '✏️'}</span> Edit
                                    </>
                                  )}
                                </button>

                                {/* Delete Button */}
                                <button
                                  type="button"
                                  onClick={() => handleInitiateDeleteSale(sale.id, sale)}
                                  disabled={anyLoading}
                                  title={
                                    lock.isDeleteLocked
                                      ? (isAdmin ? `Locked (${lock.deleteLockReason}) — Admin Override Available` : `Locked: ${lock.deleteLockReason}`)
                                      : 'Delete sale invoice'
                                  }
                                  style={{
                                    background: lock.isDeleteLocked ? '#fee2e2' : '#fef2f2',
                                    color: lock.isDeleteLocked ? '#991b1b' : '#b91c1c',
                                    border: `1px solid ${lock.isDeleteLocked ? '#f87171' : '#fecaca'}`,
                                    borderRadius: '6px',
                                    padding: '6px 10px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    cursor: anyLoading ? 'not-allowed' : 'pointer',
                                    opacity: anyLoading && !isDeleting ? 0.6 : 1,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  {isDeleting ? (
                                    <>
                                      <span style={{ display: 'inline-block', width: '10px', height: '10px', border: '2px solid #b91c1c', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                      <span>Deleting...</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>{lock.isDeleteLocked ? '🔒' : '🗑️'}</span> Delete
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
        )}

      </div>
      )}

      {/* 1. New Sale Modal */}
      {isSaleModalOpen && (
        <NewSaleModal
          isOpen={isSaleModalOpen}
          onClose={() => {
            setIsSaleModalOpen(false);
            setEditingSale(null);
          }}
          customers={modalCustomers}
          products={products}
          newlyCreatedCustomer={newlyCreatedCustomer}
          onOpenAddCustomer={() => {
            setActiveTab("customers");
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent("sales:open_modal", { detail: "customer" }));
            }, 50);
          }}
          onSaleCreated={handleSaleCreated}
          editSale={editingSale}
          onSaleUpdated={handleSaleUpdated}
        />
      )}

      {/* 3. Sale / Quotation Printable Sheet Modal */}
      {isPrintOpen && printData && (
        <SalePrintModal
          isOpen={isPrintOpen}
          onClose={() => {
            setIsPrintOpen(false);
            setPrintData(null);
          }}
          sale={printData}
          isQuotation={false}
        />
      )}

      {/* 6. Sale Exchange Modal */}
      {exchangeSaleId && (
        <SaleExchangeModal
          isOpen={Boolean(exchangeSaleId)}
          onClose={() => setExchangeSaleId(null)}
          saleId={exchangeSaleId}
          products={products}
          onExchangeComplete={(newExc) => {
            loadAllData();
            showToast(`Exchange completed! Invoice #${newExc.invoice_no || newExc.id}`);
            if (newExc) {
              handleOpenPrintSale(newExc.id || newExc);
            }
          }}
        />
      )}

      {/* 7. Admin Security PIN Override Modal */}
      {overrideModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setOverrideModal({ isOpen: false, actionType: null, sale: null, enteredPin: '', error: '', lockReason: '' });
            }
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '460px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                background: overrideModal.actionType === 'delete'
                  ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
                  : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.4rem' }}>🔐</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                    Admin Security PIN Override
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', opacity: 0.9 }}>
                    Authorization required for locked record {overrideModal.actionType === 'delete' ? 'deletion' : 'modification'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOverrideModal({ isOpen: false, actionType: null, sale: null, enteredPin: '', error: '', lockReason: '' })}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '1.2rem',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {/* Lock notice alert */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  fontSize: '0.85rem',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}
              >
                <span>⚠️</span>
                <div>
                  <strong>Lock Rule Enforced:</strong>
                  <div style={{ marginTop: '2px' }}>{overrideModal.lockReason}</div>
                </div>
              </div>

              {/* Invoice details summary */}
              <div
                style={{
                  padding: '12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  color: '#475569',
                  marginBottom: '20px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px'
                }}
              >
                <div>
                  <span style={{ color: '#64748b' }}>Invoice: </span>
                  <strong>#{overrideModal.sale?.invoice_no || overrideModal.sale?.id}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Total: </span>
                  <strong style={{ color: '#0f172a' }}>{taka(overrideModal.sale?.total_amount)}</strong>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: '#64748b' }}>Customer: </span>
                  <strong>{overrideModal.sale?.customer_name || 'Walk-in Customer'}</strong>
                </div>
              </div>

              {/* PIN input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                  Enter Admin Security PIN
                </label>
                <input
                  type="password"
                  maxLength={10}
                  autoFocus
                  value={overrideModal.enteredPin}
                  onChange={(e) => setOverrideModal(prev => ({ ...prev, enteredPin: e.target.value, error: '' }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmOverride();
                  }}
                  placeholder="••••"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '1.25rem',
                    letterSpacing: '0.25em',
                    textAlign: 'center',
                    border: overrideModal.error ? '2px solid #ef4444' : '1px solid #cbd5e1',
                    borderRadius: '8px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                {overrideModal.error && (
                  <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '6px', marginBottom: 0, fontWeight: 500 }}>
                    {overrideModal.error}
                  </p>
                )}
                <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '6px', marginBottom: 0 }}>
                  Security PIN is configured in Settings &gt; Session &amp; Security.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '16px 24px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}
            >
              <button
                type="button"
                onClick={() => setOverrideModal({ isOpen: false, actionType: null, sale: null, enteredPin: '', error: '', lockReason: '' })}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmOverride}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: overrideModal.actionType === 'delete' ? '#ef4444' : '#2563eb',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {overrideModal.actionType === 'delete' ? 'Authorize & Delete' : 'Authorize & Edit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
