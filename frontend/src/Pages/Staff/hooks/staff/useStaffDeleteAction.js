import { useState } from 'react';
import API, { getAuthHeaders } from '../../../../services/api';

export default function useStaffDeleteAction({ showToast, setStaffList, refreshStaff }) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingStaff, setDeletingStaff] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const openDeleteModal = (staff) => {
    setDeletingStaff(staff);
    setIsDeleteOpen(true);
  };

  const handleToggleStatus = async (staff) => {
    if (staff.id === 1) {
      showToast('Primary Super Admin cannot be deactivated', 'error');
      return;
    }

    const newStatus = !staff.is_active;
    try {
      const res = await fetch(`${API}/staff/${staff.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ is_active: newStatus }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(json.message || 'Status updated');
        setStaffList((prev) => prev.map((s) => (s.id === staff.id ? { ...s, is_active: newStatus } : s)));
        refreshStaff();
      } else {
        showToast(json.message || 'Failed to update status', 'error');
      }
    } catch (err) {
      showToast('Network error updating status', 'error');
    }
  };

  const handleDeleteStaff = async () => {
    if (!deletingStaff) return;
    try {
      setDeleting(true);
      const res = await fetch(`${API}/staff/${deletingStaff.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(json.message || 'Staff member deleted successfully');
        setIsDeleteOpen(false);
        setDeletingStaff(null);
        refreshStaff();
      } else {
        showToast(json.message || 'Failed to delete staff member', 'error');
      }
    } catch (err) {
      showToast('Network error while deleting staff member', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return {
    isDeleteOpen,
    setIsDeleteOpen,
    deletingStaff,
    deleting,
    openDeleteModal,
    handleToggleStatus,
    handleDeleteStaff,
  };
}
