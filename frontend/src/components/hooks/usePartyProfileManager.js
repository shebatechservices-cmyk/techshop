import { useState, useEffect } from 'react';
import API from '../../services/api';
import { usePartyFinancialOps } from './party-profile/usePartyFinancialOps';
import { usePartyWalletOps } from './party-profile/usePartyWalletOps';
import { usePartyEditDeleteOps } from './party-profile/usePartyEditDeleteOps';

export function usePartyProfileManager({
  isOpen,
  partyType = 'customer',
  partyId,
  onPartyUpdated,
  initialTab = 'overview',
  onClose,
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'overview');
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const finOps = usePartyFinancialOps({
    partyType,
    partyId,
    fetchPartyData: () => fetchPartyData(),
    onPartyUpdated,
  });

  const walletOps = usePartyWalletOps({
    partyType,
    partyId,
    fetchPartyData: () => fetchPartyData(),
    onPartyUpdated,
  });

  const editDeleteOps = usePartyEditDeleteOps({
    partyType,
    partyId,
    profileData,
    setError,
    setSuccessMsg,
    fetchPartyData: () => fetchPartyData(),
    onPartyUpdated,
    onClose,
  });

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

      const prof = pData.profile || {};
      editDeleteOps.setEditForm({
        name: prof.name || '',
        phone: prof.phone || '',
        email: prof.email || '',
        address: prof.address || '',
        role_or_type: prof.customer_type || prof.contact_person || prof.role_name || '',
        role_id: prof.role_id || 3,
      });

      const currentDue = Math.abs(parseFloat(prof.balance || 0));
      if (finOps.finAction === 'due' && currentDue > 0) {
        finOps.setFinForm((prev) => ({
          ...prev,
          amount: String(currentDue),
        }));
      }

      if (walletsRes.ok) {
        const wData = await walletsRes.json();
        const wList = wData.data || [];
        setWallets(wList);
        if (wList.length > 0 && !finOps.finForm.account_id) {
          finOps.setFinForm((prev) => ({ ...prev, account_id: String(wList[0].id) }));
        }
        if (wList.length > 0 && !walletOps.walletForm.account_id) {
          walletOps.setWalletForm((prev) => ({
            ...prev,
            account_id: String(
              wList.find((w) => (w.account_type || '').toLowerCase() === 'drawer')?.id || wList[0].id
            ),
          }));
        }
      }
      if (walletLedgerRes.ok) {
        const wData = await walletLedgerRes.json();
        walletOps.setWalletData(wData);
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
      finOps.setFinAction(partyType === 'staff' ? 'salary' : 'due');
      finOps.setFinError('');
      finOps.setFinSuccess('');
      setError('');
      setSuccessMsg('');
      editDeleteOps.setDeleteError('');
      walletOps.setWalletAction(partyType === 'staff' ? 'salary' : 'deposit');
      walletOps.setWalletError('');
      walletOps.setWalletSuccess('');
      walletOps.setWalletForm({ account_id: '', amount: '', note: '', reference: '' });
      fetchPartyData();
    }
  }, [isOpen, partyId, partyType, initialTab]);

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
    editForm: editDeleteOps.editForm,
    setEditForm: editDeleteOps.setEditForm,
    editLoading: editDeleteOps.editLoading,
    deleteLoading: editDeleteOps.deleteLoading,
    deleteError: editDeleteOps.deleteError,
    fetchPartyData,
    handleEditSubmit: editDeleteOps.handleEditSubmit,
    handleDeleteParty: editDeleteOps.handleDeleteParty,
    ...finOps,
    ...walletOps,
  };
}
