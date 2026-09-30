import { useState, useEffect, useMemo, useCallback } from 'react';
import API from '../../../services/api';

const money = (val) => Number.parseFloat(val || 0) || 0;

export function useSalesQuotations({
  initialSearch = '',
  onQuotationsLoaded
} = {}) {
  // 1. Data States
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quotationSearchQuery, setQuotationSearchQuery] = useState(initialSearch || '');
  const [quotationStatusFilter, setQuotationStatusFilter] = useState('ALL');

  // Customer & Product catalogs for quotation modal creation
  const [modalCustomers, setModalCustomers] = useState([]);
  const [modalProducts, setModalProducts] = useState([]);
  const [newlyCreatedCustomer, setNewlyCreatedCustomer] = useState(null);

  // 2. Modal States
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [printData, setPrintData] = useState(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // 3. Notification Toast State
  const [notification, setNotification] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: 'success' }), 4000);
  };

  // 4. Fetch Quotations Logic
  const fetchQuotations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/sales/quotations`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data?.data || []);
        setQuotations(list);
        if (onQuotationsLoaded) {
          onQuotationsLoaded(list);
        }
      }
    } catch (err) {
      console.error('Failed to load quotations:', err);
    } finally {
      setLoading(false);
    }
  }, [onQuotationsLoaded]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  // Synchronize on data change events
  useEffect(() => {
    const handleDataChanged = () => fetchQuotations();
    window.addEventListener('data_changed', handleDataChanged);
    return () => window.removeEventListener('data_changed', handleDataChanged);
  }, [fetchQuotations]);

  // Lazy-load customers and products when Quotation modal opens
  useEffect(() => {
    if (isQuotationModalOpen) {
      fetch(`${API}/sales/customers`)
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          const list = Array.isArray(json) ? json : (json?.data || []);
          setModalCustomers(list);
        })
        .catch(() => {});

      fetch(`${API}/master/products`)
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          const list = Array.isArray(json) ? json : (json?.data || []);
          setModalProducts(list);
        })
        .catch(() => {});
    }
  }, [isQuotationModalOpen]);

  // Global event listener for opening modals (e.g. from SalesLayout header or CustomerList)
  useEffect(() => {
    const handleOpenModal = (e) => {
      const detail = e.detail;
      const type = typeof detail === 'string' ? detail : detail?.type;
      if (type === 'quotation' || type === 'new_quotation') {
        if (detail?.customer) {
          setNewlyCreatedCustomer(detail.customer);
        } else {
          setNewlyCreatedCustomer(null);
        }
        setEditingQuotation(null);
        setIsQuotationModalOpen(true);
      }
    };

    window.addEventListener('sales:open_modal', handleOpenModal);
    return () => window.removeEventListener('sales:open_modal', handleOpenModal);
  }, []);

  // 5. Quotation Actions
  // Delete Quotation
  const handleDeleteQuotation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this quotation?')) return;
    try {
      const res = await fetch(`${API}/sales/quotations/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        window.dispatchEvent(new CustomEvent('data_changed'));
        fetchQuotations();
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

  // Edit Quotation
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

  // Open Print for Quotation
  const handleOpenPrintQuotation = async (quoteOrId) => {
    if (typeof quoteOrId === 'object' && quoteOrId !== null && Array.isArray(quoteOrId.items)) {
      setPrintData(quoteOrId);
      setIsPrintOpen(true);
      return;
    }

    const quoteId = typeof quoteOrId === 'object' ? quoteOrId.id : quoteOrId;
    try {
      const res = await fetch(`${API}/sales/quotations/${quoteId}`);
      if (res.ok) {
        const json = await res.json();
        setPrintData(json.data || json);
        setIsPrintOpen(true);
      } else {
        showToast('Failed to load quotation details for printing', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error fetching quotation details', 'error');
    }
  };

  // Callback when quotation is saved or updated
  const handleQuotationCreated = (newQuote) => {
    setIsQuotationModalOpen(false);
    const wasEditing = Boolean(editingQuotation);
    setEditingQuotation(null);
    fetchQuotations();
    showToast(`Quotation #${newQuote.quotation_no || newQuote.id} ${wasEditing ? 'updated' : 'generated'} successfully!`);
    if (newQuote && (newQuote.items || newQuote.id)) {
      handleOpenPrintQuotation(newQuote.id || newQuote);
    }
  };

  // 6. Metrics Calculations
  const totalQuotationValue = useMemo(() => {
    return quotations.reduce((sum, q) => sum + money(q.total_amount), 0);
  }, [quotations]);

  const acceptedQuotationsCount = useMemo(() => {
    return quotations.filter((q) => q.status === 'accepted').length;
  }, [quotations]);

  // 7. Filtered Quotations Memo
  const filteredQuotations = useMemo(() => {
    const q = quotationSearchQuery.trim().toLowerCase();
    return quotations.filter((qt) => {
      const matchesSearch =
        !q ||
        (qt.quotation_no && qt.quotation_no.toLowerCase().includes(q)) ||
        (qt.customer_name && qt.customer_name.toLowerCase().includes(q)) ||
        (qt.customer_phone && qt.customer_phone.includes(q)) ||
        (qt.notes && qt.notes.toLowerCase().includes(q));

      const matchesStatus =
        quotationStatusFilter === 'ALL' ||
        (qt.status && qt.status.toLowerCase() === quotationStatusFilter.toLowerCase());

      return matchesSearch && matchesStatus;
    });
  }, [quotations, quotationSearchQuery, quotationStatusFilter]);

  return {
    quotations,
    loading,
    quotationSearchQuery,
    setQuotationSearchQuery,
    quotationStatusFilter,
    setQuotationStatusFilter,
    modalCustomers,
    modalProducts,
    newlyCreatedCustomer,
    setNewlyCreatedCustomer,
    isQuotationModalOpen,
    setIsQuotationModalOpen,
    editingQuotation,
    setEditingQuotation,
    printData,
    setPrintData,
    isPrintOpen,
    setIsPrintOpen,
    notification,
    fetchQuotations,
    handleDeleteQuotation,
    handleUpdateQuotationStatus,
    handleEditQuotation,
    handleOpenPrintQuotation,
    handleQuotationCreated,
    totalQuotationValue,
    acceptedQuotationsCount,
    filteredQuotations
  };
}

export default useSalesQuotations;
