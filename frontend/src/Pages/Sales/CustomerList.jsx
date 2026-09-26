import React, { useState, useEffect, useMemo, useCallback } from 'react';
import API from '../../services/api';
import AddCustomerModal from './modals/AddCustomerModal';
import PartyProfileModal from '../../components/modals/PartyProfileModal';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * CustomerList
 * Standalone Customers subpage component.
 * Converted entirely to Tailwind CSS utilities (zero inline styles).
 * Fully encapsulates Customer state, fetch logic, AddCustomerModal, and PartyProfileModal.
 */
export default function CustomerList({
  initialSearch = '',
  onStartSale,
  onStartQuote,
  onCustomerCreated,
  onCustomersLoaded
}) {
  // 1. Data States
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerSearchQuery, setCustomerSearchQuery] = useState(initialSearch || '');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('ALL');

  // 2. Modal States (Relocated from global layout)
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [profileModalPartyId, setProfileModalPartyId] = useState(null);
  const [profileModalTab, setProfileModalTab] = useState('overview');

  // 3. Notification Toast State
  const [notification, setNotification] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: 'success' }), 4000);
  };

  // 4. Fetch Customers Logic
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/sales/customers`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data?.data || []);
        setCustomers(list);
        if (onCustomersLoaded) {
          onCustomersLoaded(list);
        }
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  }, [onCustomersLoaded]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Synchronize on data change events
  useEffect(() => {
    const handleDataChanged = () => fetchCustomers();
    window.addEventListener('data_changed', handleDataChanged);
    return () => window.removeEventListener('data_changed', handleDataChanged);
  }, [fetchCustomers]);

  // Event listener for opening modals triggered externally (e.g. from SalesLayout header)
  useEffect(() => {
    const handleOpenModal = (e) => {
      if (e.detail === 'customer') {
        setIsCustomerModalOpen(true);
      }
    };
    const handleOpenProfile = (e) => {
      if (e.detail?.customerId) {
        setProfileModalPartyId(e.detail.customerId);
        setProfileModalTab(e.detail.tab || 'overview');
      }
    };

    window.addEventListener('sales:open_modal', handleOpenModal);
    window.addEventListener('sales:open_customer_profile', handleOpenProfile);
    return () => {
      window.removeEventListener('sales:open_modal', handleOpenModal);
      window.removeEventListener('sales:open_customer_profile', handleOpenProfile);
    };
  }, []);

  // 5. Delete Customer Handler
  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer? This will not delete past invoices.')) return;
    try {
      const res = await fetch(`${API}/sales/customers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        window.dispatchEvent(new CustomEvent('data_changed'));
        fetchCustomers();
        showToast('Customer deleted successfully');
      } else {
        showToast(data.message || 'Cannot delete customer', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Server error deleting customer', 'error');
    }
  };

  const handleCustomerCreatedInternal = (newCust) => {
    setIsCustomerModalOpen(false);
    fetchCustomers();
    showToast(`Customer "${newCust.name || 'New Customer'}" added successfully!`);
    if (onCustomerCreated) {
      onCustomerCreated(newCust);
    }
  };

  // 6. Metrics Calculations
  const totalCustomerReceivables = useMemo(() => {
    return customers.reduce((sum, c) => sum + money(c.receivable_balance), 0);
  }, [customers]);

  const totalLoyaltyPoints = useMemo(() => {
    return customers.reduce((sum, c) => sum + Number(c.loyalty_points || 0), 0);
  }, [customers]);

  // 7. Filtered Customers Memo
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = customerSearchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q));

      const typeRaw = (c.customer_type || 'Regular').toLowerCase();
      const normGroup = typeRaw.includes('tech')
        ? 'technician'
        : (typeRaw.includes('resell') || typeRaw === 'wholesale' || typeRaw === 'corporate')
        ? 'reseller'
        : 'regular';

      const matchesType =
        customerTypeFilter === 'ALL' ||
        normGroup === customerTypeFilter.toLowerCase() ||
        typeRaw === customerTypeFilter.toLowerCase();

      return matchesSearch && matchesType;
    });
  }, [customers, customerSearchQuery, customerTypeFilter]);

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
            Total Registered Customers
          </span>
          <h3 className="text-xl font-extrabold text-sky-600 mt-1">
            {customers.length}
          </h3>
        </div>

        <div className="bg-white p-3 sm:px-3.5 sm:py-2.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[0.72rem] text-slate-500 font-semibold uppercase tracking-wider block">
            Outstanding Receivables
          </span>
          <h3 className={`text-xl font-extrabold mt-1 ${totalCustomerReceivables > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
            {taka(totalCustomerReceivables)}
          </h3>
        </div>

        <div className="bg-white p-3 sm:px-3.5 sm:py-2.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[0.72rem] text-slate-500 font-semibold uppercase tracking-wider block">
            Loyalty Points Distributed
          </span>
          <h3 className="text-xl font-extrabold text-amber-600 mt-1">
            {totalLoyaltyPoints.toLocaleString()} pts
          </h3>
        </div>
      </div>

      {/* Main Card Container */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
        {/* Dedicated Customer Search & Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative w-full max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                🔍
              </span>
              <input
                type="text"
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                placeholder="Search customers by name, phone, email, address..."
                className="w-full pl-9 pr-9 py-2 text-sm border border-slate-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-900 placeholder:text-slate-400"
              />
              {customerSearchQuery && (
                <button
                  type="button"
                  onClick={() => setCustomerSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 text-sm bg-transparent border-0 cursor-pointer"
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
              className="px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-700 font-medium cursor-pointer outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            >
              <option value="ALL">All Customer Groups</option>
              <option value="regular">👤 Regular</option>
              <option value="technician">🔧 Technician (5% Discount)</option>
              <option value="reseller">🏪 Reseller</option>
            </select>

            {/* Counter Badge */}
            <span className="text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-full">
              Showing {filteredCustomers.length} of {customers.length} Customers
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchCustomers}
              title="Refresh Customers"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <span>🔄</span> Refresh
            </button>
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(true)}
              title="Add New Customer"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm shadow-sky-600/20 cursor-pointer transition-colors border-0"
            >
              <span>+</span> Add Customer
            </button>
          </div>
        </div>

        {/* Data Table / Content Area */}
        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-center py-10 text-slate-500 text-sm">Loading customer list...</p>
          ) : filteredCustomers.length === 0 ? (
            customerSearchQuery || customerTypeFilter !== 'ALL' ? (
              <div className="text-center py-12 px-5 text-slate-500">
                <p className="text-base font-semibold text-slate-700 mb-2">
                  No customers match your search "{customerSearchQuery || customerTypeFilter}"
                </p>
                <p className="text-sm text-slate-500 mb-4">
                  Try searching with another name, phone number, email, or address.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCustomerSearchQuery('');
                    setCustomerTypeFilter('ALL');
                  }}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer transition-colors"
                >
                  Clear Search & Filter
                </button>
              </div>
            ) : (
              <div className="text-center py-12 px-5 text-slate-400">
                <p className="text-lg font-semibold text-slate-700 mb-2">No customers found</p>
                <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">
                  Add your retail, wholesale, or corporate clients to track their sales and loyalty points.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm cursor-pointer transition-colors border-0"
                >
                  + Add First Customer
                </button>
              </div>
            )
          ) : (
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider">
                  <th className="px-3.5 py-3 font-semibold">Customer Name</th>
                  <th className="px-3.5 py-3 font-semibold">Type</th>
                  <th className="px-3.5 py-3 font-semibold">Contact Info</th>
                  <th className="px-3.5 py-3 font-semibold">Address</th>
                  <th className="px-3.5 py-3 font-semibold">Loyalty Points</th>
                  <th className="px-3.5 py-3 font-semibold">Receivable Due</th>
                  <th className="px-3.5 py-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((cust) => {
                  const due = money(cust.receivable_balance);
                  return (
                    <tr
                      key={cust.id}
                      className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-3.5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {cust.name ? cust.name.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => {
                                setProfileModalPartyId(cust.id);
                                setProfileModalTab('overview');
                              }}
                              className="font-bold text-slate-900 hover:text-sky-600 cursor-pointer text-left text-sm bg-transparent border-0 p-0 transition-colors"
                            >
                              {cust.name}
                            </button>
                            <div className="text-xs text-slate-500">ID: #{cust.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3.5 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${
                            cust.customer_type?.toLowerCase().includes('tech')
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : cust.customer_type?.toLowerCase().includes('resell') ||
                                cust.customer_type === 'wholesale' ||
                                cust.customer_type === 'corporate'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {cust.customer_type?.toLowerCase().includes('tech')
                            ? '🔧 Technician'
                            : cust.customer_type?.toLowerCase().includes('resell') ||
                              cust.customer_type === 'wholesale' ||
                              cust.customer_type === 'corporate'
                            ? '🏪 Reseller'
                            : '👤 Regular'}
                        </span>
                      </td>
                      <td className="px-3.5 py-3">
                        <div className="font-semibold text-slate-800">{cust.phone}</div>
                        {cust.email && <div className="text-xs text-slate-500">{cust.email}</div>}
                      </td>
                      <td className="px-3.5 py-3 text-slate-600 text-xs max-w-[200px] truncate">
                        {cust.address || '-'}
                      </td>
                      <td className="px-3.5 py-3">
                        <span className="text-amber-600 font-bold text-xs">
                          ★ {Number(cust.loyalty_points || 0).toLocaleString()} pts
                        </span>
                      </td>
                      <td className="px-3.5 py-3">
                        <span className={`font-bold ${due > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                          {taka(due)}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onStartSale && onStartSale(cust)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                            title="Create sale for this customer"
                          >
                            <span>🛒</span> Sale
                          </button>
                          <button
                            type="button"
                            onClick={() => onStartQuote && onStartQuote(cust)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
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
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-colors cursor-pointer"
                            title="View customer profile & ledger"
                          >
                            <span>👤</span> Profile
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomer(cust.id)}
                            className="inline-flex items-center justify-center p-1 rounded-md text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
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

      {/* Relocated Modals */}
      {/* 1. Add Customer Modal */}
      {isCustomerModalOpen && (
        <AddCustomerModal
          isOpen={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
          onCustomerCreated={handleCustomerCreatedInternal}
        />
      )}

      {/* 2. Customer Profile Modal */}
      {profileModalPartyId && (
        <PartyProfileModal
          isOpen={Boolean(profileModalPartyId)}
          partyType="customer"
          partyId={profileModalPartyId}
          initialTab={profileModalTab}
          onClose={() => setProfileModalPartyId(null)}
          onPartyUpdated={fetchCustomers}
        />
      )}
    </div>
  );
}
