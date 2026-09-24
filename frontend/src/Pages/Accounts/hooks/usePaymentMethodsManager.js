import { useState, useEffect } from 'react';
import API from '../../../services/api';

export const getTypeBadge = (type) => {
  switch (String(type || '').toLowerCase()) {
    case 'cash':
      return { label: '💵 Cash', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'mobile_banking':
    case 'mfs':
      return { label: '📱 Mobile Banking (MFS)', bg: '#fdf2f8', color: '#db2777', border: '#fbcfe8', badgeClass: 'bg-pink-50 text-pink-700 border-pink-200' };
    case 'bank':
      return { label: '🏦 Bank Account', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'wallet':
      return { label: '👛 Digital Wallet', bg: '#faf5ff', color: '#9333ea', border: '#e9d5ff', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'card':
      return { label: '💳 Credit/Debit Card', bg: '#fefce8', color: '#ca8a04', border: '#fef08a', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' };
    default:
      return { label: '🏷️ Other', bg: '#f8fafc', color: '#475569', border: '#e2e8f0', badgeClass: 'bg-slate-50 text-slate-700 border-slate-200' };
  }
};

export default function usePaymentMethodsManager() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'cash',
    account_number: '',
    account_details: '',
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Delete / Deactivate Confirmation Modal state
  const [deactivateModal, setDeactivateModal] = useState({
    isOpen: false,
    method: null,
    loading: false,
  });

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API}/accounts/payment-methods`);
      const data = await res.json();
      if (res.ok && data.success) {
        setPaymentMethods(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch payment methods');
      }
    } catch (err) {
      setError(err.message || 'Network error fetching payment methods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const showNotification = (msg, isErr = false) => {
    if (isErr) {
      setError(msg);
      setTimeout(() => setError(''), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleOpenAdd = () => {
    setModalMode('add');
    setSelectedMethod(null);
    setFormData({
      name: '',
      type: 'cash',
      account_number: '',
      account_details: '',
      is_active: true,
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (method) => {
    setModalMode('edit');
    setSelectedMethod(method);
    setFormData({
      name: method.name || method.method_name || '',
      type: method.type || 'cash',
      account_number: method.account_number || '',
      account_details: method.account_details || '',
      is_active: method.is_active !== undefined ? Boolean(method.is_active) : true,
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSubmitModal = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!formData.name.trim()) {
      setModalError('Payment method name is required');
      return;
    }

    try {
      setSubmitting(true);
      setModalError('');
      const url = modalMode === 'add'
        ? `${API}/accounts/payment-methods`
        : `${API}/accounts/payment-methods/${selectedMethod.id}`;
      const method = modalMode === 'add' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsModalOpen(false);
        showNotification(modalMode === 'add' ? 'Payment method added successfully' : 'Payment method updated successfully');
        fetchPaymentMethods();
      } else {
        setModalError(data.message || 'Operation failed');
      }
    } catch (err) {
      setModalError(err.message || 'Error processing request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const res = await fetch(`${API}/accounts/payment-methods/${id}/toggle`, {
        method: 'PUT',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPaymentMethods((prev) =>
          prev.map((pm) => (pm.id === id ? { ...pm, is_active: !currentStatus } : pm))
        );
        showNotification(`Payment method ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      } else {
        showNotification(data.message || 'Failed to toggle status', true);
      }
    } catch (err) {
      showNotification(err.message || 'Error toggling payment method', true);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivateModal.method) return;
    try {
      setDeactivateModal((prev) => ({ ...prev, loading: true }));
      const res = await fetch(`${API}/accounts/payment-methods/${deactivateModal.method.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDeactivateModal({ isOpen: false, method: null, loading: false });
        showNotification('Payment method soft-deactivated successfully');
        fetchPaymentMethods();
      } else {
        showNotification(data.message || 'Failed to deactivate payment method', true);
        setDeactivateModal((prev) => ({ ...prev, loading: false }));
      }
    } catch (err) {
      showNotification(err.message || 'Error deactivating payment method', true);
      setDeactivateModal((prev) => ({ ...prev, loading: false }));
    }
  };

  return {
    paymentMethods,
    setPaymentMethods,
    loading,
    error,
    successMsg,
    isModalOpen,
    setIsModalOpen,
    modalMode,
    selectedMethod,
    formData,
    setFormData,
    submitting,
    modalError,
    deactivateModal,
    setDeactivateModal,
    fetchPaymentMethods,
    showNotification,
    handleOpenAdd,
    handleOpenEdit,
    handleSubmitModal,
    handleToggleActive,
    handleConfirmDeactivate,
    getTypeBadge,
  };
}
