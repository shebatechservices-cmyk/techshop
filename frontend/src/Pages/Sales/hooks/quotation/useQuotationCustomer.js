import { useState, useEffect, useMemo } from 'react';
import API from '../../../../services/api';

export function useQuotationCustomer({
  isOpen,
  customers = [],
  newlyCreatedCustomer,
}) {
  const [localCustomers, setLocalCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Auto-fetch customers if none passed
  useEffect(() => {
    if (isOpen && (!customers || customers.length === 0)) {
      fetch(`${API}/sales/customers`)
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          const list = Array.isArray(json) ? json : (json?.data || []);
          setLocalCustomers(list);
        })
        .catch(() => {});
    }
  }, [isOpen, customers]);

  // Real-time synchronization when a customer is created
  useEffect(() => {
    const handleCustomerCreated = (e) => {
      const newCust = e.detail;
      if (newCust && newCust.id) {
        setLocalCustomers((prev) => [newCust, ...prev.filter((c) => c.id !== newCust.id)]);
        setCustomerId(String(newCust.id));
        setCustomerName(newCust.name || '');
        setCustomerPhone(newCust.phone || '');
        setCustomerAddress(newCust.address || '');
      }
    };
    window.addEventListener('customer_created', handleCustomerCreated);
    return () => window.removeEventListener('customer_created', handleCustomerCreated);
  }, []);

  const customerList = useMemo(() => {
    const base = customers && customers.length > 0 ? customers : localCustomers;
    if (newlyCreatedCustomer && !base.some((c) => c.id === newlyCreatedCustomer.id)) {
      return [newlyCreatedCustomer, ...base];
    }
    return base;
  }, [customers, localCustomers, newlyCreatedCustomer]);

  // Auto-select newly created customer
  useEffect(() => {
    if (newlyCreatedCustomer && newlyCreatedCustomer.id) {
      setLocalCustomers((prev) => [newlyCreatedCustomer, ...prev.filter((c) => c.id !== newlyCreatedCustomer.id)]);
      setCustomerId(String(newlyCreatedCustomer.id));
      setCustomerName(newlyCreatedCustomer.name || '');
      setCustomerPhone(newlyCreatedCustomer.phone || '');
      setCustomerAddress(newlyCreatedCustomer.address || '');
    }
  }, [newlyCreatedCustomer]);

  // When customer dropdown changes
  const handleCustomerChange = (idStr) => {
    setCustomerId(idStr);
    const sel = customerList.find((c) => String(c.id) === String(idStr));
    if (sel) {
      setCustomerName(sel.name || '');
      setCustomerPhone(sel.phone || '');
      setCustomerAddress(sel.address || '');
    } else {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
    }
  };

  return {
    localCustomers,
    setLocalCustomers,
    customerId,
    setCustomerId,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    customerAddress,
    setCustomerAddress,
    customerList,
    handleCustomerChange,
  };
}
