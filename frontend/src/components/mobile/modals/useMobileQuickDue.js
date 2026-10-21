import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../../services/api';

export default function useMobileQuickDue({ isOpen, onClose, onSuccess }) {
  const [customers, setCustomers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [note, setNote] = useState('');
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load Customers & Accounts
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    async function loadData() {
      try {
        const [custRes, accRes] = await Promise.all([
          api.get('/customers'),
          api.get('/accounts').catch(() => ({ data: [] })),
        ]);
        if (!isMounted) return;
        const custList = Array.isArray(custRes.data) ? custRes.data : (custRes.data?.customers || []);
        const accList = Array.isArray(accRes.data) ? accRes.data : (accRes.data?.accounts || []);
        setCustomers(custList);
        setAccounts(accList);
        if (accList.length > 0 && !accountId) {
          setAccountId(String(accList[0].id));
        }
      } catch {
        // ignore
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [isOpen, accountId]);

  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customers.find((c) => String(c.id) === String(selectedCustomerId)) || null;
  }, [customers, selectedCustomerId]);

  const customerDue = useMemo(() => {
    if (!selectedCustomer) return 0;
    return Math.max(0, Number(selectedCustomer.receivable_balance ?? selectedCustomer.due_balance ?? selectedCustomer.due ?? 0));
  }, [selectedCustomer]);

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers.slice(0, 20);
    return customers.filter((c) => {
      const name = String(c.name || '').toLowerCase();
      const phone = String(c.phone || '').toLowerCase();
      return name.includes(q) || phone.includes(q);
    }).slice(0, 25);
  }, [customers, search]);

  const handleSelectCustomer = useCallback((cust) => {
    setSelectedCustomerId(String(cust.id));
    setAmount('');
    setError('');
  }, []);

  const handleSetFullDue = useCallback(() => {
    if (customerDue > 0) {
      setAmount(String(customerDue));
      setError('');
    }
  }, [customerDue]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!selectedCustomer) {
      setError('অনুগ্রহ করে গ্রাহক নির্বাচন করুন।');
      return;
    }
    if (!numAmount || numAmount <= 0) {
      setError('সঠিক বকেয়া জমার পরিমাণ লিখুন।');
      return;
    }
    if (numAmount > customerDue) {
      setError(`বকেয়া জমার পরিমাণ বকেয়া ব্যালেন্সের (৳ ${customerDue.toLocaleString('en-BD')}) বেশি হতে পারবে না।`);
      return;
    }
    if (!accountId) {
      setError('পেমেন্ট অ্যাকাউন্ট নির্বাচন করুন।');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await api.post('/customers/transactions/due-receive', {
        customer_id: selectedCustomer.id,
        amount: numAmount,
        account_id: accountId,
        payment_method: 'CASH',
        note: note.trim() || 'Mobile Pocket Due Collection',
      });
      if (typeof onSuccess === 'function') {
        onSuccess({ customer: selectedCustomer, amount: numAmount });
      }
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'বকেয়া গ্রহণ ব্যর্থ হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    filteredCustomers,
    accounts,
    selectedCustomer,
    customerDue,
    amount,
    setAmount,
    accountId,
    setAccountId,
    note,
    setNote,
    search,
    setSearch,
    submitting,
    error,
    handleSelectCustomer,
    handleSetFullDue,
    handleSubmit,
  };
}
