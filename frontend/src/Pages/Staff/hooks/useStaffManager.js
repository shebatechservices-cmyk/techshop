import { useState, useEffect, useCallback } from 'react';
import API, { getAuthHeaders } from '../../../services/api';
import useStaffFormModal from './staff/useStaffFormModal';
import useStaffDeleteAction from './staff/useStaffDeleteAction';

export default function useStaffManager() {
  const [staffList, setStaffList] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState('table');
  const [stats, setStats] = useState({
    totalStaff: 0,
    activeStaff: 0,
    inactiveStaff: 0,
    adminCount: 0,
    techCount: 0,
    totalMonthlyPayroll: 0,
  });

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch(`${API}/staff/roles`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) setRoles(json.data);
      }
    } catch (err) {
      console.warn('Could not load roles:', err.message);
    }
  }, []);

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedRole && selectedRole !== 'all') params.append('role_id', selectedRole);
      if (selectedStatus && selectedStatus !== 'all') params.append('status', selectedStatus);

      const url = `${API}/staff?${params.toString()}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setStaffList(json.data || []);
          if (json.stats) setStats(json.stats);
        }
      } else {
        showToast('Failed to fetch staff members', 'error');
      }
    } catch (err) {
      console.error('Error fetching staff:', err);
      showToast('Network error while loading staff', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, selectedRole, selectedStatus, showToast]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStaff();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchStaff]);

  const openDetailsModal = (staff) => {
    setSelectedStaff(staff);
    setIsDetailsOpen(true);
  };

  const formModal = useStaffFormModal({
    roles,
    showToast,
    refreshStaff: fetchStaff,
  });

  const deleteAction = useStaffDeleteAction({
    showToast,
    setStaffList,
    refreshStaff: fetchStaff,
  });

  return {
    staffList,
    roles,
    loading,
    saving: formModal.saving,
    search,
    setSearch,
    selectedRole,
    setSelectedRole,
    selectedStatus,
    setSelectedStatus,
    viewMode,
    setViewMode,
    stats,
    isModalOpen: formModal.isModalOpen,
    setIsModalOpen: formModal.setIsModalOpen,
    modalMode: formModal.modalMode,
    formData: formModal.formData,
    setFormData: formModal.setFormData,
    formErrors: formModal.formErrors,
    setFormErrors: formModal.setFormErrors,
    isDetailsOpen,
    setIsDetailsOpen,
    selectedStaff,
    isDeleteOpen: deleteAction.isDeleteOpen,
    setIsDeleteOpen: deleteAction.setIsDeleteOpen,
    deletingStaff: deleteAction.deletingStaff,
    deleting: deleteAction.deleting,
    toast,
    showToast,
    openCreateModal: formModal.openCreateModal,
    openEditModal: formModal.openEditModal,
    openDetailsModal,
    openDeleteModal: deleteAction.openDeleteModal,
    handleSaveStaff: formModal.handleSaveStaff,
    handleToggleStatus: deleteAction.handleToggleStatus,
    handleDeleteStaff: deleteAction.handleDeleteStaff,
    refreshStaff: fetchStaff,
  };
}
