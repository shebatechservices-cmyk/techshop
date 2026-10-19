import React from 'react';

export default function ClearDataConfirmForm({
  targetPhrase,
  confirmPhrase,
  setConfirmPhrase,
  isPhraseMatched,
  errorMsg,
  isProcessing,
  handleClose,
  handleExecuteClear,
}) {
  return (
    <>
      {/* Double Confirmation Input */}
      <div style={{ marginBottom: '18px' }}>
        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#fca5a5', marginBottom: '4px' }}>
          Type <strong>{targetPhrase}</strong> below to confirm:
        </label>
        <input
          type="text"
          value={confirmPhrase}
          onChange={(e) => setConfirmPhrase(e.target.value)}
          placeholder={`Type ${targetPhrase}`}
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
  );
}
