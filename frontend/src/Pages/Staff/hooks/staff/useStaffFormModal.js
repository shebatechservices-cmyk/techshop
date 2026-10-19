import { useState } from 'react';
import API, { getAuthHeaders } from '../../../../services/api';
import { isValidBDPhone } from '../../../../utils/phoneUtils';

export const INITIAL_STAFF_FORM = {
  name: '',
  phone: '',
  email: '',
  password: '',
  role: 'STAFF',
  role_id: 3,
  designation: 'Staff Member',
  salary: '',
  wallet_balance: '',
  address: '',
  emergency_contact: '',
  joining_date: new Date().toISOString().split('T')[0],
  is_active: true,
  notes: '',
};

export default function useStaffFormModal({ roles, showToast, refreshStaff }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [formData, setFormData] = useState(INITIAL_STAFF_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const openCreateModal = () => {
    setFormData({
      ...INITIAL_STAFF_FORM,
      role: 'STAFF',
      role_id: roles.find((r) => r.name.toLowerCase() === 'staff')?.id || roles[0]?.id || 3,
    });
    setFormErrors({});
    setModalMode('create');
    setIsModalOpen(true);
  };

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
      notes: staff.notes || '',
    });
    setFormErrors({});
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleSaveStaff = async (e) => {
    if (e) e.preventDefault();
    const errors = {};

    if (!formData.name || !formData.name.trim()) errors.name = 'Staff name is required';
    if (!formData.phone && !formData.email) errors.contact = 'At least a phone number or email is required';
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
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast(json.message || `Staff member ${isEdit ? 'updated' : 'created'} successfully!`);
        setIsModalOpen(false);
        refreshStaff();
      } else {
        showToast(json.message || 'Failed to save staff member', 'error');
        if (json.message) setFormErrors({ submit: json.message });
      }
    } catch (err) {
      console.error('Error saving staff:', err);
      showToast('Error saving staff member: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return {
    isModalOpen,
    setIsModalOpen,
    modalMode,
    formData,
    setFormData,
    formErrors,
    setFormErrors,
    saving,
    openCreateModal,
    openEditModal,
    handleSaveStaff,
  };
}
