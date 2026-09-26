import { useState, useEffect } from 'react';
import { smartFetch, pingServer } from '../../services/api';

export function useLoginModalState({ onLoginSuccess }) {
  // Modes: 'login' | 'staff_signup' | 'forgot_password'
  const [mode, setMode] = useState('login');

  // Login State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [serverOnline, setServerOnline] = useState(null);

  // Staff Sign Up State
  const [staffName, setStaffName] = useState('');
  const [staffIdentifier, setStaffIdentifier] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState('Sales Executive');
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState('');
  const [staffSuccess, setStaffSuccess] = useState('');

  // Password Recovery State
  const [recoveryId, setRecoveryId] = useState('');
  const [recoveryRole, setRecoveryRole] = useState('staff');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState('');
  const [recoveryError, setRecoveryError] = useState('');

  // Password Combination Indicator
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const strengthScore = [hasLetter, hasNumber, hasSpecial, password.length >= 6].filter(Boolean).length;

  useEffect(() => {
    let isMounted = true;
    pingServer().then((online) => {
      if (isMounted) setServerOnline(online);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Standard Login Execution
  const executeLogin = async (customId = null, customPass = null) => {
    setErrorMsg('');
    setSuccessMsg('');

    let rawId = identifier;
    let rawPass = password;

    if (typeof customId === 'string' && customId.trim()) {
      rawId = customId;
    }
    if (typeof customPass === 'string' && customPass.trim()) {
      rawPass = customPass;
    }

    const targetId = String(rawId ?? '').trim();
    const targetPass = String(rawPass ?? '').trim();

    if (!targetId || !targetPass) {
      setErrorMsg('Please enter both your phone/email and password.');
      return;
    }

    // Persistent Device Identifier
    let devId = localStorage.getItem('sheba_device_id');
    if (!devId) {
      devId = 'dev-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
      localStorage.setItem('sheba_device_id', devId);
    }
    const isMobile = window.innerWidth <= 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const devType = isMobile ? 'mobile' : 'desktop';
    const devName = localStorage.getItem('app_device_name') || (isMobile ? 'Mobile Browser' : 'Desktop Browser');

    try {
      setLoading(true);
      const res = await smartFetch('/security/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetId,
          phone: targetId,
          username: targetId,
          password: targetPass,
          device_id: devId,
          device_name: devName,
          device_type: devType,
          browser_info: navigator.userAgent || 'Web Browser',
        }),
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (res.ok && data && data.success && data.token) {
        setSuccessMsg('✓ Login successful! Redirecting to dashboard...');
        const userObj = data.user;
        const sessionToken = data.token;
        if (rememberMe) {
          localStorage.setItem('sheba_auth_user', JSON.stringify(userObj));
          localStorage.setItem('sheba_auth_token', sessionToken);
        } else {
          sessionStorage.setItem('sheba_auth_user', JSON.stringify(userObj));
          sessionStorage.setItem('sheba_auth_token', sessionToken);
        }

        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess(userObj);
        }, 200);
        return;
      }

      setErrorMsg((data && data.message) || 'Invalid username/phone or incorrect password.');
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg(
        'Unable to connect to the server. If waking from idle, please try again in a few seconds.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Staff Sign-up Submission
  const handleStaffSignup = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setStaffError('');
    setStaffSuccess('');

    const name = String(staffName || '').trim();
    const identifierVal = String(staffIdentifier || '').trim();
    const pass = String(staffPassword || '').trim();

    if (!name || !identifierVal || !pass) {
      setStaffError('Please fill in all required fields.');
      return;
    }

    if (pass.length < 6) {
      setStaffError('Password must be at least 6 characters.');
      return;
    }

    try {
      setStaffLoading(true);
      const res = await smartFetch('/security/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          identifier: identifierVal,
          password: pass,
          user_type: 'staff',
          staff_role: staffRole,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStaffSuccess('✓ Staff registration successful! You can log in once the administrator approves your account.');
        setStaffName('');
        setStaffIdentifier('');
        setStaffPassword('');
      } else {
        setStaffError(data.message || 'Unable to complete registration.');
      }
    } catch (err) {
      setStaffError('Unable to connect to the server.');
    } finally {
      setStaffLoading(false);
    }
  };

  // Password Recovery Submission
  const handleRecovery = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setRecoveryError('');
    setRecoverySuccess('');

    const targetRecId = String(recoveryId || '').trim();
    if (!targetRecId) {
      setRecoveryError('Please enter your registered phone number or email.');
      return;
    }

    try {
      setRecoveryLoading(true);
      const res = await smartFetch('/security/recovery-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: targetRecId,
          user_type: recoveryRole,
          reason: 'Forgot password reset request',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRecoverySuccess(data.message || 'Password reset request sent successfully.');
      } else {
        setRecoveryError(data.message || 'Failed to send recovery request.');
      }
    } catch (err) {
      setRecoveryError('Unable to connect to the server.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  return {
    mode,
    setMode,
    identifier,
    setIdentifier,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    rememberMe,
    setRememberMe,
    loading,
    errorMsg,
    setErrorMsg,
    successMsg,
    setSuccessMsg,
    serverOnline,
    staffName,
    setStaffName,
    staffIdentifier,
    setStaffIdentifier,
    staffPassword,
    setStaffPassword,
    staffRole,
    setStaffRole,
    staffLoading,
    staffError,
    staffSuccess,
    recoveryId,
    setRecoveryId,
    recoveryRole,
    setRecoveryRole,
    recoveryLoading,
    recoverySuccess,
    recoveryError,
    strengthScore,
    executeLogin,
    handleStaffSignup,
    handleRecovery,
  };
}
