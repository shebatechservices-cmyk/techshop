import React, { useState, useEffect, useMemo } from 'react';
import API from '../../services/api';
import NewSaleModal from './NewSaleModal';
import SaleQuotationModal from './SaleQuotationModal';
import AddCustomerModal from './AddCustomerModal';
import SalePrintModal from './SalePrintModal';
import PartyProfileModal from '../../components/PartyProfileModal';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Sales({ initialTab = 'history', initialSearch = '', navKey = 0 }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'history'); // 'history' | 'quotations' | 'customers'

  // Data states
  const [sales, setSales] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [profileModalPartyId, setProfileModalPartyId] = useState(null);
  const [profileModalTab, setProfileModalTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  // Dedicated search & filter states for Invoices, Quotations, and Customers
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState(initialTab === 'history' ? initialSearch : '');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('ALL');

  const [quotationSearchQuery, setQuotationSearchQuery] = useState(initialTab === 'quotations' ? initialSearch : '');
  const [quotationStatusFilter, setQuotationStatusFilter] = useState('ALL');

  const [customerSearchQuery, setCustomerSearchQuery] = useState(initialTab === 'customers' ? initialSearch : '');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('ALL');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      if (initialTab === 'history') {
        setInvoiceSearchQuery(initialSearch || '');
        if (initialSearch) setInvoiceStatusFilter('ALL');
      } else if (initialTab === 'quotations') {
        setQuotationSearchQuery(initialSearch || '');
        if (initialSearch) setQuotationStatusFilter('ALL');
      } else if (initialTab === 'customers') {
        setCustomerSearchQuery(initialSearch || '');
        if (initialSearch) setCustomerTypeFilter('ALL');
      }
    }
  }, [initialTab, initialSearch, navKey]);

  const [notification, setNotification] = useState({ message: '', type: '' });

  // Modals state
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newlyCreatedCustomer, setNewlyCreatedCustomer] = useState(null);

  // Print state
  const [printData, setPrintData] = useState(null);
  const [isPrintQuotation, setIsPrintQuotation] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 4000);
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [salesRes, quoteRes, custRes, prodRes] = await Promise.all([
        fetch(`${API}/sales`).catch(() => null),
        fetch(`${API}/sales/quotations`).catch(() => null),
        fetch(`${API}/sales/customers`).catch(() => null),
        fetch(`${API}/master/products`).catch(() => null),
      ]);

      if (salesRes && salesRes.ok) {
        const json = await salesRes.json();
        setSales(Array.isArray(json) ? json : (json.data || []));
      }

      if (quoteRes && quoteRes.ok) {
        const json = await quoteRes.json();
        setQuotations(Array.isArray(json) ? json : (json.data || []));
      }

      if (custRes && custRes.ok) {
        const json = await custRes.json();
        setCustomers(Array.isArray(json) ? json : (json.data || []));
      }

      if (prodRes && prodRes.ok) {
        const json = await prodRes.json();
        setProducts(Array.isArray(json) ? json : (json.data || []));
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

  // Refresh the product catalog whenever the New Sale modal opens,
  // so freshly-added products are immediately searchable/scannable by barcode
  useEffect(() => {
    if (isSaleModalOpen || isQuotationModalOpen) {
      fetch(`${API}/master/products`)
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          const list = Array.isArray(json) ? json : (json && Array.isArray(json.data) ? json.data : null);
          if (list) setProducts(list);
        })
        .catch(() => {});
    }
  }, [isSaleModalOpen, isQuotationModalOpen]);

  // Customer created callback
  const handleCustomerCreated = (createdCustomer) => {
    setNewlyCreatedCustomer(createdCustomer);
    setIsCustomerModalOpen(false);
    loadAllData();
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

  // Open Edit Sale Form with full invoice details
  const handleEditSale = async (id) => {
    try {
      const res = await fetch(`${API}/sales/${id}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load sale invoice');
      setEditingSale(data.data);
      setIsSaleModalOpen(true);
    } catch (err) {
      showToast(`Could not open sale invoice for editing: ${err.message}`);
    }
  };

  // Quotation created callback
  const handleQuotationCreated = (newQuote) => {
    setIsQuotationModalOpen(false);
    setEditingQuotation(null);
    loadAllData();
    showToast(`Quotation #${newQuote.quotation_no || newQuote.id} ${editingQuotation ? 'updated' : 'generated'} successfully!`);
    if (newQuote && (newQuote.items || newQuote.id)) {
      handleOpenPrintQuotation(newQuote.id || newQuote);
    }
  };

  // Open Edit for Quotation
  const handleEditQuotation = async (quoteOrId) => {
    const quoteId = typeof quoteOrId === 'object' ? (quoteOrId.id || quoteOrId.quotation_id) : quoteOrId;
    try {
      const res = await fetch(`${API}/sales/quotations/${quoteId}`);
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

  // Open Print for Sale
  const handleOpenPrintSale = async (saleOrId) => {
    if (typeof saleOrId === 'object' && saleOrId !== null && Array.isArray(saleOrId.items)) {
      setPrintData(saleOrId);
      setIsPrintQuotation(false);
      setIsPrintOpen(true);
      return;
    }

    const saleId = typeof saleOrId === 'object' ? saleOrId.id : saleOrId;
    try {
      const res = await fetch(`${API}/sales/${saleId}`);
      if (res.ok) {
        const json = await res.json();
        setPrintData(json.data || json);
        setIsPrintQuotation(false);
        setIsPrintOpen(true);
      } else {
        showToast('Failed to load invoice details for printing', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error fetching invoice details', 'error');
    }
  };

  // Open Print for Quotation
  const handleOpenPrintQuotation = async (quoteOrId) => {
    if (typeof quoteOrId === 'object' && quoteOrId !== null && Array.isArray(quoteOrId.items)) {
      setPrintData(quoteOrId);
      setIsPrintQuotation(true);
      setIsPrintOpen(true);
      return;
    }

    const quoteId = typeof quoteOrId === 'object' ? quoteOrId.id : quoteOrId;
    try {
      const res = await fetch(`${API}/sales/quotations/${quoteId}`);
      if (res.ok) {
        const json = await res.json();
        setPrintData(json.data || json);
        setIsPrintQuotation(true);
        setIsPrintOpen(true);
      } else {
        showToast('Failed to load quotation details for printing', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error fetching quotation details', 'error');
    }
  };

  // Delete Sale
  const handleDeleteSale = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sale invoice record?')) return;
    try {
      const res = await fetch(`${API}/sales/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        window.dispatchEvent(new CustomEvent('inventory_stock_changed'));
        window.dispatchEvent(new CustomEvent('data_changed'));
        loadAllData();
        showToast('Sale invoice record deleted successfully');
      } else {
        showToast(data.message || 'Failed to delete sale invoice', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Server error deleting sale record', 'error');
    }
  };

  // Delete Quotation
  const handleDeleteQuotation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this quotation?')) return;
    try {
      const res = await fetch(`${API}/sales/quotations/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        window.dispatchEvent(new CustomEvent('data_changed'));
        loadAllData();
        showToast('Quotation deleted successfully');
      } else {
        showToast(data.message || 'Failed to delete quotation', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Server error deleting quotation', 'error');
    }
  };

  // Update Quotation Status
  const handleUpdateQuotationStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`${API}/sales/quotations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setQuotations((prev) =>
          prev.map((q) => (q.id === id ? { ...q, status: newStatus } : q))
        );
        showToast(`Quotation marked as "${newStatus}"`);
      } else {
        showToast(data.message || 'Failed to update quotation status', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Server error updating quotation status', 'error');
    }
  };

  // Delete Customer
  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer? This will not delete past invoices.')) return;
    try {
      const res = await fetch(`${API}/sales/customers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        window.dispatchEvent(new CustomEvent('data_changed'));
        loadAllData();
        showToast('Customer deleted successfully');
      } else {
        showToast(data.message || 'Cannot delete customer', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Server error deleting customer', 'error');
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
setNewlyCreatedCustomer(cust);
    setEditingSale(null);
    setActiveTab('history');
    setIsSaleModalOpen(true);
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

  // Filtered Quotations
  const filteredQuotations = useMemo(() => {
    const q = quotationSearchQuery.trim().toLowerCase();
    return quotations.filter((qt) => {
      const matchesSearch =
        !q ||
        (qt.quotation_no && qt.quotation_no.toLowerCase().includes(q)) ||
        (qt.customer_name && qt.customer_name.toLowerCase().includes(q)) ||
        (qt.customer_phone && qt.customer_phone.toLowerCase().includes(q)) ||
        (qt.customer_address && qt.customer_address.toLowerCase().includes(q)) ||
        (qt.notes && qt.notes.toLowerCase().includes(q)) ||
        (qt.status && qt.status.toLowerCase().includes(q)) ||
        (qt.total_amount && String(qt.total_amount).includes(q)) ||
        (qt.id && String(qt.id) === q);

      const matchesStatus =
        quotationStatusFilter === 'ALL' ||
        (qt.status && qt.status.toLowerCase() === quotationStatusFilter.toLowerCase());

      return matchesSearch && matchesStatus;
    });
  }, [quotations, quotationSearchQuery, quotationStatusFilter]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = customerSearchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q));

      const typeRaw = (c.customer_type || 'Regular').toLowerCase();
      const normGroup = typeRaw.includes('tech') ? 'technician' : (typeRaw.includes('resell') || typeRaw === 'wholesale' || typeRaw === 'corporate') ? 'reseller' : 'regular';

      const matchesType =
        customerTypeFilter === 'ALL' ||
        normGroup === customerTypeFilter.toLowerCase() ||
        typeRaw === customerTypeFilter.toLowerCase();

      return matchesSearch && matchesType;
    });
  }, [customers, customerSearchQuery, customerTypeFilter]);

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

  const totalQuotationValue = useMemo(() => {
    return quotations.reduce((sum, q) => sum + money(q.total_amount), 0);
  }, [quotations]);

  const totalCustomerReceivables = useMemo(() => {
    return customers.reduce((sum, c) => sum + money(c.receivable_balance), 0);
  }, [customers]);

  const totalLoyaltyPoints = useMemo(() => {
    return customers.reduce((sum, c) => sum + Number(c.loyalty_points || 0), 0);
  }, [customers]);

  const getQuotationBadgeStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return { background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' };
      case 'sent':
        return { background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' };
      case 'rejected':
        return { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' };
      case 'expired':
        return { background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' };
      case 'draft':
      default:
        return { background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' };
    }
  };

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

      {/* Unified Compact Header & Tab Bar (Single Row) */}
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
        {/* Left: Compact Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.25rem' }}>🏷️</span>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
              Sales & Customers
            </h2>
            <span style={{ color: '#64748b', fontSize: '0.74rem' }}>
              POS sales, quotations, and receivables
            </span>
          </div>
        </div>

        {/* Center: Integrated Tab Navigation Pills */}
        <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
          {/* Tab 1: Sales History */}
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            style={{
              padding: '6px 12px',
              background: activeTab === 'history' ? '#ffffff' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: activeTab === 'history' ? '#16a34a' : '#64748b',
              fontWeight: activeTab === 'history' ? 700 : 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: activeTab === 'history' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <span>Invoices</span>
            <span style={{
              background: activeTab === 'history' ? '#dcfce7' : '#e2e8f0',
              color: activeTab === 'history' ? '#16a34a' : '#64748b',
              padding: '1px 6px',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 700,
            }}>
              {invoiceSearchQuery || invoiceStatusFilter !== 'ALL'
                ? `${filteredSales.length}/${sales.length}`
                : sales.length}
            </span>
          </button>

          {/* Tab 2: Quotations */}
          <button
            type="button"
            onClick={() => setActiveTab('quotations')}
            style={{
              padding: '6px 12px',
              background: activeTab === 'quotations' ? '#ffffff' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: activeTab === 'quotations' ? '#4f46e5' : '#64748b',
              fontWeight: activeTab === 'quotations' ? 700 : 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: activeTab === 'quotations' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <span>Quotations</span>
            <span style={{
              background: activeTab === 'quotations' ? '#ede9fe' : '#e2e8f0',
              color: activeTab === 'quotations' ? '#4f46e5' : '#64748b',
              padding: '1px 6px',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 700,
            }}>
              {quotationSearchQuery || quotationStatusFilter !== 'ALL'
                ? `${filteredQuotations.length}/${quotations.length}`
                : quotations.length}
            </span>
          </button>

          {/* Tab 3: Customers */}
          <button
            type="button"
            onClick={() => setActiveTab('customers')}
            style={{
              padding: '6px 12px',
              background: activeTab === 'customers' ? '#ffffff' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: activeTab === 'customers' ? '#0284c7' : '#64748b',
              fontWeight: activeTab === 'customers' ? 700 : 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: activeTab === 'customers' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <span>Customers</span>
            <span style={{
              background: activeTab === 'customers' ? '#e0f2fe' : '#e2e8f0',
              color: activeTab === 'customers' ? '#0284c7' : '#64748b',
              padding: '1px 6px',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 700,
            }}>
              {customerSearchQuery ? `${filteredCustomers.length}/${customers.length}` : customers.length}
            </span>
          </button>
        </div>

        {/* Right: 3 Compact Action Buttons */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => {
              setActiveTab('history');
              setEditingSale(null);
              setIsSaleModalOpen(true);
            }}
            style={{
              background: '#16a34a',
              color: '#ffffff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '7px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)',
            }}
          >
            <span>+</span> New Sale
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
              padding: '6px 12px',
              borderRadius: '7px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)',
            }}
          >
            <span>+</span> Quotation
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('customers');
              setIsCustomerModalOpen(true);
            }}
            style={{
              background: '#ffffff',
              color: '#0284c7',
              border: '1px solid #0284c7',
              padding: '5px 10px',
              borderRadius: '7px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>+</span> Customer
          </button>
        </div>
      </div>

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

      {activeTab === 'quotations' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '14px' }}>
          <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Quotations</span>
            <h3 style={{ fontSize: '1.25rem', margin: '4px 0 0 0', color: '#4f46e5', fontWeight: 800 }}>{quotations.length}</h3>
          </div>
          <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Quoted Value</span>
            <h3 style={{ fontSize: '1.25rem', margin: '4px 0 0 0', color: '#0f172a', fontWeight: 800 }}>{taka(totalQuotationValue)}</h3>
          </div>
          <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Accepted Quotes</span>
            <h3 style={{ fontSize: '1.25rem', margin: '4px 0 0 0', color: '#16a34a', fontWeight: 800 }}>
              {quotations.filter((q) => q.status === 'accepted').length}
            </h3>
          </div>
        </div>
      )}

      {activeTab === 'customers' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '14px' }}>
          <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Registered Customers</span>
            <h3 style={{ fontSize: '1.25rem', margin: '4px 0 0 0', color: '#0284c7', fontWeight: 800 }}>{customers.length}</h3>
          </div>
          <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Outstanding Receivables</span>
            <h3 style={{ fontSize: '1.25rem', margin: '4px 0 0 0', color: totalCustomerReceivables > 0 ? '#ef4444' : '#10b981', fontWeight: 800 }}>
              {taka(totalCustomerReceivables)}
            </h3>
          </div>
          <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Loyalty Points Distributed</span>
            <h3 style={{ fontSize: '1.25rem', margin: '4px 0 0 0', color: '#d97706', fontWeight: 800 }}>{totalLoyaltyPoints.toLocaleString()} pts</h3>
          </div>
        </div>
      )}

      {/* Main Card Container */}
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
                          {sale.invoice_no || `INV-${sale.id}`}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{sale.customer_name || 'Walk-in Customer'}</div>
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
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenPrintSale(sale.id)}
                              style={{
                                background: '#f0fdf4',
                                color: '#15803d',
                                border: '1px solid #bbf7d0',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                              title="Print invoice / receipt"
                            >
                              <span>🖨️</span> Print
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditSale(sale.id)}
                              title={sale.created_at && (Date.now() - new Date(sale.created_at).getTime()) / (3600000) <= 72 ? 'Edit invoice (72-hour edit window)' : 'Edit window closed — invoices only editable within 72 hours of creation'}
                              style={{
                                background: '#eff6ff',
                                color: '#1d4ed8',
                                border: '1px solid #bfdbfe',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: sale.created_at && (Date.now() - new Date(sale.created_at).getTime()) / (3600000) <= 72 ? 'pointer' : 'not-allowed',
                                opacity: sale.created_at && (Date.now() - new Date(sale.created_at).getTime()) / (3600000) <= 72 ? 1 : 0.4,
                              }}
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSale(sale.id)}
                              style={{
                                background: '#fef2f2',
                                color: '#b91c1c',
                                border: '1px solid #fecaca',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                              title="Delete sale invoice"
                            >
                              🗑️
                            </button>
                          </div>
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

        {/* TAB 2: QUOTATION HISTORY */}
        {activeTab === 'quotations' && (
          <div>
            {/* Dedicated Quotation Search & Filter Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '440px' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.95rem' }}>🔍</span>
                  <input
                    type="text"
                    value={quotationSearchQuery}
                    onChange={(e) => setQuotationSearchQuery(e.target.value)}
                    placeholder="Search quotations by quotation #, client name, phone, notes..."
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
                  {quotationSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setQuotationSearchQuery('')}
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
                      title="Clear quotation search"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Quick Quotation Status Filter */}
                <select
                  value={quotationStatusFilter}
                  onChange={(e) => setQuotationStatusFilter(e.target.value)}
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
                  <option value="ALL">All Statuses</option>
                  <option value="sent">Sent</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="expired">Expired</option>
                  <option value="draft">Draft</option>
                </select>

                {/* Counter Badge */}
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#4f46e5',
                  background: '#ede9fe',
                  border: '1px solid #ddd6fe',
                  padding: '6px 12px',
                  borderRadius: '999px',
                }}>
                  Showing {filteredQuotations.length} of {quotations.length} Quotations
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={loadAllData}
                  title="Refresh Quotations"
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
                <p style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Loading quotation records...</p>
              ) : filteredQuotations.length === 0 ? (
                quotationSearchQuery || quotationStatusFilter !== 'ALL' ? (
                  <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
                    <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                      No quotations match your search "{quotationSearchQuery || quotationStatusFilter}"
                    </p>
                    <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '16px' }}>
                      Try searching with another quotation number, client name, or phone number.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setQuotationSearchQuery('');
                        setQuotationStatusFilter('ALL');
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
                    <p style={{ fontSize: '1.2rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>No quotation records found</p>
                    <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>Generate professional price estimates and quotation proposals for clients.</p>
                    <button
                      type="button"
                      onClick={() => setIsQuotationModalOpen(true)}
                      style={{
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
                )
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.03em' }}>
                    <th style={{ padding: '12px 14px' }}>Quotation No</th>
                    <th style={{ padding: '12px 14px' }}>Client / Customer</th>
                    <th style={{ padding: '12px 14px' }}>Status</th>
                    <th style={{ padding: '12px 14px' }}>Total Amount</th>
                    <th style={{ padding: '12px 14px' }}>Valid Until</th>
                    <th style={{ padding: '12px 14px' }}>Created Date</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotations.map((quote) => {
                    const badge = getQuotationBadgeStyle(quote.status);
                    return (
                      <tr key={quote.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#4f46e5' }}>
                          {quote.quotation_no || `QTN-${quote.id}`}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{quote.customer_name || 'Client'}</div>
                          {quote.customer_phone && <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{quote.customer_phone}</div>}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <select
                            value={quote.status || 'sent'}
                            onChange={(e) => handleUpdateQuotationStatus(quote.id, e.target.value)}
                            style={{
                              ...badge,
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              cursor: 'pointer',
                              outline: 'none',
                            }}
                          >
                            <option value="draft">Draft</option>
                            <option value="sent">Sent</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                            <option value="expired">Expired</option>
                          </select>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>
                          {taka(quote.total_amount)}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '0.82rem' }}>
                          {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '7 Days'}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '0.82rem' }}>
                          {quote.created_at ? new Date(quote.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenPrintQuotation(quote.id)}
                              style={{
                                background: '#f5f3ff',
                                color: '#6d28d9',
                                border: '1px solid #ddd6fe',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                              title="Print / View Quotation"
                            >
                              <span>🖨️</span> Print
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditQuotation(quote.id)}
                              style={{
                                background: '#fffbeb',
                                color: '#d97706',
                                border: '1px solid #fde68a',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                              title="Edit quotation"
                            >
                              <span>✏️</span> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteQuotation(quote.id)}
                              style={{
                                background: '#fef2f2',
                                color: '#b91c1c',
                                border: '1px solid #fecaca',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                              title="Delete quotation"
                            >
                              🗑️
                            </button>
                          </div>
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

        {/* TAB 3: CUSTOMER LIST */}
        {activeTab === 'customers' && (
          <div>
            {/* Dedicated Customer Search & Filter Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '440px' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.95rem' }}>🔍</span>
                  <input
                    type="text"
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    placeholder="Search customers by name, phone, email, address..."
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
                  {customerSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCustomerSearchQuery('')}
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
                      title="Clear customer search"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Quick Customer Type Filter */}
                <select
                  value={customerTypeFilter}
                  onChange={(e) => setCustomerTypeFilter(e.target.value)}
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
                  <option value="ALL">All Customer Groups</option>
                  <option value="regular">👤 Regular (সাধারণ)</option>
                  <option value="technician">🔧 Technician (টেকনিশিয়ান - 5% Discount)</option>
                  <option value="reseller">🏪 Reseller (রিসেলার)</option>
                </select>

                {/* Counter Badge */}
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#0284c7',
                  background: '#e0f2fe',
                  border: '1px solid #bae6fd',
                  padding: '6px 12px',
                  borderRadius: '999px',
                }}>
                  Showing {filteredCustomers.length} of {customers.length} Customers
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={loadAllData}
                  title="Refresh Customers"
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
                <p style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Loading customer list...</p>
              ) : filteredCustomers.length === 0 ? (
                customerSearchQuery || customerTypeFilter !== 'ALL' ? (
                  <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
                    <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                      No customers match your search "{customerSearchQuery || customerTypeFilter}"
                    </p>
                    <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '16px' }}>
                      Try searching with another name, phone number, email, or address.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerSearchQuery('');
                        setCustomerTypeFilter('ALL');
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
                    <p style={{ fontSize: '1.2rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>No customers found</p>
                    <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>Add your retail, wholesale, or corporate clients to track their sales and loyalty points.</p>
                    <button
                      type="button"
                      onClick={() => setIsCustomerModalOpen(true)}
                      style={{
                        background: '#0284c7',
                        color: '#fff',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      + Add First Customer
                    </button>
                  </div>
                )
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.03em' }}>
                    <th style={{ padding: '12px 14px' }}>Customer Name</th>
                    <th style={{ padding: '12px 14px' }}>Type</th>
                    <th style={{ padding: '12px 14px' }}>Contact Info</th>
                    <th style={{ padding: '12px 14px' }}>Address</th>
                    <th style={{ padding: '12px 14px' }}>Loyalty Points</th>
                    <th style={{ padding: '12px 14px' }}>Receivable Due</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((cust) => {
                    const due = money(cust.receivable_balance);
                    return (
                      <tr key={cust.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: '#e0f2fe',
                                color: '#0369a1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                              }}
                            >
                              {cust.name ? cust.name.charAt(0).toUpperCase() : 'C'}
                            </div>
                            <div>
                              <button
                                type="button"
                                onClick={() => {
                                  setProfileModalPartyId(cust.id);
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
                                  fontSize: '0.9rem'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = '#0284c7')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = '#0f172a')}
                              >
                                {cust.name}
                              </button>
                              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>ID: #{cust.id}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              background:
                                cust.customer_type?.toLowerCase().includes('tech')
                                  ? '#e0e7ff'
                                  : cust.customer_type?.toLowerCase().includes('resell') || cust.customer_type === 'wholesale' || cust.customer_type === 'corporate'
                                  ? '#fef3c7'
                                  : '#f1f5f9',
                              color:
                                cust.customer_type?.toLowerCase().includes('tech')
                                  ? '#3730a3'
                                  : cust.customer_type?.toLowerCase().includes('resell') || cust.customer_type === 'wholesale' || cust.customer_type === 'corporate'
                                  ? '#92400e'
                                  : '#475569',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            {cust.customer_type?.toLowerCase().includes('tech')
                              ? '🔧 Technician'
                              : cust.customer_type?.toLowerCase().includes('resell') || cust.customer_type === 'wholesale' || cust.customer_type === 'corporate'
                              ? '🏪 Reseller'
                              : '👤 Regular'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{cust.phone}</div>
                          {cust.email && <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{cust.email}</div>}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#475569', fontSize: '0.82rem', maxWidth: '200px' }}>
                          {cust.address || '-'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ color: '#d97706', fontWeight: 700, fontSize: '0.85rem' }}>
                            ★ {Number(cust.loyalty_points || 0).toLocaleString()} pts
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontWeight: 700, color: due > 0 ? '#ef4444' : '#16a34a' }}>
                            {taka(due)}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleStartSaleForCustomer(cust)}
                              style={{
                                background: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0',
                                borderRadius: '6px',
                                padding: '5px 8px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                              title="Create sale for this customer"
                            >
                              <span>🛒</span> Sale
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartQuoteForCustomer(cust)}
                              style={{
                                background: '#eef2ff',
                                color: '#4338ca',
                                border: '1px solid #c7d2fe',
                                borderRadius: '6px',
                                padding: '5px 8px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                              title="Create quotation for this customer"
                            >
                              <span>📄</span> Quote
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setProfileModalPartyId(cust.id);
                                setProfileModalTab('overview');
                              }}
                              style={{
                                background: '#f0f9ff',
                                color: '#0284c7',
                                border: '1px solid #bae6fd',
                                borderRadius: '6px',
                                padding: '5px 8px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                              title="View customer profile & ledger"
                            >
                              <span>👤</span> Profile
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomer(cust.id)}
                              style={{
                                background: '#fef2f2',
                                color: '#b91c1c',
                                border: '1px solid #fecaca',
                                borderRadius: '6px',
                                padding: '5px 8px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                              title="Delete customer"
                            >
                              🗑️
                            </button>
                          </div>
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

      {/* 1. New Sale Modal */}
      {isSaleModalOpen && (
        <NewSaleModal
          isOpen={isSaleModalOpen}
          onClose={() => {
            setIsSaleModalOpen(false);
            setEditingSale(null);
          }}
          customers={customers}
          products={products}
          newlyCreatedCustomer={newlyCreatedCustomer}
          onOpenAddCustomer={() => setIsCustomerModalOpen(true)}
          onSaleCreated={handleSaleCreated}
          editSale={editingSale}
          onSaleUpdated={handleSaleUpdated}
        />
      )}

      {/* 2. Sale Quotation Modal */}
      {isQuotationModalOpen && (
        <SaleQuotationModal
          isOpen={isQuotationModalOpen}
          onClose={() => { setIsQuotationModalOpen(false); setEditingQuotation(null); }}
          customers={customers}
          products={products}
          newlyCreatedCustomer={newlyCreatedCustomer}
          onOpenAddCustomer={() => setIsCustomerModalOpen(true)}
          onQuotationCreated={handleQuotationCreated}
          editingQuotation={editingQuotation}
        />
      )}

      {/* 3. Add Customer Modal */}
      {isCustomerModalOpen && (
        <AddCustomerModal
          isOpen={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
          onCustomerCreated={handleCustomerCreated}
        />
      )}

      {/* 4. Sale / Quotation Printable Sheet Modal */}
      {isPrintOpen && printData && (
        <SalePrintModal
          isOpen={isPrintOpen}
          onClose={() => {
            setIsPrintOpen(false);
            setPrintData(null);
          }}
          sale={printData}
          isQuotation={isPrintQuotation}
        />
      )}

      {/* 5. Customer Profile Modal */}
      {profileModalPartyId && (
        <PartyProfileModal
          isOpen={Boolean(profileModalPartyId)}
          partyType="customer"
          partyId={profileModalPartyId}
          initialTab={profileModalTab}
          onClose={() => setProfileModalPartyId(null)}
          onPartyUpdated={() => {
            fetch(`${API}/sales/customers`).then((r) => r.json()).then((d) => setCustomers(d || [])).catch(() => {});
          }}
        />
      )}
    </div>
  );
}
