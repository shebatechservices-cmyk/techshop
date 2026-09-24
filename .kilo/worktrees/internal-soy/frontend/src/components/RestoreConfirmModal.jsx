import React, { useState } from 'react';
import API from '../services/api';

export default function RestoreConfirmModal({ isOpen, targetFile, isDemoRestore = false, onClose, onSuccess }) {
  const [safetyBackup, setSafetyBackup] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  if (!isOpen) return null;

  const fileName = targetFile?.fileName || (isDemoRestore ? 'backup_before_dummy_data_clear_20260908_060254.sql' : '');
  const title = isDemoRestore 
    ? '🌱 Restore Demo / Sample Test Data' 
    : '🔄 Restore Database Backup';

  const handleExecuteRestore = async () => {
    try {
      setIsRestoring(true);
      setErrorMsg('');

      const endpoint = isDemoRestore ? '/settings/seed-dummy-data' : '/settings/restore-backup';
      const bodyPayload = isDemoRestore ? {} : {
        fileName: fileName,
        createSafetyBackupFirst: safetyBackup
      };

      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'role-id': '1'
        },
        body: JSON.stringify(bodyPayload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessInfo({
          message: data.message,
          restoredFile: data.restoredFile || fileName,
          safetySnapshot: data.safetySnapshot,
          restoredAt: data.restoredAt
        });
        if (onSuccess) onSuccess(data);
      } else {
        setErrorMsg(data.message || 'Failed to restore database.');
      }
    } catch (err) {
      console.error('Restore error:', err);
      setErrorMsg('Failed to connect to the server.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleClose = () => {
    setErrorMsg('');
    setSuccessInfo(null);
    setIsRestoring(false);
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
        border: '1px solid #0284c7',
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
          background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)',
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
              fontSize: '1.25rem'
            }}>
              {isDemoRestore ? '🌱' : '🔄'}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
                {title}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#e0f2fe' }}>
                PostgreSQL Safe Snapshot Recovery Module
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isRestoring}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              color: '#ffffff',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px' }}>
          {successInfo ? (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                fontSize: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                ✓
              </div>
              <h4 style={{ margin: '0 0 8px', fontSize: '1.05rem', color: '#10b981', fontWeight: 800 }}>
                Database Restored Successfully!
              </h4>
              <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.4' }}>
                {successInfo.message}
              </p>

              <div style={{
                background: '#0f172a',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '0.75rem',
                textAlign: 'left',
                border: '1px solid #334155',
                marginBottom: '16px'
              }}>
                <div style={{ color: '#cbd5e1', marginBottom: '4px' }}>
                  <strong>Restored File:</strong> <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{successInfo.restoredFile}</span>
                </div>
                {successInfo.safetySnapshot && (
                  <div style={{ color: '#cbd5e1', marginBottom: '4px' }}>
                    <strong>Safety Pre-Backup:</strong> <span style={{ fontFamily: 'monospace', color: '#a7f3d0' }}>{successInfo.safetySnapshot}</span>
                  </div>
                )}
                <div style={{ color: '#64748b' }}>
                  <strong>Timestamp:</strong> {new Date(successInfo.restoredAt || Date.now()).toLocaleString()}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleClose();
                  window.location.reload();
                }}
                style={{
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 24px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                🔄 Reload App with Restored Data
              </button>
            </div>
          ) : (
            <div>
              {/* Warning Banner */}
              <div style={{
                background: 'rgba(2, 132, 199, 0.1)',
                border: '1px solid rgba(2, 132, 199, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
                  <div style={{ fontSize: '0.78rem', color: '#bae6fd', lineHeight: '1.45' }}>
                    {isDemoRestore ? (
                      <span>
                        This will restore a complete <strong>Sample Test Database</strong> (sample sales, purchases, customers, suppliers, and accounting). You can test all software features with this sample data.
                      </span>
                    ) : (
                      <span>
                        You are about to restore backup file <strong>'{fileName}'</strong>. The database will be restored to this exact point in time.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Target File Info */}
              <div style={{
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Target File:</div>
                <div style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#38bdf8', wordBreak: 'break-all', fontWeight: 600 }}>
                  {fileName || 'Demo Snapshot'}
                </div>
                {targetFile?.sizeStr && (
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                    File Size: <strong>{targetFile.sizeStr}</strong> • Created: {targetFile.createdAt ? new Date(targetFile.createdAt).toLocaleString() : 'N/A'}
                  </div>
                )}
              </div>

              {/* Safety Pre-Backup Checkbox */}
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
                    checked={safetyBackup}
                    onChange={(e) => setSafetyBackup(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                  />
                  <span>
                    🛡️ <strong>Create automatic safety backup before restoring</strong> (Recommended)
                  </span>
                </label>
              </div>

              {errorMsg && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#fca5a5',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  marginBottom: '14px'
                }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isRestoring}
                  style={{
                    background: '#334155',
                    color: '#e2e8f0',
                    border: 'none',
                    padding: '9px 18px',
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
                  onClick={handleExecuteRestore}
                  disabled={isRestoring}
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '9px 20px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: isRestoring ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                  }}
                >
                  {isRestoring ? (
                    <>
                      <span style={{ animation: 'spin 1s linear infinite' }}>⌛</span>
                      <span>Restoring Database...</span>
                    </>
                  ) : (
                    <>
                      <span>{isDemoRestore ? '🌱' : '🔄'}</span>
                      <span>{isDemoRestore ? 'Restore Demo Data' : 'Restore Database'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
