import { useState, useEffect, useMemo, useCallback } from 'react';
import API from '../../../services/api';

const money = (val) => Number.parseFloat(val || 0) || 0;

export function useCustomerList({
  initialSearch = '',
  onCustomerCreated,
  onCustomersLoaded
} = {}) {
  // 1. Data States
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerSearchQuery, setCustomerSearchQuery] = useState(initialSearch || '');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('ALL');

  // 2. Modal States
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
    showToast(`Customer "${newCust?.name || 'New Customer'}" added successfully!`);
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

  return {
    customers,
    loading,
    customerSearchQuery,
    setCustomerSearchQuery,
    customerTypeFilter,
    setCustomerTypeFilter,
    isCustomerModalOpen,
    setIsCustomerModalOpen,
    profileModalPartyId,
    setProfileModalPartyId,
    profileModalTab,
    setProfileModalTab,
    notification,
    handleDeleteCustomer,
    handleCustomerCreatedInternal,
    totalCustomerReceivables,
    totalLoyaltyPoints,
    filteredCustomers,
    fetchCustomers
  };
}

export default useCustomerList;
