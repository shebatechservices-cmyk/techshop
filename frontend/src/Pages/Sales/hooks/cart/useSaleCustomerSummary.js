import { useState, useEffect, useRef } from 'react';
import API from '../../../../services/api';

/**
 * Customer Selection, Summary Ledger & Staff Directory Sub-hook
 */
export function useSaleCustomerSummary({ newlyCreatedCustomer }) {
  const [customerId, setCustomerId] = useState('');
  const [customerSummary, setCustomerSummary] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [staffList, setStaffList] = useState([
    'Sheba Admin',
    'Tanvir Hasan',
    'Al-Amin Technician',
  ]);

  const customerSelectRef = useRef(null);

  // Close customer dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        customerSelectRef.current &&
        !customerSelectRef.current.contains(e.target)
      ) {
        setIsCustomerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Set default customer when a brand-new customer was just created
  useEffect(() => {
    if (newlyCreatedCustomer && newlyCreatedCustomer.id) {
      setCustomerId(String(newlyCreatedCustomer.id));
    }
  }, [newlyCreatedCustomer]);

  // Fetch customer ledger summary
  useEffect(() => {
    if (!customerId) {
      setCustomerSummary(null);
      setLoadingSummary(false);
      return;
    }
    let isMounted = true;
    setLoadingSummary(true);
    fetch(`${API}/sales/customers/${customerId}/summary`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted) {
          if (data && data.success) {
            setCustomerSummary(data);
          } else {
            setCustomerSummary(null);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch customer summary:', err);
        if (isMounted) setCustomerSummary(null);
      })
      .finally(() => {
        if (isMounted) setLoadingSummary(false);
      });
    return () => {
      isMounted = false;
    };
  }, [customerId]);

  // Load staff list & user directory
  useEffect(() => {
    fetch(`${API}/parties?type=staff`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const names = data.map((d) => d.name).filter(Boolean);
          if (names.length > 0) {
            setStaffList((prev) => Array.from(new Set([...names, ...prev])));
          }
        }
      })
      .catch(() => {});
    fetch(`${API}/security/users`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const rows = data && Array.isArray(data.data) ? data.data : [];
        const names = rows.map((r) => r.name).filter(Boolean);
        if (names.length > 0) {
          setStaffList((prev) => Array.from(new Set([...prev, ...names])));
        }
      })
      .catch(() => {});
  }, []);

  return {
    customerId,
    setCustomerId,
    customerSummary,
    setCustomerSummary,
    customerSearch,
    setCustomerSearch,
    isCustomerOpen,
    setIsCustomerOpen,
    loadingSummary,
    staffList,
    customerSelectRef,
  };
}

export default useSaleCustomerSummary;
