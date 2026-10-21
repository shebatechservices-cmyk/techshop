import { useState } from 'react';
import API from '../../../services/api';

export function usePartyFinancialOps({
  partyType,
  partyId,
  profileData,
  fetchPartyData,
  onPartyUpdated,
}) {
  const [finAction, setFinAction] = useState(partyType === 'staff' ? 'salary' : 'due');
  const [finForm, setFinForm] = useState({
    account_id: '',
    amount: '',
    note: '',
  });
  const [finLoading, setFinLoading] = useState(false);
  const [finError, setFinError] = useState('');
  const [finSuccess, setFinSuccess] = useState('');

  const handleFinSubmit = async (e) => {
    e.preventDefault();
    setFinError('');
    setFinSuccess('');

    const numAmount = parseFloat(finForm.amount);
    if (!numAmount || numAmount <= 0) {
      setFinError('Please enter a valid positive amount.');
      return;
    }

    if (finAction === 'due') {
      const partyDue = partyType === 'customer'
        ? Number(profileData?.profile?.receivable_balance || 0)
        : partyType === 'supplier'
          ? Number(profileData?.profile?.payable_balance || 0)
          : 0;

      if (partyDue <= 0 && profileData?.profile) {
        setFinError('কোনো বকেয়া নেই (Zero due).');
        return;
      }
      if (partyDue > 0 && numAmount > partyDue) {
        setFinError(`পেমেন্টের পরিমাণ বকেয়া (৳ ${partyDue.toLocaleString()}) এর চেয়ে বেশি হতে পারবে না।`);
        return;
      }
    }

    if (!finForm.account_id) {
      setFinError('Please select a payment wallet/account.');
      return;
    }

    try {
      setFinLoading(true);

      let actionTypeToSend = finAction;
      if (partyType === 'supplier') {
        actionTypeToSend = finAction === 'due' ? 'due_payment' : 'advance_payment';
      } else if (partyType === 'customer') {
        actionTypeToSend =
          finAction === 'due' ? 'due_receive' : finAction === 'advance' ? 'advance_receive' : 'refund';
      } else if (partyType === 'staff') {
        actionTypeToSend = 'salary_payment';
      }

      const res = await fetch(`${API}/parties/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          party_type: partyType,
          party_id: Number(partyId),
          action_type: actionTypeToSend,
          account_id: Number(finForm.account_id),
          amount: numAmount,
          note: finForm.note.trim() || `${actionTypeToSend.toUpperCase()} via Profile Modal`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Transaction failed');

      setFinSuccess(data.message || 'Transaction completed successfully!');
      setFinForm((prev) => ({ ...prev, note: '' }));
      if (fetchPartyData) await fetchPartyData();
      if (onPartyUpdated) onPartyUpdated();
    } catch (err) {
      setFinError(err.message || 'Error processing transaction');
    } finally {
      setFinLoading(false);
    }
  };

  return {
    finAction,
    setFinAction,
    finForm,
    setFinForm,
    finLoading,
    finError,
    setFinError,
    finSuccess,
    setFinSuccess,
    handleFinSubmit,
  };
}
