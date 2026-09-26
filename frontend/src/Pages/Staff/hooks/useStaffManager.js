import { useState, useEffect, useCallback } from 'react';
import API from '../../../services/api';
import { isValidBDPhone } from '../../../utils/phoneUtils';

const INITIAL_FORM = {
  name: '',
  phone: '',
  email: '',
  password: '',
  role: 'STAFF', // 'ADMIN' | 'STAFF' | 'TECHNICIAN'
  role_id: 3,
  designation: 'Staff Member',
  salary: '',
  wallet_balance: '',
  address: '',
  emergency_contact: '',
  joining_date: new Date().toISOString().split('T')[0],
  is_active: true,
  notes: ''
};

export default function useStaffManager() {
  const [staffList, setStaffList] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [stats, setStats] = useState({
    totalStaff: 0,
    activeStaff: 0,
    inactiveStaff: 0,
    adminCount: 0,
    techCount: 0,
    totalMonthlyPayroll: 0
  });

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingStaff, setDeletingStaff] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  }, []);

  // Fetch roles
  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch(`${API}/staff/roles`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setRoles(json.data);
        }
      }
    } catch (err) {
      console.warn('Could not load roles:', err.message);
    }
  }, []);

  // Fetch staff list
  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedRole && selectedRole !== 'all') params.append('role_id', selectedRole);
      if (selectedStatus && selectedStatus !== 'all') params.append('status', selectedStatus);

      const url = `${API}/staff?${params.toString()}`;
      const res = await fetch(url);
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

  // Open Add Modal
  const openCreateModal = () => {
    setFormData({
      ...INITIAL_FORM,
      role: 'STAFF',
      role_id: roles.find(r => r.name.toLowerCase() === 'staff')?.id || roles[0]?.id || 3
    });
    setFormErrors({});
    setModalMode('create');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (staff) => {
    setFormData({
      id: staff.id,
      name: staff.name || '',
      phone: staff.phone || '',
      email: staff.email || '',
      password: '',
      role: staff.role || (staff.role_name?.toLowerCase().includes('admin') ? 'ADMIN' : staff.role_name?.toLowerCase().includes('tech') ? 'TECHNICIAN' : 'STAFF'),
      role_id: staff.role_id || 3,
      designation: staff.designation || '',
      salary: staff.salary ? String(staff.salary) : '',
      wallet_balance: staff.wallet_balance !== undefined && staff.wallet_balance !== null ? String(staff.wallet_balance) : '0',
      address: staff.address || '',
      emergency_contact: staff.emergency_contact || '',
      joining_date: staff.joining_date ? new Date(staff.joining_date).toISOString().split('T')[0] : '',
      is_active: Boolean(staff.is_active),
      notes: staff.notes || ''
    });
    setFormErrors({});
    setModalMode('edit');
    setIsModalOpen(true);
  };

  // Open Details Modal
  const openDetailsModal = (staff) => {
    setSelectedStaff(staff);
    setIsDetailsOpen(true);
  };

  // Open Delete Modal
  const openDeleteModal = (staff) => {
    setDeletingStaff(staff);
    setIsDeleteOpen(true);
  };

  // Handle Form Submit
  const handleSaveStaff = async (e) => {
    if (e) e.preventDefault();
    const errors = {};

    if (!formData.name || !formData.name.trim()) {
      errors.name = 'Staff name is required';
    }
    if (!formData.phone && !formData.email) {
      errors.contact = 'At least a phone number or email is required';
    }
    if (formData.phone && !isValidBDPhone(formData.phone)) {
      errors.contact = 'Please enter a valid 10-digit phone number after +880 (e.g. 17-XXXXXXXX)';
    }
    if (modalMode === 'create' && (!formData.password || formData.password.trim().length < 4)) {
      errors.password = 'Password must be at least 4 characters long';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSaving(true);
      const isEdit = modalMode === 'edit';
      const url = isEdit ? `${API}/staff/${formData.id}` : `${API}/staff`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast(json.message || `Staff member ${isEdit ? 'updated' : 'created'} successfully!`);
        setIsModalOpen(false);
        fetchStaff();
      } else {
        showToast(json.message || 'Failed to save staff member', 'error');
        if (json.message) {
          setFormErrors({ submit: json.message });
        }
      }
    } catch (err) {
      console.error('Error saving staff:', err);
      showToast('Error saving staff member: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Quick Toggle Active Status
  const handleToggleStatus = async (staff) => {
    if (staff.id === 1) {
      showToast('Primary Super Admin cannot be deactivated', 'error');
      return;
    }

    const newStatus = !staff.is_active;
    try {
      const res = await fetch(`${API}/staff/${staff.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(json.message || 'Status updated');
        setStaffList(prev => prev.map(s => s.id === staff.id ? { ...s, is_active: newStatus } : s));
        fetchStaff();
      } else {
        showToast(json.message || 'Failed to update status', 'error');
      }
    } catch (err) {
      showToast('Network error updating status', 'error');
    }
  };

  // Confirm Delete
  const handleDeleteStaff = async () => {
    if (!deletingStaff) return;
    try {
      setDeleting(true);
      const res = await fetch(`${API}/staff/${deletingStaff.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(json.message || 'Staff member deleted successfully');
        setIsDeleteOpen(false);
        setDeletingStaff(null);
        fetchStaff();
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
    staffList,
    roles,
    loading,
    saving,
    search,
    setSearch,
    selectedRole,
    setSelectedRole,
    selectedStatus,
    setSelectedStatus,
    viewMode,
    setViewMode,
    stats,
    isModalOpen,
    setIsModalOpen,
    modalMode,
    formData,
    setFormData,
    formErrors,
    setFormErrors,
    isDetailsOpen,
    setIsDetailsOpen,
    selectedStaff,
    isDeleteOpen,
    setIsDeleteOpen,
    deletingStaff,
    deleting,
    toast,
    showToast,
    openCreateModal,
    openEditModal,
    openDetailsModal,
    openDeleteModal,
    handleSaveStaff,
    handleToggleStatus,
    handleDeleteStaff,
    refreshStaff: fetchStaff
  };
}
