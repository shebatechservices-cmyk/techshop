import { useState, useCallback } from 'react';
import API from '../../../../services/api';

export function useSecurityStaffApprovals({ showToast, loadAllData }) {
  const [staffSubTab, setStaffSubTab] = useState('accounts');
  const [staffRecoveryRequests, setStaffRecoveryRequests] = useState([]);
  const [resolvingStaffReqId, setResolvingStaffReqId] = useState(null);
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [staffResolutionNotes, setStaffResolutionNotes] = useState('Reset by App Admin');
  const [staffRecoveryLoading, setStaffRecoveryLoading] = useState(false);

  const [pendingStaffList, setPendingStaffList] = useState([]);
  const [loadingPendingStaff, setLoadingPendingStaff] = useState(false);
  const [processingStaffId, setProcessingStaffId] = useState(null);

  const fetchPendingStaff = useCallback(async () => {
    try {
      setLoadingPendingStaff(true);
      const res = await fetch(`${API}/security/pending-staff`);
      if (res && res.ok) {
        const d = await res.json();
        if (d && d.success) setPendingStaffList(d.data || []);
      }
    } catch (err) {
      console.error('Error loading pending staff:', err);
    } finally {
      setLoadingPendingStaff(false);
    }
  }, []);

  const loadStaffRecovery = useCallback(async () => {
    try {
      const res = await fetch(`${API}/security/recovery-requests`);
      if (res && res.ok) {
        const d = await res.json();
        if (d.success) setStaffRecoveryRequests(d.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleApproveOrRejectStaff = async (userId, action) => {
    try {
      setProcessingStaffId(userId);
      const res = await fetch(`${API}/security/approve-staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      const d = await res.json();
      if (res && res.ok && d.success) {
        showToast(d.message);
        fetchPendingStaff();
        if (loadAllData) loadAllData();
      } else {
        showToast((d && d.message) || 'Action failed');
      }
    } catch (err) {
      showToast('Network error processing staff approval');
    } finally {
      setProcessingStaffId(null);
    }
  };

  const generate3TypeStaffPassword = () => {
    const prefixes = ['Staff@', 'User#', 'Secure$', 'Tech!', 'Key*'];
    const randPre = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randNum = Math.floor(1000 + Math.random() * 9000);
    return `${randPre}${randNum}!`;
  };

  const handleResolveStaffRecovery = async (requestId) => {
    if (!newStaffPassword) {
      showToast('Please enter or generate a new password!');
      return;
    }
    try {
      setStaffRecoveryLoading(true);
      const res = await fetch(`${API}/security/recovery-resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          newPassword: newStaffPassword,
          adminNotes: staffResolutionNotes,
        }),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        showToast(`✓ Staff password reset to: ${newStaffPassword}`);
        setResolvingStaffReqId(null);
        setNewStaffPassword('');
        loadStaffRecovery();
        if (loadAllData) loadAllData();
      } else {
        showToast(d.message || 'Failed to reset staff password');
      }
    } catch (err) {
      showToast('Network error resetting staff password');
    } finally {
      setStaffRecoveryLoading(false);
    }
  };

  return {
    staffSubTab,
    setStaffSubTab,
    staffRecoveryRequests,
    setStaffRecoveryRequests,
    resolvingStaffReqId,
    setResolvingStaffReqId,
    newStaffPassword,
    setNewStaffPassword,
    staffResolutionNotes,
    setStaffResolutionNotes,
    staffRecoveryLoading,
    setStaffRecoveryLoading,
    pendingStaffList,
    setPendingStaffList,
    loadingPendingStaff,
    setLoadingPendingStaff,
    processingStaffId,
    setProcessingStaffId,
    fetchPendingStaff,
    loadStaffRecovery,
    handleApproveOrRejectStaff,
    generate3TypeStaffPassword,
    handleResolveStaffRecovery,
  };
}
