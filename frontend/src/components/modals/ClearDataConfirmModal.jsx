import React, { useState } from 'react';
import API from '../../services/api';
import ClearDataSuccessView from './clear-data/ClearDataSuccessView';
import ClearDataWarningScope from './clear-data/ClearDataWarningScope';
import ClearDataConfirmForm from './clear-data/ClearDataConfirmForm';

export default function ClearDataConfirmModal({ isOpen, onClose, onSuccess }) {
  const isDevelopment = import.meta.env?.DEV || (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development');

  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [backupFirst, setBackupFirst] = useState(true);
  const [resetShopToDummy, setResetShopToDummy] = useState(false);
  const [scope, setScope] = useState('transactions'); // 'transactions' | 'all'
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  if (!isOpen || !isDevelopment) return null;

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
            <ClearDataSuccessView successInfo={successInfo} onClose={handleClose} />
          ) : (
            <>
              <ClearDataWarningScope
                scope={scope}
                setScope={setScope}
                backupFirst={backupFirst}
                setBackupFirst={setBackupFirst}
                resetShopToDummy={resetShopToDummy}
                setResetShopToDummy={setResetShopToDummy}
              />
              <ClearDataConfirmForm
                targetPhrase={targetPhrase}
                confirmPhrase={confirmPhrase}
                setConfirmPhrase={setConfirmPhrase}
                isPhraseMatched={isPhraseMatched}
                errorMsg={errorMsg}
                isProcessing={isProcessing}
                handleClose={handleClose}
                handleExecuteClear={handleExecuteClear}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
