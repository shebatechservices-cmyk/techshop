import React, { useState, useEffect, useMemo, useCallback } from 'react';
import API from '../../services/api';
import SaleQuotationModal from './modals/SaleQuotationModal';
import SalePrintModal from './modals/SalePrintModal';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Helper to generate Tailwind CSS classes for quotation status badges
 */
const getQuotationStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'accepted':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'sent':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'rejected':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'expired':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'draft':
    default:
      return 'bg-amber-50 text-amber-700 border-amber-200';
  }
};

/**
 * SalesQuotations
 * Standalone Quotations subpage component.
 * Converted entirely to Tailwind CSS utilities (zero inline styles).
 * Fully encapsulates Quotations state, fetch logic, SaleQuotationModal, and quotation printing.
 */
export default function SalesQuotations({
  initialSearch = '',
  onQuotationsLoaded
}) {
  // 1. Data States
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quotationSearchQuery, setQuotationSearchQuery] = useState(initialSearch || '');
  const [quotationStatusFilter, setQuotationStatusFilter] = useState('ALL');

  // Customer & Product catalogs for quotation modal creation
  const [modalCustomers, setModalCustomers] = useState([]);
  const [modalProducts, setModalProducts] = useState([]);
  const [newlyCreatedCustomer, setNewlyCreatedCustomer] = useState(null);

  // 2. Modal States (Relocated from global layout)
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

  return (
    <div className="w-full space-y-4">
      {/* Toast Notification */}
      {notification.message && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl font-semibold text-sm shadow-xl flex items-center gap-2 text-white transition-all ${
            notification.type === 'error' ? 'bg-rose-500' : 'bg-emerald-600'
          }`}
        >
          <span>{notification.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="bg-white p-3 sm:px-3.5 sm:py-2.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[0.72rem] text-slate-500 font-semibold uppercase tracking-wider block">
            Total Quotations
          </span>
          <h3 className="text-xl font-extrabold text-indigo-600 mt-1">
            {quotations.length}
          </h3>
        </div>

        <div className="bg-white p-3 sm:px-3.5 sm:py-2.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[0.72rem] text-slate-500 font-semibold uppercase tracking-wider block">
            Total Quoted Value
          </span>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">
            {taka(totalQuotationValue)}
          </h3>
        </div>

        <div className="bg-white p-3 sm:px-3.5 sm:py-2.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[0.72rem] text-slate-500 font-semibold uppercase tracking-wider block">
            Accepted Quotes
          </span>
          <h3 className="text-xl font-extrabold text-emerald-600 mt-1">
            {acceptedQuotationsCount}
          </h3>
        </div>
      </div>

      {/* Main Card Container */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
        {/* Dedicated Quotation Search & Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative w-full max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                🔍
              </span>
              <input
                type="text"
                value={quotationSearchQuery}
                onChange={(e) => setQuotationSearchQuery(e.target.value)}
                placeholder="Search quotations by quotation #, client name, phone, notes..."
                className="w-full pl-9 pr-9 py-2 text-sm border border-slate-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400"
              />
              {quotationSearchQuery && (
                <button
                  type="button"
                  onClick={() => setQuotationSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 text-sm bg-transparent border-0 cursor-pointer"
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
              className="px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-700 font-medium cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              <option value="ALL">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
              <option value="draft">Draft</option>
            </select>

            {/* Counter Badge */}
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-full">
              Showing {filteredQuotations.length} of {quotations.length} Quotations
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchQuotations}
              title="Refresh Quotations"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <span>🔄</span> Refresh
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingQuotation(null);
                setNewlyCreatedCustomer(null);
                setIsQuotationModalOpen(true);
              }}
              title="Create New Quotation"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-600/20 cursor-pointer transition-colors border-0"
            >
              <span>+</span> New Quotation
            </button>
          </div>
        </div>

        {/* Data Table / Content Area */}
        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-center py-10 text-slate-500 text-sm">Loading quotation records...</p>
          ) : filteredQuotations.length === 0 ? (
            quotationSearchQuery || quotationStatusFilter !== 'ALL' ? (
              <div className="text-center py-12 px-5 text-slate-500">
                <p className="text-base font-semibold text-slate-700 mb-2">
                  No quotations match your search "{quotationSearchQuery || quotationStatusFilter}"
                </p>
                <p className="text-sm text-slate-500 mb-4">
                  Try searching with another quotation number, client name, or phone number.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuotationSearchQuery('');
                    setQuotationStatusFilter('ALL');
                  }}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer transition-colors"
                >
                  Clear Search & Filter
                </button>
              </div>
            ) : (
              <div className="text-center py-12 px-5 text-slate-400">
                <p className="text-lg font-semibold text-slate-700 mb-2">No quotation records found</p>
                <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">
                  Generate professional price estimates and quotation proposals for clients.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingQuotation(null);
                    setNewlyCreatedCustomer(null);
                    setIsQuotationModalOpen(true);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm cursor-pointer transition-colors border-0"
                >
                  + Create First Quotation
                </button>
              </div>
            )
          ) : (
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider">
                  <th className="px-3.5 py-3 font-semibold">Quotation No</th>
                  <th className="px-3.5 py-3 font-semibold">Client / Customer</th>
                  <th className="px-3.5 py-3 font-semibold">Status</th>
                  <th className="px-3.5 py-3 font-semibold">Total Amount</th>
                  <th className="px-3.5 py-3 font-semibold">Valid Until</th>
                  <th className="px-3.5 py-3 font-semibold">Created Date</th>
                  <th className="px-3.5 py-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotations.map((quote) => {
                  const badgeClass = getQuotationStatusBadgeClass(quote.status);
                  return (
                    <tr
                      key={quote.id}
                      className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-3.5 py-3 font-bold text-indigo-600">
                        <button
                          type="button"
                          onClick={() => handleOpenPrintQuotation(quote.id)}
                          title="Click to view & print quotation"
                          className="font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer text-left bg-transparent border-0 p-0 underline underline-offset-2 transition-colors"
                        >
                          {quote.quotation_no || `QTN-${quote.id}`}
                        </button>
                      </td>
                      <td className="px-3.5 py-3">
                        <div className="font-semibold text-slate-800">{quote.customer_name || 'Client'}</div>
                        {quote.customer_phone && (
                          <div className="text-xs text-slate-500">{quote.customer_phone}</div>
                        )}
                      </td>
                      <td className="px-3.5 py-3">
                        <select
                          value={quote.status || 'sent'}
                          onChange={(e) => handleUpdateQuotationStatus(quote.id, e.target.value)}
                          className={`px-2 py-1 rounded-md text-xs font-bold uppercase cursor-pointer outline-none border transition-colors ${badgeClass}`}
                        >
                          <option value="draft">Draft</option>
                          <option value="sent">Sent</option>
                          <option value="accepted">Accepted</option>
                          <option value="rejected">Rejected</option>
                          <option value="expired">Expired</option>
                        </select>
                      </td>
                      <td className="px-3.5 py-3 font-bold text-slate-900">
                        {taka(quote.total_amount)}
                      </td>
                      <td className="px-3.5 py-3 text-slate-500 text-xs">
                        {quote.valid_until
                          ? new Date(quote.valid_until).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '7 Days'}
                      </td>
                      <td className="px-3.5 py-3 text-slate-500 text-xs">
                        {quote.created_at
                          ? new Date(quote.created_at).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </td>
                      <td className="px-3.5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenPrintQuotation(quote.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
                            title="Print / View Quotation"
                          >
                            <span>🖨️</span> Print
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditQuotation(quote.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                            title="Edit quotation"
                          >
                            <span>✏️</span> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuotation(quote.id)}
                            className="inline-flex items-center justify-center p-1.5 rounded-md text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
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

      {/* Relocated Modals */}
      {/* 1. Sale Quotation Modal */}
      {isQuotationModalOpen && (
        <SaleQuotationModal
          isOpen={isQuotationModalOpen}
          onClose={() => {
            setIsQuotationModalOpen(false);
            setEditingQuotation(null);
          }}
          customers={modalCustomers}
          products={modalProducts}
          newlyCreatedCustomer={newlyCreatedCustomer}
          onOpenAddCustomer={() => {
            window.dispatchEvent(new CustomEvent('sales:open_modal', { detail: 'customer' }));
          }}
          onQuotationCreated={handleQuotationCreated}
          editingQuotation={editingQuotation}
        />
      )}

      {/* 2. Quotation Printable Sheet Modal */}
      {isPrintOpen && printData && (
        <SalePrintModal
          isOpen={isPrintOpen}
          onClose={() => {
            setIsPrintOpen(false);
            setPrintData(null);
          }}
          sale={printData}
          isQuotation={true}
        />
      )}
    </div>
  );
}
