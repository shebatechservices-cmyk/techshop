import React from 'react';

export default function RestorePromptView({
  isDemoRestore,
  fileName,
  targetFile,
  safetyBackup,
  setSafetyBackup,
  errorMsg,
  isRestoring,
  onClose,
  onExecute,
}) {
  return (
    <div>
      {/* Warning Banner */}
      <div
        style={{
          background: 'rgba(2, 132, 199, 0.1)',
          border: '1px solid rgba(2, 132, 199, 0.3)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
          <div style={{ fontSize: '0.78rem', color: '#bae6fd', lineHeight: '1.45' }}>
            {isDemoRestore ? (
              <span>
                This will restore a complete <strong>Sample Test Database</strong> (sample sales,
                purchases, customers, suppliers, and accounting). You can test all software features
                with this sample data.
              </span>
            ) : (
              <span>
                You are about to restore backup file <strong>'{fileName}'</strong>. The database will
                be restored to this exact point in time.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Target File Info */}
      <div
        style={{
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
        }}
      >
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
          Target File:
        </div>
        <div
          style={{
            fontSize: '0.82rem',
            fontFamily: 'monospace',
            color: '#38bdf8',
            wordBreak: 'break-all',
            fontWeight: 600,
          }}
        >
          {fileName || 'Demo Snapshot'}
        </div>
        {targetFile?.sizeStr && (
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
            File Size: <strong>{targetFile.sizeStr}</strong> • Created:{' '}
            {targetFile.createdAt ? new Date(targetFile.createdAt).toLocaleString() : 'N/A'}
          </div>
        )}
      </div>

      {/* Safety Pre-Backup Checkbox */}
      <div
        style={{
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '10px 12px',
          marginBottom: '16px',
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.78rem',
            color: '#e2e8f0',
            cursor: 'pointer',
          }}
        >
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
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            padding: '9px 12px',
            borderRadius: '8px',
            fontSize: '0.75rem',
            marginBottom: '14px',
          }}
        >
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          marginTop: '20px',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isRestoring}
          style={{
            background: '#334155',
            color: '#e2e8f0',
            border: 'none',
            padding: '9px 18px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onExecute}
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
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
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
  );
}
