import React, { useState } from 'react';
import API from '../../../services/api';
import { isValidBDPhone } from '../../../utils/phoneUtils';
import TechnicianCustomerLookup from './technician/TechnicianCustomerLookup';
import TechnicianFormFields from './technician/TechnicianFormFields';

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

          <TechnicianCustomerLookup
            searchPhone={searchPhone}
            setSearchPhone={setSearchPhone}
            handleSearchCustomer={handleSearchCustomer}
            searchingCustomer={searchingCustomer}
            searched={searched}
            customerResults={customerResults}
            handleAutoFillCustomer={handleAutoFillCustomer}
            importedCustomer={importedCustomer}
            handleClearImport={handleClearImport}
          />

          <form onSubmit={handleSubmit}>
            <TechnicianFormFields
              name={name}
              setName={setName}
              phone={phone}
              setPhone={setPhone}
              address={address}
              setAddress={setAddress}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              designation={designation}
              setDesignation={setDesignation}
              loading={loading}
              onClose={onClose}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
