import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../../../services/api';

export default function usePurchaseManager({ initialTab = 'history', initialSearch = '', navKey = 0 } = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const getActiveTab = () => {
    if (pathname.endsWith('/quotations') || pathname.includes('/quotations')) return 'quotations';
    if (pathname.endsWith('/suppliers') || pathname.includes('/suppliers')) return 'suppliers';
    return 'history';
  };
  const activeTab = getActiveTab();

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
    if (initialTab && initialTab !== activeTab && initialTab !== 'history') {
      navigate(`/${initialTab}`);
    }
    if (initialSearch !== undefined) {
      setSearchQuery(initialSearch || '');
    }
  }, [initialTab, navKey]);

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
  const [deleteBlockedDialog, setDeleteBlockedDialog] = useState({
    isOpen: false,
    poNumber: '',
    message: '',
    linkedInvoices: [],
  });

  // Click outside to close action dropdowns
  useEffect(() => {
    const handleDocClick = () => setOpenActionOrderId(null);
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 4000);
  };

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

  const handleOpenAddSupplier = () => {
    navigate('suppliers');
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
    window.addEventListener('account_balance_changed', refresh);
    window.addEventListener('cash_drawer_changed', refresh);
    window.addEventListener('wallet_balance_changed', refresh);
    return () => {
      window.removeEventListener('inventory_stock_changed', refresh);
      window.removeEventListener('data_changed', refresh);
      window.removeEventListener('account_balance_changed', refresh);
      window.removeEventListener('cash_drawer_changed', refresh);
      window.removeEventListener('wallet_balance_changed', refresh);
    };
  }, []);

  // Edit Order: Permitted within 15 days (360 hours)
  const handleEditOrder = async (order) => {
    const createdAt = new Date(order.created_at || Date.now());
    const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursOld > 360) {
      showToast(
        `⚠️ Editing expired: PO #${order.po_number || order.id} was created ${Math.floor(hoursOld / 24)} days ago. Edits are only permitted within 15 days (360h).`,
        'error'
      );
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

  // Delete Order: Permitted within 7 days (168 hours), blocked if sold or subsequent order exists
  const handleDeleteOrder = async (id, order) => {
    const createdAt = new Date(order?.created_at || Date.now());
    const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursOld > 168) {
      showToast('Delete window (7 days) has expired. Please use the Return/Exchange module instead.', 'error');
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
        const errorMsg = data.error || data.message || 'Failed to delete purchase order';
        if (data.linked_invoices && data.linked_invoices.length > 0) {
          setDeleteBlockedDialog({
            isOpen: true,
            poNumber: order?.po_number || id,
            message: errorMsg,
            linkedInvoices: data.linked_invoices,
          });
        }
        showToast(errorMsg, 'error');
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

  return {
    // Tab & Navigation
    activeTab,
    navigate,

    // Core Data
    orders,
    setOrders,
    quotations,
    setQuotations,
    suppliers,
    setSuppliers,
    products,
    setProducts,
    loading,
    searchQuery,
    setSearchQuery,
    notification,
    showToast,

    // Modal States
    isOrderModalOpen,
    setIsOrderModalOpen,
    orderToEdit,
    setOrderToEdit,
    openActionOrderId,
    setOpenActionOrderId,
    isQuotationModalOpen,
    setIsQuotationModalOpen,
    editingQuotation,
    setEditingQuotation,
    isSupplierModalOpen,
    setIsSupplierModalOpen,
    newlyCreatedSupplier,
    setNewlyCreatedSupplier,
    printOrder,
    setPrintOrder,
    isPrintOpen,
    setIsPrintOpen,
    profileModalPartyId,
    setProfileModalPartyId,
    profileModalTab,
    setProfileModalTab,
    deleteBlockedDialog,
    setDeleteBlockedDialog,

    // Handlers & APIs
    loadAllData,
    handleOpenPrintOrder,
    handleOpenAddSupplier,
    handleSupplierCreated,
    handleEditOrder,
    handleDeleteOrder,
    handleDeleteQuotation,
    handleEditQuotation,
    handleUpdateQuotationStatus,
    handleDeleteSupplier,

    // Filtered lists & totals
    filteredOrders,
    filteredQuotations,
    filteredSuppliers,
    totalPurchasesCost,
    totalPurchasesPaid,
    totalPurchasesDue,
    totalQuotationAmount,
    totalSupplierDue,
    getQuotationBadgeStyle,
  };
}
