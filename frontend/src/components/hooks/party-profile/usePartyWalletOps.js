import { useState } from 'react';
import { smartFetch } from '../../../services/api';

export function usePartyWalletOps({
  partyType,
  partyId,
  fetchPartyData,
  onPartyUpdated,
}) {
  const [walletData, setWalletData] = useState(null);
  const [walletAction, setWalletAction] = useState('deposit');
  const [walletForm, setWalletForm] = useState({ account_id: '', amount: '', note: '', reference: '' });
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState('');
  const [walletSuccess, setWalletSuccess] = useState('');

  const walletNeedsAccount = () => {
    if (partyType === 'supplier' && (walletAction === 'deposit' || walletAction === 'withdraw')) return false;
    if (walletAction === 'due_payment' && partyType === 'customer') return false;
    if (partyType === 'staff' && (walletAction === 'salary' || walletAction === 'bonus')) return false;
    return true;
  };

  const handleWalletSubmit = async (e) => {
    e.preventDefault();
    setWalletError('');
    setWalletSuccess('');
    const numAmount = parseFloat(walletForm.amount);
    if (!numAmount || numAmount <= 0) {
      setWalletError('Please enter a valid positive amount.');
      return;
    }
    const needsAccount = walletNeedsAccount();
    if (needsAccount && !walletForm.account_id) {
      setWalletError('Please select a shop account (Cash / Bank / MFS).');
      return;
    }
    try {
      setWalletLoading(true);
      const res = await smartFetch('/wallets/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          party_type: partyType,
          party_id: Number(partyId),
          action: walletAction,
          account_id: needsAccount ? Number(walletForm.account_id) : null,
          amount: numAmount,
          note: walletForm.note.trim() || `${walletAction.toUpperCase()} via Wallet`,
          reference: walletForm.reference.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Wallet transaction failed');
      setWalletSuccess(data.message || 'Wallet transaction completed successfully!');
      setWalletForm((prev) => ({ ...prev, note: '', reference: '' }));
      if (fetchPartyData) await fetchPartyData();
      if (onPartyUpdated) onPartyUpdated();
    } catch (err) {
      setWalletError(err.message || 'Error processing wallet transaction');
    } finally {
      setWalletLoading(false);
    }
  };

  return {
    walletData,
    setWalletData,
    walletAction,
    setWalletAction,
    walletForm,
    setWalletForm,
    walletLoading,
    walletError,
    setWalletError,
    walletSuccess,
    setWalletSuccess,
    walletNeedsAccount,
    handleWalletSubmit,
  };
}
