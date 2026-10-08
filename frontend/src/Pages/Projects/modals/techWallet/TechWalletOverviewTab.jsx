import React from 'react';

export default function TechWalletOverviewTab({
  wallets = [],
  initiatePayout,
  loadHistory,
  setActiveTab,
}) {
  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        {wallets.map((w, idx) => {
          const balance = parseFloat(w.balance || 0);
          const earned = parseFloat(w.total_earned || 0);
          const withdrawn = parseFloat(w.total_withdrawn || 0);

          return (
            <div
              key={idx}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px',
                  }}
                >
                  <div>
                    <h4
                      style={{
                        margin: '0 0 2px',
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        color: '#0f172a',
                      }}
                    >
                      {w.tech_name}
                    </h4>
                    <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      {w.contact || w.tech_source}
                    </span>
                  </div>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      background:
                        w.tech_source === 'user' ? '#eff6ff' : '#f0fdf4',
                      color:
                        w.tech_source === 'user' ? '#1e40af' : '#166534',
                    }}
                  >
                    {w.tech_source === 'user' ? 'Staff' : 'Vendor'}
                  </span>
                </div>

                {/* Balance Display */}
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    margin: '10px 0',
                    border: '1px solid #f1f5f9',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    Current Wallet Balance:
                  </span>
                  <div
                    style={{
                      fontSize: '1.4rem',
                      fontWeight: 900,
                      color: balance > 0 ? '#2563eb' : '#64748b',
                      marginTop: '2px',
                    }}
                  >
                    ৳ {balance.toLocaleString('en-IN')}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.72rem',
                      color: '#64748b',
                      marginTop: '4px',
                      borderTop: '1px dashed #cbd5e1',
                      paddingTop: '4px',
                    }}
                  >
                    <span>
                      Total Earned:{' '}
                      <strong>৳ {earned.toLocaleString('en-IN')}</strong>
                    </span>
                    <span>
                      Withdrawn:{' '}
                      <strong>৳ {withdrawn.toLocaleString('en-IN')}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => initiatePayout(w)}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    background: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  💵 Pay Now
                </button>
                <button
                  type="button"
                  onClick={() => {
                    loadHistory(w.wallet_id, w.tech_name);
                    setActiveTab('statement');
                  }}
                  style={{
                    padding: '8px 12px',
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  title="View Transaction Statement"
                >
                  📜 Statement
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
