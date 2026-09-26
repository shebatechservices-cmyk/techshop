import React from 'react';
import BangladeshiPhoneInput from '../../../components/ui/BangladeshiPhoneInput';

export default function CustomerAccountView({
  customer,
  authName,
  setAuthName,
  authPhone,
  setAuthPhone,
  authAddress,
  setAuthAddress,
  authEmail,
  setAuthEmail,
  authLoading,
  authMsg,
  handleAuthSubmit,
  handleCustomerLogout,
  setActiveView,
  setTrackQuery,
  handleTrackSearch,
}) {
  return (
    <div
      style={{
        maxWidth: '520px',
        margin: '0 auto',
        background: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e2e8f0',
      }}
    >
      {customer ? (
        <div>
          <h3
            style={{
              margin: '0 0 6px 0',
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#0f172a',
            }}
          >
            👤 My Account
          </h3>
          <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '0.85rem' }}>
            Your profile details are automatically used for rapid checkout.
          </p>

          <div
            style={{
              background: '#f8fafc',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid #e2e8f0',
              marginBottom: '16px',
              fontSize: '0.88rem',
            }}
          >
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: '#64748b' }}>Full Name:</span> <strong>{customer.name}</strong>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: '#64748b' }}>Mobile Number:</span> <strong>{customer.phone}</strong>
            </div>
            {customer.email && (
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Email:</span> <strong>{customer.email}</strong>
              </div>
            )}
            <div>
              <span style={{ color: '#64748b' }}>Saved Delivery Address:</span>
              <div style={{ marginTop: '2px', color: '#0f172a' }}>
                {customer.address || 'No address saved yet'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                setActiveView('track');
                setTrackQuery(customer.phone);
                handleTrackSearch(customer.phone);
              }}
              style={{
                flex: 1,
                padding: '9px',
                background: '#0d9488',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              📦 View My Previous Orders
            </button>
            <button
              type="button"
              onClick={handleCustomerLogout}
              style={{
                padding: '9px 16px',
                background: '#ffffff',
                color: '#ef4444',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h3
            style={{
              margin: '0 0 6px 0',
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#0f172a',
            }}
          >
            👤 Customer Sign Up &amp; Login
          </h3>
          <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '0.85rem' }}>
            Sign in or create an account to order and track your delivery parcels easily.
          </p>

          {authMsg && (
            <div
              style={{
                padding: '10px 14px',
                background: authMsg.includes('✓') ? '#dcfce7' : '#fee2e2',
                color: authMsg.includes('✓') ? '#15803d' : '#b91c1c',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '14px',
              }}
            >
              {authMsg}
            </div>
          )}

          <form onSubmit={handleAuthSubmit}>
            <div style={{ marginBottom: '12px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: '4px',
                }}
              >
                Your Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Tanvir Hasan"
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <BangladeshiPhoneInput
                label="Mobile Number"
                required
                placeholder="1X-XXXXXXXX"
                value={authPhone}
                onChange={(e) => setAuthPhone(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: '4px',
                }}
              >
                Delivery Address
              </label>
              <input
                type="text"
                placeholder="House, Road, Area, City..."
                value={authAddress}
                onChange={(e) => setAuthAddress(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: '4px',
                }}
              >
                Email (Optional)
              </label>
              <input
                type="email"
                placeholder="name@gmail.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              style={{
                width: '100%',
                padding: '10px',
                background: '#0d9488',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              {authLoading ? 'Signing in...' : 'Sign In / Register Account'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
