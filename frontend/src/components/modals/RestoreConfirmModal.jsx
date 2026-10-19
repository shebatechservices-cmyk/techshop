import React, { useState } from 'react';
import API from '../../services/api';
import RestoreModalHeader from './restore/RestoreModalHeader';
import RestoreSuccessView from './restore/RestoreSuccessView';
import RestorePromptView from './restore/RestorePromptView';

export default function RestoreConfirmModal({
  isOpen,
  targetFile,
  isDemoRestore = false,
  onClose,
  onSuccess,
}) {
  const [safetyBackup, setSafetyBackup] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  if (!isOpen) return null;

  const fileName =
    targetFile?.fileName ||
    (isDemoRestore ? 'backup_before_dummy_data_clear_20260908_060254.sql' : '');
  const title = isDemoRestore
    ? '🌱 Restore Demo / Sample Test Data'
    : '🔄 Restore Database Backup';

  const handleExecuteRestore = async () => {
    try {
      setIsRestoring(true);
      setErrorMsg('');

      const endpoint = isDemoRestore
        ? '/settings/seed-dummy-data'
        : '/settings/restore-backup';
      const bodyPayload = isDemoRestore
        ? {}
        : {
            fileName: fileName,
            createSafetyBackupFirst: safetyBackup,
          };

      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessInfo({
          message: data.message,
          restoredFile: data.restoredFile || fileName,
          safetySnapshot: data.safetySnapshot,
          restoredAt: data.restoredAt,
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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '16px',
      }}
    >
      <div
        style={{
          background: '#1e293b',
          border: '1px solid #0284c7',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          color: '#f8fafc',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        <RestoreModalHeader
          title={title}
          isDemoRestore={isDemoRestore}
          isRestoring={isRestoring}
          onClose={handleClose}
        />

        <div style={{ padding: '20px' }}>
          {successInfo ? (
            <RestoreSuccessView
              successInfo={successInfo}
              onClose={handleClose}
            />
          ) : (
            <RestorePromptView
              isDemoRestore={isDemoRestore}
              fileName={fileName}
              targetFile={targetFile}
              safetyBackup={safetyBackup}
              setSafetyBackup={setSafetyBackup}
              errorMsg={errorMsg}
              isRestoring={isRestoring}
              onClose={handleClose}
              onExecute={handleExecuteRestore}
            />
          )}
        </div>
      </div>
    </div>
  );
}
