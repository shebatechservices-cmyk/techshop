import React from 'react';

export default function TechWalletStatementTab({
  wallets = [],
  statementWalletId,
  statementTechName,
  historyList = [],
  loadingHistory = false,
  loadHistory,
}) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            Select Technician:
          </span>
          <select
            value={statementWalletId || ''}
            onChange={(e) => {
              const wId = Number(e.target.value);
              const w = wallets.find((x) => x.wallet_id === wId);
              loadHistory(wId, w?.tech_name || '');
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.84rem',
            }}
          >
            {wallets.map((w, i) => (
              <option key={i} value={w.wallet_id}>
                {w.tech_name} (Balance: ৳
                {parseFloat(w.balance || 0).toLocaleString('en-IN')})
              </option>
            ))}
          </select>
        </div>

        {historyList.length > 0 && (
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              padding: '6px 14px',
              background: '#0f172a',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            🖨️ Print Payment Voucher
          </button>
        )}
      </div>

      {/* Printable Statement Sheet */}
      <div
        id="payout-voucher-sheet"
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '18px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div
          style={{
            borderBottom: '2px solid #0f172a',
            paddingBottom: '10px',
            marginBottom: '14px',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
              Technician Ledger Statement & Payout Voucher
            </h3>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: '0.8rem',
                color: '#64748b',
              }}
            >
              Technician:{' '}
              <strong>{statementTechName || 'Selected Technician'}</strong>
            </p>
          </div>
          <div
            style={{
              textAlign: 'right',
              fontSize: '0.78rem',
              color: '#64748b',
            }}
          >
            Date: {new Date().toLocaleDateString('en-GB')}
          </div>
        </div>

        {loadingHistory ? (
          <p
            style={{
              textAlign: 'center',
              padding: '24px',
              color: '#64748b',
            }}
          >
            Loading history...
          </p>
        ) : historyList.length === 0 ? (
          <p
            style={{
              textAlign: 'center',
              padding: '24px',
              color: '#94a3b8',
            }}
          >
            No transaction records found for this technician.
          </p>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.82rem',
            }}
          >
            <thead>
              <tr
                style={{
                  background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  color: '#475569',
                }}
              >
                <th style={{ padding: '8px 10px', textAlign: 'left' }}>
                  Date & Time
                </th>
                <th style={{ padding: '8px 10px', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '8px 10px', textAlign: 'left' }}>
                  Reference & Description
                </th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>
                  Credit / Earned (৳)
                </th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>
                  Debit / Paid (৳)
                </th>
              </tr>
            </thead>
            <tbody>
              {historyList.map((row, idx) => {
                const isDeposit = row.type === 'deposit';
                const amt = parseFloat(row.amount || 0);

                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td
                      style={{
                        padding: '8px 10px',
                        color: '#64748b',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {new Date(row.created_at).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          background: isDeposit ? '#dcfce7' : '#fee2e2',
                          color: isDeposit ? '#15803d' : '#991b1b',
                        }}
                      >
                        {isDeposit ? 'Income' : 'Cash Payout'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <strong>{row.reference}</strong>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        {row.note}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '8px 10px',
                        textAlign: 'right',
                        fontWeight: 700,
                        color: '#16a34a',
                      }}
                    >
                      {isDeposit ? `+ ৳${amt.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td
                      style={{
                        padding: '8px 10px',
                        textAlign: 'right',
                        fontWeight: 700,
                        color: '#dc2626',
                      }}
                    >
                      {!isDeposit ? `- ৳${amt.toLocaleString('en-IN')}` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Voucher Signature Line */}
        <div
          style={{
            marginTop: '36px',
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '10px',
          }}
        >
          <div style={{ textAlign: 'center', width: '150px' }}>
            <div
              style={{
                borderTop: '1px solid #94a3b8',
                paddingTop: '4px',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              Technician Signature
            </div>
          </div>
          <div style={{ textAlign: 'center', width: '150px' }}>
            <div
              style={{
                borderTop: '1px solid #94a3b8',
                paddingTop: '4px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              Authorized Signature
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
