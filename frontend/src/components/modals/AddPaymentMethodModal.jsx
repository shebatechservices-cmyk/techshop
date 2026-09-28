import React, { useState, useEffect } from 'react';
import API, { smartFetch } from '../../services/api';
import PaymentMethodForm from './payment-methods/PaymentMethodForm';
import PaymentMethodList from './payment-methods/PaymentMethodList';

export default function AddPaymentMethodModal({ isOpen, onClose, onSuccess }) {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('add'); // 'add' | 'list' | 'edit'

  const [formData, setFormData] = useState({
    name: '',
    type: 'cash',
    account_number: '',
    account_details: '',
    is_active: true,
  });

  const [editingMethod, setEditingMethod] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('sheba_auth_token') || sessionStorage.getItem('sheba_auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  };

  const fetchMethods = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/accounts/payment-methods`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMethods(data.data || []);
      }
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
      setFormData({
        name: '',
        type: 'cash',
        account_number: '',
        account_details: '',
        is_active: true,
      });
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
      const url = isEdit
        ? `${API}/accounts/payment-methods/${editingMethod.id}`
        : `${API}/accounts/payment-methods`;
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

        if (isEdit) {
          setTimeout(() => {
            setActiveTab('list');
            setEditingMethod(null);
          }, 600);
        } else {
          setTimeout(() => {
            onClose();
          }, 700);
        }
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
        setMethods((prev) =>
          prev.map((pm) => (pm.id === id ? { ...pm, is_active: !currentStatus } : pm))
        );
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

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '16px',
        boxSizing: 'border-box',
      }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        style={{ position: 'relative', zIndex: 10001 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-lg font-bold shadow-xs">
              💳
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 m-0">Payment Methods</h3>
              <p className="text-xs text-slate-500 m-0">Create and configure payment channels</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none p-1 transition cursor-pointer"
            title="Close Modal (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Tab switch inside modal */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 px-6 pt-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('add');
              setEditingMethod(null);
            }}
            className={`pb-2 px-3 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'add'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ➕ Add New Method
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`pb-2 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'list'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📋 Existing Methods</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">
              {methods.length}
            </span>
          </button>
          {activeTab === 'edit' && editingMethod && (
            <button
              type="button"
              className="pb-2 px-3 text-xs sm:text-sm font-bold border-b-2 border-amber-600 text-amber-700 flex items-center gap-1.5"
            >
              <span>✏️ Edit: {editingMethod.name || editingMethod.method_name}</span>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError('')}
                className="text-red-500 hover:text-red-700 font-bold ml-2 text-xs"
              >
                ✕
              </button>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>✅</span>
                <span>{successMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMsg('')}
                className="text-emerald-600 hover:text-emerald-800 font-bold ml-2 text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {activeTab === 'add' || activeTab === 'edit' ? (
            <PaymentMethodForm
              formData={formData}
              setFormData={setFormData}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              submitting={submitting}
              onClose={onClose}
              onSubmit={handleSubmit}
            />
          ) : (
            <PaymentMethodList
              methods={methods}
              loading={loading}
              onToggleActive={handleToggleActive}
              onStartEdit={handleStartEdit}
              onDeleteMethod={handleDeleteMethod}
              onAddNew={() => {
                setActiveTab('add');
                setEditingMethod(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
