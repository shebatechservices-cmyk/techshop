import React, { useState } from 'react';
import API from '../../../services/api';
import BangladeshiPhoneInput from '../../../components/ui/BangladeshiPhoneInput';
import { isValidBDPhone } from '../../../utils/phoneUtils';

export default function AddTechnicianModal({ isOpen, onClose, onSuccess }) {
  // Form field states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('123456');
  const [designation, setDesignation] = useState('Field Technician');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Customer search & lookup states
  const [searchPhone, setSearchPhone] = useState('');
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [customerResults, setCustomerResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [importedCustomer, setImportedCustomer] = useState(null);

  if (!isOpen) return null;

  // RULE 1: Customer Lookup by phone or search keyword
  const handleSearchCustomer = async (e) => {
    if (e) e.preventDefault();
    const query = searchPhone.trim();
    if (!query) return;

    try {
      setSearchingCustomer(true);
      setErrorMsg('');
      const res = await fetch(`${API}/sales/customers?phone=${encodeURIComponent(query)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setCustomerResults(json.data || []);
        } else {
          setCustomerResults([]);
        }
      } else {
        setCustomerResults([]);
      }
    } catch (err) {
      console.error('Error searching customer:', err);
      setErrorMsg('Failed to search customer database');
    } finally {
      setSearchingCustomer(false);
      setSearched(true);
    }
  };

  // RULE 2: Auto-fill customer details into staff form
  const handleAutoFillCustomer = (cust) => {
    if (!cust) return;
    setName(cust.name || '');
    
    // Normalize phone for BangladeshiPhoneInput (strip +880 or leading 0 if needed)
    let p = cust.phone || '';
    if (p.startsWith('+880')) p = p.slice(4);
    else if (p.startsWith('880')) p = p.slice(3);
    else if (p.startsWith('0')) p = p.slice(1);
    setPhone(p);

    setAddress(cust.address || '');
    if (cust.email) setEmail(cust.email);
    setImportedCustomer(cust);
    setCustomerResults([]);
    setSearched(false);
  };

  const handleClearImport = () => {
    setImportedCustomer(null);
  };

  // RULE 3: Strict Data Integrity & Distinct users (Staff) payload
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter technician name.');
      return;
    }

    if (!phone && !email) {
      setErrorMsg('Please enter at least a phone number or email.');
      return;
    }

    if (phone && !isValidBDPhone(phone)) {
      setErrorMsg('Please enter a valid 10-digit Bangladeshi phone number (e.g. 17XXXXXXXX).');
      return;
    }

    if (!password || password.trim().length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          password: password.trim(),
          role: 'TECHNICIAN',
          role_id: 4,
          designation: designation.trim() || 'Field Technician',
          is_active: true
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create technician');
      }

      // Reset form
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setPassword('123456');
      setDesignation('Field Technician');
      setErrorMsg('');
      setImportedCustomer(null);

      if (onSuccess) {
        onSuccess(data.data);
      }
      onClose();
    } catch (err) {
      console.error('Create technician error:', err);
      setErrorMsg(err.message || 'Error creating technician');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.2s ease-out',
          margin: 'auto',
          maxHeight: '94vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#fff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem' }}>👷‍♂️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                Quick Add Field Technician
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#e0f2fe' }}>
                Register a new staff member with Technician role
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '8px',
              width: '28px',
              height: '28px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem'
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body / Form */}
        <div style={{ padding: '20px', overflowY: 'auto' }}>
          {errorMsg && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                color: '#b91c1c',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* RULE 1 & 2: Search from Existing Customers (Auto-fill section) */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '18px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🔍</span> Search from Existing Customers
              </label>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Auto-fill details without re-typing
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Enter customer phone number..."
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchCustomer();
                  }
                }}
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                  background: '#fff'
                }}
              />
              <button
                type="button"
                onClick={handleSearchCustomer}
                disabled={searchingCustomer || !searchPhone.trim()}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#0284c7',
                  color: '#fff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: (searchingCustomer || !searchPhone.trim()) ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {searchingCustomer ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Search Results List */}
            {searched && customerResults.length > 0 && (
              <div style={{ marginTop: '10px', borderTop: '1px dashed #cbd5e1', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569' }}>
                  Matching Customers ({customerResults.length}):
                </span>
                {customerResults.map((cust) => (
                  <div
                    key={cust.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#ffffff',
                      border: '1px solid #bfdbfe',
                      padding: '8px 10px',
                      borderRadius: '8px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                        {cust.name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        📞 {cust.phone} {cust.address ? `• 📍 ${cust.address}` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAutoFillCustomer(cust)}
                      style={{
                        padding: '4px 10px',
                        background: '#e0f2fe',
                        border: '1px solid #7dd3fc',
                        borderRadius: '6px',
                        color: '#0369a1',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ⚡ Auto-fill
                    </button>
                  </div>
                ))}
              </div>
            )}

            {searched && customerResults.length === 0 && (
              <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
                No customer found with phone &quot;{searchPhone}&quot;. You can manually type below.
              </div>
            )}

            {/* Active Auto-fill Alert Banner */}
            {importedCustomer && (
              <div
                style={{
                  marginTop: '10px',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.76rem',
                  color: '#065f46'
                }}
              >
                <span>
                  ✓ Auto-filled from Customer: <strong>{importedCustomer.name}</strong> ({importedCustomer.phone})
                </span>
                <button
                  type="button"
                  onClick={handleClearImport}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#059669',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.72rem'
                  }}
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Technician Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Md. Sohel Rana"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Phone Input with Bangladesh prefix */}
            <div style={{ marginBottom: '14px' }}>
              <BangladeshiPhoneInput
                label="Phone Number *"
                placeholder="1X-XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {/* Address */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Address / Work Location
              </label>
              <input
                type="text"
                placeholder="e.g. House 12, Road 4, Sector 7, Uttara"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Email / Username */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Email / Login ID <span style={{ fontSize: '0.75rem', color: '#64748b' }}>(Optional)</span>
              </label>
              <input
                type="email"
                placeholder="sohel.tech@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Default Password *
                </label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Designation */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Designation
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Role Pill Indicator */}
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.78rem',
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '20px'
              }}
            >
              <span>🛡️</span>
              <span>Assigned Role: <strong>Field Technician (Staff Role ID: 4)</strong></span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: loading ? '#93c5fd' : '#0284c7',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {loading ? 'Creating...' : '✓ Add Technician'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
