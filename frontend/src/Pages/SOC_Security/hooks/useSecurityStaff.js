import { useState, useMemo, useCallback } from 'react';
import API from '../../../services/api';
import { isValidBDPhone } from '../../../utils/phoneUtils';
import { DEFAULT_USERS } from '../utils/securityConstants';

export function useSecurityStaff({ showToast, loadAllData }) {
  const [users, setUsers] = useState(DEFAULT_USERS);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState('all');
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [staffSubTab, setStaffSubTab] = useState('accounts'); // 'accounts' | 'recovery' | 'approvals'
  const [staffRecoveryRequests, setStaffRecoveryRequests] = useState([]);
  const [resolvingStaffReqId, setResolvingStaffReqId] = useState(null);
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [staffResolutionNotes, setStaffResolutionNotes] = useState('Reset by App Admin');
  const [staffRecoveryLoading, setStaffRecoveryLoading] = useState(false);

  // Staff Self-Registration Approval State
  const [pendingStaffList, setPendingStaffList] = useState([]);
  const [loadingPendingStaff, setLoadingPendingStaff] = useState(false);
  const [processingStaffId, setProcessingStaffId] = useState(null);

  const [newStaff, setNewStaff] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    role_name: 'Field Technician',
    role_id: 4,
    device_id: '',
    allowed_ip: 'Any IP',
    opening_wallet_balance: '',
  });

  // Edit & Delete Staff / Technician states
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffToDelete, setStaffToDelete] = useState(null);

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
    const suffix = '!';
    return `${randPre}${randNum}${suffix}`;
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

  // Staff Account Lock/Unlock Toggle
  const handleToggleUserLock = async (user) => {
    try {
      const newLocked = !user.is_locked;
      // Optimistic update
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, is_locked: newLocked, failed_login_count: newLocked ? u.failed_login_count : 0 }
            : u
        )
      );
      showToast(`User ${user.name} is now ${newLocked ? '🔒 LOCKED' : '🔓 UNLOCKED'}`);
      await fetch(`${API}/security/users/${user.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_locked: newLocked }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Create Staff / Technician
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (newStaff.phone && !isValidBDPhone(newStaff.phone)) {
      showToast('Please enter a valid 10-digit phone number after +880 (e.g. 17-XXXXXXXX)');
      return;
    }
    try {
      const optimisticId = Date.now();
      const createdUser = {
        id: optimisticId,
        ...newStaff,
        is_locked: false,
        failed_login_count: 0,
      };
      setUsers((prev) => [createdUser, ...prev]);
      showToast(`Staff / Technician ${newStaff.name} registered successfully!`);
      setIsAddStaffOpen(false);
      const payload = { ...newStaff };
      setNewStaff({
        name: '',
        phone: '',
        email: '',
        password: '',
        role_name: 'Field Technician',
        role_id: 4,
        device_id: '',
        allowed_ip: 'Any IP',
        opening_wallet_balance: '',
      });

      await fetch(`${API}/security/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Edit Staff / Technician
  const handleOpenEditStaff = (u) => {
    setEditingStaff({
      id: u.id,
      name: u.name || '',
      phone: u.phone || '',
      email: u.email || '',
      password: '',
      role_name: u.role_name || 'Field Technician',
      role_id: u.role_id || 4,
      device_id: u.device_id || '',
      allowed_ip: u.allowed_ip || 'Any IP',
    });
  };

  const handleUpdateStaffSubmit = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    if (editingStaff.phone && !isValidBDPhone(editingStaff.phone)) {
      showToast('Please enter a valid 10-digit phone number after +880 (e.g. 17-XXXXXXXX)');
      return;
    }
    try {
      setUsers((prev) =>
        prev.map((u) => (u.id === editingStaff.id ? { ...u, ...editingStaff } : u))
      );
      showToast(`Staff member ${editingStaff.name} updated successfully!`);
      const payload = { ...editingStaff };
      const staffId = editingStaff.id;
      setEditingStaff(null);

      await fetch(`${API}/security/users/${staffId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Staff / Technician
  const handleConfirmDeleteStaff = async () => {
    if (!staffToDelete) return;
    try {
      const u = staffToDelete;
      setUsers((prev) => prev.filter((item) => item.id !== u.id));
      showToast(`Staff member "${u.name}" moved to Trash.`);
      setStaffToDelete(null);

      await fetch(`${API}/security/users/${u.id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (staffRoleFilter !== 'all') {
        if ((u.role_name || '').toLowerCase() !== staffRoleFilter.toLowerCase()) return false;
      }
      if (staffSearch.trim()) {
        const q = staffSearch.toLowerCase();
        const matchName = String(u.name || '').toLowerCase().includes(q);
        const matchPhone = String(u.phone || '').toLowerCase().includes(q);
        const matchDev = String(u.device_id || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchDev) return false;
      }
      return true;
    });
  }, [users, staffRoleFilter, staffSearch]);

  return {
    users,
    setUsers,
    staffSearch,
    setStaffSearch,
    staffRoleFilter,
    setStaffRoleFilter,
    isAddStaffOpen,
    setIsAddStaffOpen,
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
    newStaff,
    setNewStaff,
    editingStaff,
    setEditingStaff,
    staffToDelete,
    setStaffToDelete,
    filteredUsers,
    fetchPendingStaff,
    handleApproveOrRejectStaff,
    generate3TypeStaffPassword,
    loadStaffRecovery,
    handleResolveStaffRecovery,
    handleToggleUserLock,
    handleCreateStaff,
    handleOpenEditStaff,
    handleUpdateStaffSubmit,
    handleConfirmDeleteStaff,
  };
}
