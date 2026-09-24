import React, { useState, useEffect, useMemo } from 'react';
import API from '../../services/api';

export default function AddAccountModal({ isOpen, onClose, onSuccess }) {
  const [tenders, setTenders] = useState([]);
  const [loadingTenders, setLoadingTenders] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [form, setForm] = useState({
    tenderId: '',
    accountName: '',
    location: '',
    openingBalance: '',
    referenceId: '',
  });

  // Active User Info
  const activeUser = useMemo(() => {
    try {
      const stored = localStorage.getItem('sheba_auth_user') || sessionStorage.getItem('sheba_auth_user');
      if (stored) {
        const u = JSON.parse(stored);
        return u.name || u.role_title || 'Super Admin';
      }
    } catch {
      // fallback
    }
    return 'Super Admin';
  }, []);

  // Fetch Payment Methods when modal opens
  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccessMsg('');
      setForm({
        tenderId: '',
        accountName: '',
        location: '',
        openingBalance: '',
        referenceId: '',
      });

      const fetchTenders = async () => {
        try {
          setLoadingTenders(true);
          const res = await fetch(`${API}/accounts/tenders`);
          if (res.ok) {
            const data = await res.json();
            setTenders(data.data || []);
            // Auto-select first payment method if available
            if (data.data && data.data.length > 0) {
              setForm((prev) => ({ ...prev, tenderId: String(data.data[0].id) }));
            }
          }
        } catch (err) {
          console.error('Error loading payment methods:', err);
        } finally {
          setLoadingTenders(false);
        }
      };
      fetchTenders();
    }
  }, [isOpen]);

  // Handle Create Account Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.tenderId) {
      setError('Please select a Payment Method first.');
      return;
    }
    if (!form.accountName.trim()) {
      setError('Please enter an Account Name.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const tenderInt = parseInt(form.tenderId, 10);
      const payload = {
        tenderId: tenderInt,
        tender_id: tenderInt,
        accountName: form.accountName.trim(),
        name: form.accountName.trim(),
        location: form.location.trim(),
        openingBalance: parseFloat(form.openingBalance) || 0,
        referenceId: form.referenceId.trim(),
        createdBy: activeUser,
      };

      const token =
        localStorage.getItem('token') ||
        localStorage.getItem('sheba_token') ||
        localStorage.getItem('sheba_auth_token') ||
        sessionStorage.getItem('sheba_auth_token');

      const res = await fetch(`${API}/accounts/account-records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create account record');
      }

      setSuccessMsg('Account created successfully!');
      if (onSuccess) {
        onSuccess(data.data);
      }
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      setError(err.message || 'Error creating account');
    } finally {
      setSubmitting(false);
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
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
            padding: '18px 22px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #1e293b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(129, 140, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              🏦
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                  New Account Create
                </h2>
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: 'rgba(99, 102, 241, 0.3)',
                    color: '#c7d2fe',
                    fontWeight: 700,
                    border: '1px solid rgba(129, 140, 248, 0.25)',
                  }}
                >
                  Ledger
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                Create cash drawer, bank branch, or MFS payment account
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#cbd5e1',
              fontSize: '1rem',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Body / Form */}
        <div style={{ padding: '22px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <span>⚠️ {error}</span>
              <button
                type="button"
                onClick={() => setError('')}
                style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#15803d',
                fontSize: '0.82rem',
                marginBottom: '16px',
                fontWeight: 600,
              }}
            >
              ✅ {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Step 1: Payment Method Selection */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px 14px',
              }}
            >
              <div style={{ marginBottom: '6px' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  1. Payment Method <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <select
                required
                value={form.tenderId}
                onChange={(e) => setForm({ ...form, tenderId: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">-- Select Payment Method --</option>
                {tenders.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Account Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '5px' }}>
                Account Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Main Drawer, IFIC Aruail Branch, bKash Merchant"
                value={form.accountName}
                onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.84rem',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Step 3: Location / Account Number */}
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '5px' }}>
                Location / Account Details
              </label>
              <input
                type="text"
                placeholder="e.g. Shop Counter 1, 01711000000, Branch Code"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.84rem',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Step 4: Opening Balance & Reference ID */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '5px' }}>
                  Opening Balance (৳)
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      pointerEvents: 'none',
                    }}
                  >
                    ৳
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.openingBalance}
                    onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 24px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      color: '#15803d',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '5px' }}>
                  Ref / Trans. ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. Haolad, Ref#101"
                  value={form.referenceId}
                  onChange={(e) => setForm({ ...form, referenceId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem',
                    fontFamily: 'monospace',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Footer Metadata */}
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                fontSize: '0.74rem',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>📅 <strong>Date:</strong> {new Date().toLocaleDateString('en-GB')}</span>
              <span>👤 <strong>Created By:</strong> {activeUser}</span>
            </div>

            {/* Form Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !form.tenderId}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: form.tenderId ? '#4f46e5' : '#94a3b8',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: form.tenderId ? 'pointer' : 'not-allowed',
                  boxShadow: '0 2px 4px rgba(79, 70, 229, 0.25)',
                  transition: 'all 0.15s ease',
                }}
              >
                {submitting ? 'Creating...' : '+ Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
