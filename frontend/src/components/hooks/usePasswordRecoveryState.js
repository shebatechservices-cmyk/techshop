import { useState } from 'react';
import { smartFetch } from '../../services/api';

export function usePasswordRecoveryState() {
  const [recoveryId, setRecoveryId] = useState('');
  const [recoveryRole, setRecoveryRole] = useState('staff');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState('');
  const [recoveryError, setRecoveryError] = useState('');

  const handlePasswordRecovery = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setRecoveryError('');
    setRecoverySuccess('');

    const target = String(recoveryId || '').trim();
    if (!target) {
      setRecoveryError('Please provide your registered phone number or email.');
      return;
    }

    try {
      setRecoveryLoading(true);
      const res = await smartFetch('/security/recovery-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: target, role: recoveryRole }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRecoverySuccess(
          data.message ||
            'Password recovery request submitted successfully! An administrator will review and reset your password.'
        );
        setRecoveryId('');
      } else {
        setRecoveryError(data.message || 'Failed to submit recovery request. Please try again.');
      }
    } catch (err) {
      setRecoveryError(err.message || 'Network error occurred. Please contact the administrator.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  return {
    recoveryId,
    setRecoveryId,
    recoveryRole,
    setRecoveryRole,
    recoveryLoading,
    recoverySuccess,
    recoveryError,
    handlePasswordRecovery,
  };
}
