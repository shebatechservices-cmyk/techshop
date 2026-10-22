import { useState, useEffect, useCallback } from 'react';
import { smartFetch } from '../../../../services/api';

const getCachedAccounts = () => {
  try {
    const raw = sessionStorage.getItem('sheba_cached_payment_accounts');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export function useDuePayment({ isOpen, sale, customer, onClose, onPaymentSuccess }) {
  const [paymentMode, setPaymentMode] = useState('single');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [note, setNote] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [accounts, setAccounts] = useState(getCachedAccounts);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const saleId = sale?.id;
  const saleDue = Number(sale?.due_amount || 0);
  const customerTotalDue = Number(
    customer?.receivable_balance ?? sale?.customer_receivable_balance ?? 0
  );
  const customerId = customer?.id || sale?.customer_id;
  const customerName = customer?.name || sale?.customer_name || 'Customer';

  const fetchAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    try {
      let res = await smartFetch('/accounts/wallets').catch(() => null);
      if (!res || !res.ok) {
        res = await smartFetch('/accounts').catch(() => null);
      }
      if (res && res.ok) {
        const json = await res.json().catch(() => null);
        const list = Array.isArray(json) ? json : json?.data || [];
        if (list.length > 0) {
          setAccounts(list);
          try {
            sessionStorage.setItem('sheba_cached_payment_accounts', JSON.stringify(list));
          } catch {}
          const defaultAcc =
            list.find((a) => (a.account_type || '').toLowerCase() === 'drawer') ||
            list[0];
          setAccountId((prev) => (prev ? prev : String(defaultAcc.id)));
        }
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && saleId) {
      setError('');
      setNote('');
      setReferenceNo('');
      setPaymentMode('single');
      setAmount(saleDue > 0 ? String(saleDue) : '');

      const initialAccounts = accounts.length > 0 ? accounts : getCachedAccounts();
      if (initialAccounts.length > 0) {
        setAccounts(initialAccounts);
        const defaultAcc =
          initialAccounts.find((a) => (a.account_type || '').toLowerCase() === 'drawer') ||
          initialAccounts[0];
        setAccountId(String(defaultAcc.id));
      }

      fetchAccounts();
    }
  }, [isOpen, saleId, fetchAccounts]);

  const handleModeChange = (mode) => {
    setPaymentMode(mode);
    setError('');
    if (mode === 'single') {
      setAmount(saleDue > 0 ? String(saleDue) : '');
    } else {
      setAmount(customerTotalDue > 0 ? String(customerTotalDue) : String(saleDue || ''));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid positive payment amount.');
      return;
    }

    if (paymentMode === 'single') {
      if (saleDue <= 0) {
        setError('এই ইনভয়েসের কোনো বকেয়া নেই (Zero due).');
        return;
      }
      if (numAmount > saleDue) {
        setError(`পেমেন্টের পরিমাণ ইনভয়েসের বকেয়া (৳ ${saleDue.toLocaleString()}) এর চেয়ে বেশি হতে পারবে না।`);
        return;
      }
    } else {
      if (customerTotalDue <= 0) {
        setError('এই কাস্টমারের কোনো বকেয়া নেই (No outstanding due).');
        return;
      }
      if (numAmount > customerTotalDue) {
        setError(`পেমেন্টের পরিমাণ কাস্টমারের মোট বকেয়া (৳ ${customerTotalDue.toLocaleString()}) এর চেয়ে বেশি হতে পারবে না।`);
        return;
      }
    }

    if (!accountId) {
      setError('Please select a payment wallet or account.');
      return;
    }

    try {
      setSubmitting(true);
      const endpoint = paymentMode === 'single'
        ? `/sales/${sale?.id}/payments`
        : `/sales/customers/${customerId}/bulk-due-payment`;

      const payload = {
        amount: numAmount,
        account_id: Number(accountId),
        note: note.trim() || undefined,
        reference_no: referenceNo.trim() || undefined,
      };

      const res = await smartFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Payment transaction failed.');
      }

      window.dispatchEvent(new CustomEvent('data_changed'));
      onClose();
      if (onPaymentSuccess) {
        onPaymentSuccess(data.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error collecting payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    paymentMode,
    amount,
    setAmount,
    accountId,
    setAccountId,
    note,
    setNote,
    referenceNo,
    setReferenceNo,
    accounts,
    loadingAccounts,
    submitting,
    error,
    saleDue,
    customerTotalDue,
    customerId,
    customerName,
    handleModeChange,
    handleSubmit,
  };
}

