import React from 'react';

export default function ClearDataWarningScope({
  scope,
  setScope,
  backupFirst,
  setBackupFirst,
  resetShopToDummy,
  setResetShopToDummy,
}) {
  return (
    <>
      {/* Warning Notice Box */}
      <div style={{
        background: 'rgba(239, 68, 68, 0.12)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '10px',
        padding: '12px 14px',
        marginBottom: '16px'
      }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f87171', marginBottom: '6px' }}>
          ⚠️ Important instructions before proceeding:
        </div>
        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.76rem', color: '#e2e8f0', lineHeight: 1.5 }}>
          <li><strong>What will be deleted:</strong> Dummy sales invoices, purchase orders, expenses, service projects, warranty claims, and trash records.</li>
          <li><strong>What will be reset to zero:</strong> Cash drawer balance, technician wallet balances, and customer receivable balances.</li>
          <li><strong>What remains protected:</strong> Admin accounts, product catalog, categories, brands, and shop settings.</li>
        </ul>
      </div>

      {/* Scope Selection */}
      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
          Cleanup Scope:
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '8px 10px',
            background: scope === 'transactions' ? 'rgba(56, 189, 248, 0.1)' : '#0f172a',
            border: `1px solid ${scope === 'transactions' ? '#38bdf8' : '#334155'}`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.75rem'
          }}>
            <input
              type="radio"
              name="cleanScope"
              checked={scope === 'transactions'}
              onChange={() => setScope('transactions')}
              style={{ marginTop: '2px' }}
            />
            <div>
              <strong style={{ color: '#fff' }}>Transactions Only</strong>
              <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Clear sales, purchases and logs while preserving catalog &amp; customers</div>
            </div>
          </label>

          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '8px 10px',
            background: scope === 'all' ? 'rgba(239, 68, 68, 0.1)' : '#0f172a',
            border: `1px solid ${scope === 'all' ? '#ef4444' : '#334155'}`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.75rem'
          }}>
            <input
              type="radio"
              name="cleanScope"
              checked={scope === 'all'}
              onChange={() => setScope('all')}
              style={{ marginTop: '2px' }}
            />
            <div>
              <strong style={{ color: '#fff' }}>Complete Test Data</strong>
              <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Clear transactions, test customer entries and dummy activity</div>
            </div>
          </label>
        </div>
      </div>

      {/* Safety Backup Checkbox */}
      <div style={{
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '8px',
        padding: '10px 12px',
        marginBottom: '16px'
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#e2e8f0', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={backupFirst}
            onChange={(e) => setBackupFirst(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
          />
          <span>
            🛡️ <strong>Create automatic safety backup</strong> (Save SQL snapshot before deletion)
          </span>
        </label>
      </div>

      {/* Reset Shop Info Checkbox */}
      <div style={{
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '8px',
        padding: '10px 12px',
        marginBottom: '16px'
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#e2e8f0', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={resetShopToDummy}
            onChange={(e) => setResetShopToDummy(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: '#38bdf8' }}
          />
          <span>
            🏪 <strong>Reset shop name &amp; address to default template</strong> (You can configure your own details in Settings)
          </span>
        </label>
      </div>
    </>
  );
}
