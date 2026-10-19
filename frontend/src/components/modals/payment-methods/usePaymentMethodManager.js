import { useState, useEffect } from 'react';
import API from '../../../services/api';

const INITIAL_FORM = {
  name: '',
  type: 'cash',
  account_number: '',
  account_details: '',
  is_active: true,
};

export default function usePaymentMethodManager({ isOpen, onClose, onSuccess }) {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('add'); // 'add' | 'list' | 'edit'
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editingMethod, setEditingMethod] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('sheba_auth_token') || sessionStorage.getItem('sheba_auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchMethods = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/accounts/payment-methods`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.success) setMethods(data.data || []);
    } catch (err) {
      console.error('fetchMethods error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccessMsg('');
      setActiveTab('add');
      setEditingMethod(null);
      setFormData(INITIAL_FORM);
      fetchMethods();

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Please provide a payment method name.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const isEdit = activeTab === 'edit' && editingMethod;
      const url = isEdit ? `${API}/accounts/payment-methods/${editingMethod.id}` : `${API}/accounts/payment-methods`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: formData.name.trim(),
          type: formData.type,
          account_number: formData.account_number.trim(),
          account_details: formData.account_details.trim(),
          is_active: formData.is_active,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(isEdit ? 'Payment method updated successfully!' : 'Payment method created successfully!');
        if (onSuccess) onSuccess(data.data);
        fetchMethods();

        setTimeout(() => {
          if (isEdit) {
            setActiveTab('list');
            setEditingMethod(null);
          } else {
            onClose();
          }
        }, isEdit ? 600 : 700);
      } else {
        setError(data.message || data.error || 'Failed to save payment method');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with server');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const res = await fetch(`${API}/accounts/payment-methods/${id}/toggle`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMethods((prev) => prev.map((pm) => (pm.id === id ? { ...pm, is_active: !currentStatus } : pm)));
        if (onSuccess) onSuccess();
      } else {
        setError(data.message || 'Failed to toggle status');
      }
    } catch (err) {
      setError(err.message || 'Error updating status');
    }
  };

  const handleStartEdit = (m) => {
    setEditingMethod(m);
    setFormData({
      name: m.name || m.method_name || '',
      type: m.type || 'cash',
      account_number: m.account_number || '',
      account_details: m.account_details || '',
      is_active: m.is_active !== undefined ? m.is_active : true,
    });
    setError('');
    setSuccessMsg('');
    setActiveTab('edit');
  };

  const handleDeleteMethod = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate/delete payment method "${name}"?`)) return;
    try {
      const res = await fetch(`${API}/accounts/payment-methods/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMethods((prev) => prev.filter((pm) => pm.id !== id));
        setSuccessMsg(`Payment method "${name}" removed successfully.`);
        if (onSuccess) onSuccess();
      } else {
        setError(data.message || 'Failed to delete payment method');
      }
    } catch (err) {
      setError(err.message || 'Error deleting payment method');
    }
  };

  return {
    methods,
    loading,
    submitting,
    error,
    setError,
    successMsg,
    setSuccessMsg,
    activeTab,
    setActiveTab,
    formData,
    setFormData,
    editingMethod,
    setEditingMethod,
    handleSubmit,
    handleToggleActive,
    handleStartEdit,
    handleDeleteMethod,
  };
}
