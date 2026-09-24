import React, { useState, useEffect } from 'react';
import API from '../../services/api';

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

  const getTypeBadge = (type) => {
    const t = String(type || '').toLowerCase();
    if (t.includes('cash')) return { label: '💵 Cash', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (t.includes('mobile') || t.includes('mfs')) return { label: '📱 MFS / Mobile', color: 'bg-purple-50 text-purple-700 border-purple-200' };
    if (t.includes('bank')) return { label: '🏦 Bank', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (t.includes('card')) return { label: '💳 Card', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (t.includes('wallet')) return { label: '👛 Wallet', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    return { label: '🏷️ Other', color: 'bg-slate-50 text-slate-700 border-slate-200' };
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
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Method Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Method Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. bKash Merchant, Cash Counter 1, DBBL City"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Method Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 bg-white transition cursor-pointer"
                >
                  <option value="cash">💵 Cash</option>
                  <option value="mobile_banking">📱 Mobile Banking (MFS)</option>
                  <option value="bank">🏦 Bank Account</option>
                  <option value="card">💳 Credit / Debit Card</option>
                  <option value="wallet">👛 Digital Wallet</option>
                  <option value="other">🏷️ Other</option>
                </select>
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Account / Mobile / Reference Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 01700-000000 or A/C 205.120.450"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition font-mono"
                />
              </div>

              {/* Account Details / Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Primary merchant wallet used for retail payments"
                  value={formData.account_details}
                  onChange={(e) => setFormData({ ...formData, account_details: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
                />
              </div>

              {/* Is Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pm_is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="pm_is_active" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Active for checkout and invoice transactions
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={activeTab === 'edit' ? () => setActiveTab('list') : onClose}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 font-medium text-sm text-slate-700 transition cursor-pointer"
                >
                  {activeTab === 'edit' ? 'Cancel Edit' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm font-medium text-sm transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  {submitting
                    ? 'Saving...'
                    : activeTab === 'edit'
                    ? '✓ Update Payment Method'
                    : '+ Create Payment Method'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-slate-400 text-xs flex flex-col items-center gap-2">
                  <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading payment methods...</span>
                </div>
              ) : methods.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <p className="text-sm font-semibold text-slate-600 mb-1">No payment methods found.</p>
                  <p>Click "➕ Add New Method" tab to create one.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {methods.map((m) => {
                    const badge = getTypeBadge(m.type);
                    return (
                      <div
                        key={m.id}
                        className="p-3.5 bg-white flex items-center justify-between gap-3 hover:bg-slate-50/80 transition"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-800 truncate">
                              {m.name || m.method_name}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${badge.color}`}
                            >
                              {badge.label}
                            </span>
                          </div>
                          {m.account_number && (
                            <div className="text-xs text-slate-500 font-mono mt-1">
                              💳 {m.account_number}
                            </div>
                          )}
                          {m.account_details && (
                            <div className="text-[11px] text-slate-400 truncate mt-0.5">
                              {m.account_details}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Active Toggle Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleActive(m.id, m.is_active)}
                            className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                              m.is_active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                            }`}
                            title={m.is_active ? 'Click to deactivate' : 'Click to activate'}
                          >
                            {m.is_active ? '● Active' : '○ Inactive'}
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleStartEdit(m)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-xs font-semibold transition cursor-pointer"
                            title="Edit details"
                          >
                            ✏️
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteMethod(m.id, m.name || m.method_name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-xs font-semibold transition cursor-pointer"
                            title="Delete / Deactivate"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
