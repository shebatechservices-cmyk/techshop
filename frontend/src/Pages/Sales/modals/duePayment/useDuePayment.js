import { useState, useEffect } from 'react';
import API from '../../../../services/api';

export function useDuePayment({ isOpen, sale, customer, onClose, onPaymentSuccess }) {
  const [paymentMode, setPaymentMode] = useState('single');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [note, setNote] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const saleDue = Number(sale?.due_amount || 0);
  const customerTotalDue = Number(
    customer?.receivable_balance ?? sale?.customer_receivable_balance ?? 0
  );
  const customerId = customer?.id || sale?.customer_id;
  const customerName = customer?.name || sale?.customer_name || 'Customer';

  useEffect(() => {
    if (isOpen) {
      setError('');
      setNote('');
      setReferenceNo('');
      setPaymentMode('single');
      setAmount(saleDue > 0 ? String(saleDue) : '');

      setLoadingAccounts(true);
      fetch(`${API}/accounts/wallets`)
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          const list = Array.isArray(json) ? json : json?.data || [];
          setAccounts(list);
          if (list.length > 0) {
            const defaultAcc =
              list.find((a) => (a.account_type || '').toLowerCase() === 'drawer') ||
              list[0];
            setAccountId(String(defaultAcc.id));
          }
        })
        .catch((err) => {
          console.error('Failed to load accounts:', err);
          setError('Failed to load payment accounts list.');
        })
        .finally(() => setLoadingAccounts(false));
    }
  }, [isOpen, sale, saleDue]);

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
        setError('This invoice is already fully paid (Zero due).');
        return;
      }
      if (numAmount > saleDue) {
        setError(`Amount cannot exceed invoice due (৳ ${saleDue.toLocaleString()}).`);
        return;
      }
    } else {
      if (customerTotalDue <= 0) {
        setError('This customer has no outstanding due.');
        return;
      }
      if (numAmount > customerTotalDue) {
        setError(`Amount cannot exceed customer's total due (৳ ${customerTotalDue.toLocaleString()}).`);
        return;
      }
    }

    if (!accountId) {
      setError('Please select a payment wallet or account.');
      return;
    }

    try {
      setSubmitting(true);
      let url = '';
      let payload = {
        amount: numAmount,
        account_id: Number(accountId),
        note: note.trim() || undefined,
        reference_no: referenceNo.trim() || undefined,
      };

      if (paymentMode === 'single') {
        url = `${API}/sales/${sale?.id}/payments`;
      } else {
        if (!customerId) {
          throw new Error('Customer ID is required for bulk due settlement.');
        }
        url = `${API}/sales/customers/${customerId}/bulk-due-payment`;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
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
