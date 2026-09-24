import { useState, useEffect } from 'react';
import API from '../../services/api';

export function usePartyProfileManager({ isOpen, partyType = 'customer', partyId, onPartyUpdated, initialTab = 'overview', onClose }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'overview');
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    role_or_type: '',
    role_id: 3,
  });
  const [editLoading, setEditLoading] = useState(false);

  // Financial action form state
  const [finAction, setFinAction] = useState(partyType === 'staff' ? 'salary' : 'due');
  const [finForm, setFinForm] = useState({
    account_id: '',
    amount: '',
    note: '',
  });
  const [finLoading, setFinLoading] = useState(false);
  const [finError, setFinError] = useState('');
  const [finSuccess, setFinSuccess] = useState('');

  // Wallet state
  const [walletData, setWalletData] = useState(null);
  const [walletAction, setWalletAction] = useState('deposit');
  const [walletForm, setWalletForm] = useState({ account_id: '', amount: '', note: '', reference: '' });
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState('');
  const [walletSuccess, setWalletSuccess] = useState('');

  // Delete state
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Fetch party profile data and wallets
  const fetchPartyData = async () => {
    if (!partyId || !partyType) return;
    try {
      setLoading(true);
      setError('');

      const [partyRes, walletsRes, walletLedgerRes] = await Promise.all([
        fetch(`${API}/parties/${partyType}/${partyId}`),
        fetch(`${API}/accounts/wallets`),
        fetch(`${API}/wallets/${partyType}/${partyId}`),
      ]);

      if (!partyRes.ok) {
        const errJson = await partyRes.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to load profile details');
      }

      const pData = await partyRes.json();
      setProfileData(pData);

      // Pre-fill edit form
      const prof = pData.profile || {};
      setEditForm({
        name: prof.name || '',
        phone: prof.phone || '',
        email: prof.email || '',
        address: prof.address || '',
        role_or_type: prof.customer_type || prof.contact_person || prof.role_name || '',
        role_id: prof.role_id || 3,
      });

      // Pre-fill financial form with current due if available
      const currentDue = Math.abs(parseFloat(prof.balance || 0));
      if (finAction === 'due' && currentDue > 0) {
        setFinForm((prev) => ({
          ...prev,
          amount: String(currentDue),
        }));
      }

      if (walletsRes.ok) {
        const wData = await walletsRes.json();
        const wList = wData.data || [];
        setWallets(wList);
        if (wList.length > 0 && !finForm.account_id) {
          setFinForm((prev) => ({ ...prev, account_id: String(wList[0].id) }));
        }
        if (wList.length > 0 && !walletForm.account_id) {
          setWalletForm((prev) => ({
            ...prev,
            account_id: String(
              wList.find((w) => (w.account_type || '').toLowerCase() === 'drawer')?.id || wList[0].id
            ),
          }));
        }
      }
      if (walletLedgerRes.ok) {
        const wData = await walletLedgerRes.json();
        setWalletData(wData);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Network error loading profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && partyId) {
      setActiveTab(initialTab || 'overview');
      setFinAction(partyType === 'staff' ? 'salary' : 'due');
      setFinError('');
      setFinSuccess('');
      setError('');
      setSuccessMsg('');
      setDeleteError('');
      setWalletAction(partyType === 'staff' ? 'salary' : 'deposit');
      setWalletError('');
      setWalletSuccess('');
      setWalletForm({ account_id: '', amount: '', note: '', reference: '' });
      fetchPartyData();
    }
  }, [isOpen, partyId, partyType, initialTab]);

  // Handle Edit Profile Save
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      setError('Name is required');
      return;
    }
    try {
      setEditLoading(true);
      setError('');
      setSuccessMsg('');

      const res = await fetch(`${API}/parties/${partyType}/${partyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update profile');

      setSuccessMsg('Profile updated successfully!');
      await fetchPartyData();
      if (onPartyUpdated) onPartyUpdated();
    } catch (err) {
      setError(err.message || 'Error updating profile');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle Financial Action Submit
  const handleFinSubmit = async (e) => {
    e.preventDefault();
    setFinError('');
    setFinSuccess('');

    const numAmount = parseFloat(finForm.amount);
    if (!numAmount || numAmount <= 0) {
      setFinError('Please enter a valid positive amount.');
      return;
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
      await fetchPartyData();
      if (onPartyUpdated) onPartyUpdated();
    } catch (err) {
      setFinError(err.message || 'Error processing transaction');
    } finally {
      setFinLoading(false);
    }
  };

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
      const res = await fetch(`${API}/wallets/transaction`, {
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
      await fetchPartyData();
      if (onPartyUpdated) onPartyUpdated();
    } catch (err) {
      setWalletError(err.message || 'Error processing wallet transaction');
    } finally {
      setWalletLoading(false);
    }
  };

  // Handle Safe Deletion
  const handleDeleteParty = async () => {
    const profile = profileData?.profile || {};
    if (!window.confirm(`Are you sure you want to permanently delete "${profile.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      setDeleteLoading(true);
      setDeleteError('');

      const res = await fetch(`${API}/parties/${partyType}/${partyId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete party');

      alert(data.message || 'Party deleted successfully.');
      if (onPartyUpdated) onPartyUpdated();
      if (onClose) onClose();
    } catch (err) {
      setDeleteError(err.message || 'Could not delete party.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    loading,
    profileData,
    wallets,
    error,
    setError,
    successMsg,
    setSuccessMsg,
    editForm,
    setEditForm,
    editLoading,
    finAction,
    setFinAction,
    finForm,
    setFinForm,
    finLoading,
    finError,
    setFinError,
    finSuccess,
    setFinSuccess,
    walletData,
    walletAction,
    setWalletAction,
    walletForm,
    setWalletForm,
    walletLoading,
    walletError,
    setWalletError,
    walletSuccess,
    setWalletSuccess,
    deleteLoading,
    deleteError,
    fetchPartyData,
    handleEditSubmit,
    handleFinSubmit,
    handleWalletSubmit,
    handleDeleteParty,
    walletNeedsAccount,
  };
}
