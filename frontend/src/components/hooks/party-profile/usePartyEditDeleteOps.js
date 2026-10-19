import { useState } from 'react';
import API from '../../../services/api';

export function usePartyEditDeleteOps({
  partyType,
  partyId,
  profileData,
  setError,
  setSuccessMsg,
  fetchPartyData,
  onPartyUpdated,
  onClose,
}) {
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    role_or_type: '',
    role_id: 3,
  });
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

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

  const handleDeleteParty = async () => {
    const profile = profileData?.profile || {};
    if (
      !window.confirm(
        `Are you sure you want to permanently delete "${profile.name}"? This action cannot be undone.`
      )
    ) {
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
    editForm,
    setEditForm,
    editLoading,
    deleteLoading,
    deleteError,
    setDeleteError,
    handleEditSubmit,
    handleDeleteParty,
  };
}
