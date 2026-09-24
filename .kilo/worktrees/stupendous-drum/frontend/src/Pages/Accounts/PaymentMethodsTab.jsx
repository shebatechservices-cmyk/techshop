import React, { useState, useEffect } from 'react';
import API from '../../services/api';

export default function PaymentMethodsTab() {
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
    e.preventDefault();
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

  const getTypeBadge = (type) => {
    switch (String(type || '').toLowerCase()) {
      case 'cash':
        return { label: '💵 Cash', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' };
      case 'mobile_banking':
      case 'mfs':
        return { label: '📱 Mobile Banking (MFS)', bg: '#fdf2f8', color: '#db2777', border: '#fbcfe8' };
      case 'bank':
        return { label: '🏦 Bank Account', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
      case 'wallet':
        return { label: '👛 Digital Wallet', bg: '#faf5ff', color: '#9333ea', border: '#e9d5ff' };
      case 'card':
        return { label: '💳 Credit/Debit Card', bg: '#fefce8', color: '#ca8a04', border: '#fef08a' };
      default:
        return { label: '🏷️ Other', bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
    }
  };

  return (
    <div style={{ padding: '4px 0' }}>
      {/* Notifications */}
      {error && (
        <div style={{ marginBottom: '16px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '0.85rem', fontWeight: 600 }}>
          ⚠️ {error}
        </div>
      )}
      {successMsg && (
        <div style={{ marginBottom: '16px', padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#16a34a', fontSize: '0.85rem', fontWeight: 600 }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>💳 Centralized Payment Methods</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: '#dbeafe', color: '#1d4ed8' }}>
              {paymentMethods.length} Methods
            </span>
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
            Manage database-driven payment methods for POS Sales, Purchase Orders, and Accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '0.84rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)',
          }}
        >
          <span>＋</span> Add Payment Method
        </button>
      </div>

      {/* Payment Methods Table */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
            Loading payment methods...
          </div>
        ) : paymentMethods.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem' }}>
            No payment methods found. Click "+ Add Payment Method" to create one.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '10px 14px', width: '50px', fontWeight: 700 }}>ID</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Payment Method</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Type</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Account / Phone No</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Details / Notes</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, width: '110px' }}>Active Status</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, width: '130px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paymentMethods.map((pm, idx) => {
                  const badge = getTypeBadge(pm.type);
                  const isActive = pm.is_active ?? true;
                  return (
                    <tr
                      key={pm.id}
                      style={{
                        borderBottom: idx < paymentMethods.length - 1 ? '1px solid #f1f5f9' : 'none',
                        background: isActive ? '#ffffff' : '#f8fafc',
                        opacity: isActive ? 1 : 0.75,
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#64748b' }}>
                        #{pm.id}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{pm.name || pm.method_name}</span>
                          {!isActive && (
                            <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: '#fee2e2', color: '#b91c1c', fontWeight: 700 }}>
                              Disabled
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#334155', fontFamily: pm.account_number ? 'monospace' : 'inherit' }}>
                        {pm.account_number || '—'}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '0.78rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {pm.account_details || '—'}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(pm.id, isActive)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            border: 'none',
                            background: isActive ? '#dcfce7' : '#f1f5f9',
                            color: isActive ? '#15803d' : '#64748b',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease',
                          }}
                          title={isActive ? 'Click to deactivate' : 'Click to activate'}
                        >
                          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: isActive ? '#16a34a' : '#94a3b8' }} />
                          {isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(pm)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '1px solid #cbd5e1',
                              background: '#ffffff',
                              color: '#2563eb',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                            title="Edit Payment Method"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeactivateModal({ isOpen: true, method: pm, loading: false })}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '1px solid #fecaca',
                              background: '#fff1f2',
                              color: '#dc2626',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                            title="Soft Delete / Deactivate"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                {modalMode === 'add' ? '➕ Add New Payment Method' : '✏️ Edit Payment Method'}
              </h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitModal} style={{ padding: '20px' }}>
              {modalError && (
                <div style={{ marginBottom: '14px', padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', fontSize: '0.8rem', fontWeight: 600 }}>
                  ⚠️ {modalError}
                </div>
              )}

              {/* Name */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Method Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Cash, bKash, Nagad, City Bank"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              {/* Type */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Payment Method Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box', background: '#ffffff', outline: 'none' }}
                >
                  <option value="cash">💵 Cash</option>
                  <option value="mobile_banking">📱 Mobile Banking (MFS)</option>
                  <option value="bank">🏦 Bank Account</option>
                  <option value="card">💳 Credit/Debit Card</option>
                  <option value="wallet">👛 Digital Wallet</option>
                  <option value="other">🏷️ Other</option>
                </select>
              </div>

              {/* Account Number */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Account / Phone / Card Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., 01700-000000 or 150.120.3456"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              {/* Account Details / Notes */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Account Details / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Branch name, routing number, or merchant notes..."
                  value={formData.account_details}
                  onChange={(e) => setFormData({ ...formData, account_details: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
                />
              </div>

              {/* Active Toggle */}
              <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="is_active_check"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="is_active_check" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                  Set as Active (Available immediately in Sales & Purchases)
                </label>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? 'Saving...' : modalMode === 'add' ? 'Create Method' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate / Soft Delete Modal */}
      {deactivateModal.isOpen && deactivateModal.method && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '1.5rem' }}>⚠️</span>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                Deactivate Payment Method?
              </h4>
            </div>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5 }}>
              Are you sure you want to deactivate <strong>"{deactivateModal.method.name || deactivateModal.method.method_name}"</strong>?
              <br />
              <br />
              <span style={{ fontSize: '0.78rem', color: '#16a34a', background: '#f0fdf4', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                🛡️ Historical transactions, invoices, and purchase records will remain intact.
              </span>
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setDeactivateModal({ isOpen: false, method: null, loading: false })}
                style={{ padding: '7px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deactivateModal.loading}
                onClick={handleConfirmDeactivate}
                style={{
                  padding: '7px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: deactivateModal.loading ? 'not-allowed' : 'pointer',
                }}
              >
                {deactivateModal.loading ? 'Deactivating...' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
