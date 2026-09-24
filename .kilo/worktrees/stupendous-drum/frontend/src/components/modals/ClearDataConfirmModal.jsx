import React, { useState } from 'react';
import API from '../../services/api';

export default function ClearDataConfirmModal({ isOpen, onClose, onSuccess }) {
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [backupFirst, setBackupFirst] = useState(true);
  const [resetShopToDummy, setResetShopToDummy] = useState(false);
  const [scope, setScope] = useState('transactions'); // 'transactions' | 'all'
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  if (!isOpen) return null;

  const targetPhrase = 'CLEAR-DUMMY-DATA';
  const isPhraseMatched = confirmPhrase.trim().toUpperCase() === targetPhrase;

  const handleExecuteClear = async () => {
    if (!isPhraseMatched) {
      setErrorMsg(`Please type "${targetPhrase}" exactly to confirm.`);
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMsg('');

      const res = await fetch(`${API}/settings/clean-dummy-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmationText: confirmPhrase.trim(),
          backupFirst,
          scope,
          resetShopToDummy
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessInfo({
          message: data.message,
          backupName: data.backupName,
          cleanedAt: data.cleanedAt
        });
        if (onSuccess) onSuccess(data);
      } else {
        setErrorMsg(data.message || 'Failed to clear data. Please verify administrator permissions.');
      }
    } catch (err) {
      console.error('Clear data error:', err);
      setErrorMsg('Failed to connect to the server.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setConfirmPhrase('');
    setErrorMsg('');
    setSuccessInfo(null);
    setIsProcessing(false);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999999,
      padding: '16px'
    }}>
      <div style={{
        background: '#1e293b',
        border: '1px solid #dc2626',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '520px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        color: '#f8fafc',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem'
            }}>
              🚨
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
                Clear User &amp; Dummy Data
              </h3>
              <div style={{ fontSize: '0.72rem', color: '#fca5a5' }}>
                Admin database reset &amp; test data cleanup
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#fca5a5',
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px' }}>
          {successInfo ? (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>✅</div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#4ade80' }}>
                Data Cleared Successfully!
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0 0 16px 0' }}>
                {successInfo.message}
              </p>
              {successInfo.backupName && (
                <div style={{
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '10px',
                  fontSize: '0.76rem',
                  color: '#38bdf8',
                  marginBottom: '18px',
                  fontFamily: 'monospace'
                }}>
                  🛡️ Safety Backup Snapshot: {successInfo.backupName}
                </div>
              )}
              <button
                type="button"
                onClick={handleClose}
                style={{
                  background: '#10b981',
                  color: '#fff',
                  border: 'none',
                  padding: '9px 24px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Done (Close)
              </button>
            </div>
          ) : (
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

              {/* Double Confirmation Input */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#fca5a5', marginBottom: '4px' }}>
                  Type <strong>{targetPhrase}</strong> below to confirm:
                </label>
                <input
                  type="text"
                  value={confirmPhrase}
                  onChange={(e) => setConfirmPhrase(e.target.value)}
                  placeholder="Type CLEAR-DUMMY-DATA"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: '#0f172a',
                    border: `1px solid ${isPhraseMatched ? '#10b981' : '#dc2626'}`,
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    letterSpacing: '1px',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
                {confirmPhrase && !isPhraseMatched && (
                  <div style={{ color: '#f87171', fontSize: '0.72rem', marginTop: '4px' }}>
                    ⚠️ Please type "{targetPhrase}" in uppercase letters.
                  </div>
                )}
                {isPhraseMatched && (
                  <div style={{ color: '#4ade80', fontSize: '0.72rem', marginTop: '4px' }}>
                    ✓ Confirmation verified. You may now proceed.
                  </div>
                )}
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #ef4444',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: '#fecaca',
                  fontSize: '0.78rem',
                  marginBottom: '14px'
                }}>
                  ✕ {errorMsg}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isProcessing}
                  style={{
                    background: '#334155',
                    color: '#e2e8f0',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleExecuteClear}
                  disabled={!isPhraseMatched || isProcessing}
                  style={{
                    background: isPhraseMatched && !isProcessing ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : '#475569',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: isPhraseMatched && !isProcessing ? 'pointer' : 'not-allowed',
                    opacity: isPhraseMatched && !isProcessing ? 1 : 0.6,
                    boxShadow: isPhraseMatched ? '0 4px 14px rgba(239, 68, 68, 0.4)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isProcessing ? (
                    <>
                      <span>⌛</span>
                      <span>Clearing Data...</span>
                    </>
                  ) : (
                    <>
                      <span>🧹</span>
                      <span>Permanently Clear Data</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
