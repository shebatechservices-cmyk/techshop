import { useState } from 'react';
import API from '../../../../services/api';
import { isValidBDPhone } from '../../../../utils/phoneUtils';

export function useSecurityStaffCrud({ users, setUsers, showToast }) {
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
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

  const [editingStaff, setEditingStaff] = useState(null);
  const [staffToDelete, setStaffToDelete] = useState(null);

  const handleToggleUserLock = async (user) => {
    try {
      const newLocked = !user.is_locked;
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

  return {
    isAddStaffOpen,
    setIsAddStaffOpen,
    newStaff,
    setNewStaff,
    editingStaff,
    setEditingStaff,
    staffToDelete,
    setStaffToDelete,
    handleToggleUserLock,
    handleCreateStaff,
    handleOpenEditStaff,
    handleUpdateStaffSubmit,
    handleConfirmDeleteStaff,
  };
}
