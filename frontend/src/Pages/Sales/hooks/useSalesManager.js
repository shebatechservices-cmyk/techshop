import { useState, useEffect, useMemo } from 'react';
import API from '../../../services/api';

export const money = (val) => Number.parseFloat(val || 0) || 0;
export const taka = (val) =>
  `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function useSalesManager({
  initialTab = 'history',
  initialSearch = '',
  navKey = 0,
  currentUser,
} = {}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'history');

  const authUser =
    currentUser ||
    (() => {
      try {
        const saved =
          localStorage.getItem('sheba_auth_user') || sessionStorage.getItem('sheba_auth_user');
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
        String(authUser.role_name || authUser.role_title || authUser.role || '')
          .toLowerCase()
          .includes(r)
      )
  );

  const [actionLoading, setActionLoading] = useState({});

  const [shopSettings, setShopSettings] = useState({
    allow_invoice_modification: true,
    invoice_edit_time_limit_hours: 360,
    security_pin: '1234',
  });

  const [overrideModal, setOverrideModal] = useState({
    isOpen: false,
    actionType: null, // 'edit' | 'delete'
    sale: null,
    enteredPin: '',
    error: '',
    lockReason: '',
  });

  // Data states
  const [sales, setSales] = useState([]);
  const [quotationsCount, setQuotationsCount] = useState(0);
  const [customersCount, setCustomersCount] = useState(0);
  const [modalCustomers, setModalCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState(
    initialTab === 'history' ? initialSearch : ''
  );
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
        setSales(Array.isArray(json) ? json : json.data || []);
      }

      if (quoteRes && quoteRes.ok) {
        const json = await quoteRes.json();
        const list = Array.isArray(json) ? json : json.data || [];
        setQuotationsCount(list.length);
      }

      // Sync customer count for SalesLayout header badges
      fetch(`${API}/sales/customers`)
        .then((r) => r.json())
        .then((d) => setCustomersCount(Array.isArray(d) ? d.length : d?.data?.length || 0))
        .catch(() => {});

      if (prodRes && prodRes.ok) {
        const json = await prodRes.json();
        setProducts(Array.isArray(json) ? json : json.data || []);
      }

      if (settingsRes && settingsRes.ok) {
        const json = await settingsRes.json();
        if (json?.data) {
          setShopSettings({
            allow_invoice_modification: json.data.allow_invoice_modification !== false,
            invoice_edit_time_limit_hours: json.data.invoice_edit_time_limit_hours ?? 360,
            security_pin: json.data.security_pin || '1234',
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

  // Refresh the product catalog and customer list whenever the New Sale modal opens
  useEffect(() => {
    if (isSaleModalOpen) {
      fetch(`${API}/master/products`)
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          const list = Array.isArray(json)
            ? json
            : json && Array.isArray(json.data)
            ? json.data
            : null;
          if (list) setProducts(list);
        })
        .catch(() => {});

      fetch(`${API}/sales/customers`)
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          const list = Array.isArray(json)
            ? json
            : json && Array.isArray(json.data)
            ? json.data
            : null;
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

  // Open Print for Sale
  const handleOpenPrintSale = async (saleOrId) => {
    const saleId =
      typeof saleOrId === 'object' ? saleOrId?.id || saleOrId?.invoice_id : saleOrId;
    if (
      typeof saleOrId === 'object' &&
      saleOrId !== null &&
      Array.isArray(saleOrId.items) &&
      saleOrId.items.length > 0
    ) {
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
    const hoursOld = sale?.created_at
      ? (Date.now() - new Date(sale.created_at).getTime()) / (1000 * 60 * 60)
      : 0;
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
      editLockReason = `Edit window closed — invoices are only editable within ${Math.floor(
        editLimitHours / 24
      )} days (${editLimitHours} hours).`;
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
    } else if (hoursOld > 168) {
      // 7 days
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
      setActionLoading((prev) => ({ ...prev, [id]: 'edit' }));
      const res = await fetch(`${API}/sales/${id}`);
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || 'Failed to load sale invoice');
      const saleData = data.data;
      if (adminPin) {
        saleData.admin_pin = adminPin;
      }
      setEditingSale(saleData);
      setIsSaleModalOpen(true);
    } catch (err) {
      showToast(`Could not open sale invoice for editing: ${err.message}`, 'error');
    } finally {
      setActionLoading((prev) => {
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
        lockReason: lockStatus.editLockReason,
      });
      return;
    }
    executeEditSale(id);
  };

  // Delete Sale with optional Admin PIN override
  const executeDeleteSale = async (id, saleObj, adminPin = null) => {
    if (
      !adminPin &&
      !window.confirm(
        `Are you sure you want to delete sale invoice #${
          saleObj?.invoice_no || id
        }? This will restore product stock and reverse ledger entries.`
      )
    )
      return;
    try {
      setActionLoading((prev) => ({ ...prev, [id]: 'delete' }));
      const res = await fetch(`${API}/sales/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(adminPin ? { 'x-admin-pin': adminPin } : {}),
        },
        body: JSON.stringify({ admin_pin: adminPin }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        window.dispatchEvent(new CustomEvent('inventory_stock_changed'));
        window.dispatchEvent(new CustomEvent('data_changed'));
        loadAllData();
        showToast(
          data.message || `Sale invoice #${saleObj?.invoice_no || id} deleted successfully!`
        );
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
        lockReason: lockStatus.deleteLockReason,
      });
      return;
    }
    executeDeleteSale(id, saleObj);
  };

  const handleConfirmOverride = () => {
    const entered = String(overrideModal.enteredPin || '').trim();
    if (!entered) {
      setOverrideModal((prev) => ({ ...prev, error: 'Please enter the Admin Security PIN.' }));
      return;
    }
    const configuredPin = String(shopSettings.security_pin || '1234').trim();
    if (configuredPin && entered !== configuredPin) {
      setOverrideModal((prev) => ({
        ...prev,
        error: 'Invalid Admin Security PIN. Please try again.',
      }));
      return;
    }

    const { actionType, sale } = overrideModal;
    setOverrideModal({
      isOpen: false,
      actionType: null,
      sale: null,
      enteredPin: '',
      error: '',
      lockReason: '',
    });

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
        (invoiceStatusFilter === 'PAID' &&
          (s.payment_status === 'paid' || money(s.due_amount) <= 0)) ||
        (invoiceStatusFilter === 'PARTIAL' && s.payment_status === 'partial') ||
        (invoiceStatusFilter === 'DUE' &&
          (s.payment_status === 'due' ||
            (money(s.due_amount) > 0 && money(s.paid_amount) === 0)));

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
      return {
        className: 'bg-green-100 text-green-700 border border-green-200',
        label: 'Paid',
      };
    }
    if (status === 'partial' || (money(due) > 0 && status !== 'due')) {
      return {
        className: 'bg-amber-100 text-amber-700 border border-amber-200',
        label: 'Partial',
      };
    }
    return {
      className: 'bg-red-100 text-red-700 border border-red-200',
      label: 'Due',
    };
  };

  return {
    activeTab,
    setActiveTab,
    isAdmin,
    actionLoading,
    shopSettings,
    overrideModal,
    setOverrideModal,
    sales,
    setSales,
    quotationsCount,
    setQuotationsCount,
    customersCount,
    setCustomersCount,
    modalCustomers,
    products,
    loading,
    invoiceSearchQuery,
    setInvoiceSearchQuery,
    invoiceStatusFilter,
    setInvoiceStatusFilter,
    notification,
    showToast,
    isSaleModalOpen,
    setIsSaleModalOpen,
    editingSale,
    setEditingSale,
    newlyCreatedCustomer,
    exchangeSaleId,
    setExchangeSaleId,
    printData,
    setPrintData,
    isPrintOpen,
    setIsPrintOpen,
    loadAllData,
    handleCustomerCreated,
    handleSaleCreated,
    handleSaleUpdated,
    getSaleLockStatus,
    executeEditSale,
    handleInitiateEditSale,
    handleOpenPrintSale,
    executeDeleteSale,
    handleInitiateDeleteSale,
    handleConfirmOverride,
    handleStartSaleForCustomer,
    handleStartQuoteForCustomer,
    filteredSales,
    totalSalesVolume,
    totalCollectedAmount,
    totalSalesDue,
    getPaymentBadgeStyle,
    money,
    taka,
  };
}
