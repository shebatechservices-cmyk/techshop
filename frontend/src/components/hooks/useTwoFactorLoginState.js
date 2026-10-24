import { useState, useEffect, useCallback } from 'react';
import { smartFetch } from '../../services/api';

export function useTwoFactorLoginState({ onLoginSuccess, rememberMe }) {
  const [twoFactorActive, setTwoFactorActive] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [twoFactorDevId, setTwoFactorDevId] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [approvalNotice, setApprovalNotice] = useState('');

  const startTwoFactor = (data) => {
    setTwoFactorActive(true);
    setTwoFactorToken(data.verification_token || '');
    setTwoFactorDevId(data.device_id || '');
    setMaskedEmail(data.masked_email || 'your registered email');
    setOtpCode('');
    setVerifyError('');
    setApprovalNotice('');
  };

  const cancelTwoFactor = () => {
    setTwoFactorActive(false);
    setTwoFactorToken('');
    setTwoFactorDevId('');
    setOtpCode('');
    setVerifyError('');
  };

  const commitLogin = useCallback((userObj, sessionToken) => {
    if (rememberMe) {
      localStorage.setItem('sheba_auth_user', JSON.stringify(userObj));
      localStorage.setItem('sheba_auth_token', sessionToken);
    } else {
      sessionStorage.setItem('sheba_auth_user', JSON.stringify(userObj));
      sessionStorage.setItem('sheba_auth_token', sessionToken);
    }
    if (onLoginSuccess) onLoginSuccess(userObj);
  }, [rememberMe, onLoginSuccess]);

  // Submit OTP Code
  const handleVerifyOtp = async (codeToVerify) => {
    const code = String(codeToVerify || otpCode).trim();
    if (!code || code.length < 6) {
      setVerifyError('Please enter the 6-digit verification code.');
      return;
    }

    try {
      setVerifyingOtp(true);
      setVerifyError('');
      const res = await smartFetch('/security/verify-device-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verification_token: twoFactorToken,
          device_id: twoFactorDevId,
          code,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.token) {
        setApprovalNotice('✓ Verification successful! Authorizing device...');
        setTimeout(() => commitLogin(data.user, data.token), 400);
      } else {
        setVerifyError(data.message || 'Incorrect verification code. Please check and try again.');
      }
    } catch (err) {
      setVerifyError(err.message || 'Verification network error. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Poll for Admin Approval (Option 1)
  useEffect(() => {
    if (!twoFactorActive || !twoFactorToken || !twoFactorDevId) return;

    const interval = setInterval(async () => {
      try {
        const res = await smartFetch(
          `/security/check-device-approval?verification_token=${encodeURIComponent(twoFactorToken)}&device_id=${encodeURIComponent(twoFactorDevId)}`
        );
        const data = await res.json();
        if (res.ok && data.success && data.approved && data.token) {
          clearInterval(interval);
          setApprovalNotice('✓ Device approved by Administrator! Logging in...');
          setTimeout(() => commitLogin(data.user, data.token), 400);
        }
      } catch (_) {}
    }, 3500);

    return () => clearInterval(interval);
  }, [twoFactorActive, twoFactorToken, twoFactorDevId, commitLogin]);

  return {
    twoFactorActive,
    twoFactorToken,
    twoFactorDevId,
    maskedEmail,
    otpCode,
    setOtpCode,
    verifyingOtp,
    verifyError,
    approvalNotice,
    startTwoFactor,
    cancelTwoFactor,
    handleVerifyOtp,
  };
}
