import React from 'react';

export default function TechWalletHeaderBar({
  activeTab,
  setActiveTab,
  wallets,
  pendingRequests,
  totalUnpaidTechBalance,
  onClose,
}) {
  return (
    <>
      {/* HEADER */}
      <div
        style={{
          padding: '18px 24px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.4rem' }}>💼</span>
            <h3
              style={{
                margin: 0,
                fontSize: '1.2rem',
                fontWeight: 800,
                color: '#f8fafc',
              }}
            >
              Technician Wallet & Payout Management
            </h3>
          </div>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: '0.8rem',
              color: '#94a3b8',
            }}
          >
            View accumulated earnings and disburse payments directly from cash
            drawer or bank accounts
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '1.4rem',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>

      {/* TABS & TOTAL BAR */}
      <div
        style={{
          background: '#f8fafc',
          padding: '10px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'overview' ? '#2563eb' : '#ffffff',
              color: activeTab === 'overview' ? '#ffffff' : '#475569',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow:
                activeTab === 'overview'
                  ? '0 2px 4px rgba(37,99,235,0.25)'
                  : 'none',
            }}
          >
            📊 Wallet Summary ({wallets.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payout')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'payout' ? '#2563eb' : '#ffffff',
              color: activeTab === 'payout' ? '#ffffff' : '#475569',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            💵 Disburse Payout
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('statement')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'statement' ? '#2563eb' : '#ffffff',
              color: activeTab === 'statement' ? '#ffffff' : '#475569',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            📜 Transaction History & Voucher
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'requests' ? '#2563eb' : '#ffffff',
              color: activeTab === 'requests' ? '#ffffff' : '#475569',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>📨 Requests</span>
            {pendingRequests.length > 0 && (
              <span
                style={{
                  background: activeTab === 'requests' ? '#ffffff' : '#ef4444',
                  color: activeTab === 'requests' ? '#2563eb' : '#ffffff',
                  padding: '1px 6px',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                }}
              >
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>

        <div style={{ fontSize: '0.82rem', color: '#475569' }}>
          Total Technician Payable:{' '}
          <strong style={{ color: '#2563eb', fontSize: '0.95rem' }}>
            ৳ {totalUnpaidTechBalance.toLocaleString('en-IN')}
          </strong>
        </div>
      </div>
    </>
  );
}
