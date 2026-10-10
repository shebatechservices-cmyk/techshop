import React from 'react';

export default function TechnicianCustomerLookup({
  searchPhone,
  setSearchPhone,
  handleSearchCustomer,
  searchingCustomer,
  searched,
  customerResults,
  handleAutoFillCustomer,
  importedCustomer,
  handleClearImport
}) {
  return (
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
  );
}
