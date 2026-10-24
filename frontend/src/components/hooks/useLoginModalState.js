import { useState, useEffect } from 'react';
import { smartFetch, pingServer } from '../../services/api';
import { useStaffSignupState } from './useStaffSignupState';
import { usePasswordRecoveryState } from './usePasswordRecoveryState';
import { useTwoFactorLoginState } from './useTwoFactorLoginState';

export function useLoginModalState({ onLoginSuccess }) {
  // Modes: 'login' | 'staff_signup' | 'forgot_password' | 'two_factor'
  const [mode, setMode] = useState('login');

  // Core Login State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [serverOnline, setServerOnline] = useState(null);

  // Sub-Hooks
  const staffState = useStaffSignupState();
  const recoveryState = usePasswordRecoveryState();
  const twoFactorState = useTwoFactorLoginState({ onLoginSuccess, rememberMe });

  // Password Combination Indicators
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const strengthScore = [hasLetter, hasNumber, hasSpecial, password.length >= 6].filter(Boolean).length;

  useEffect(() => {
    let isMounted = true;
    let timer = null;

    const checkServer = async () => {
      try {
        const online = await pingServer();
        if (!isMounted) return;
        setServerOnline(online);
        if (!online) timer = setTimeout(checkServer, 4000);
      } catch {
        if (isMounted) {
          setServerOnline(false);
          timer = setTimeout(checkServer, 4000);
        }
      }
    };

    checkServer();
    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Standard Login Execution
  const executeLogin = async (customId = null, customPass = null) => {
    setErrorMsg('');
    setSuccessMsg('');

    const targetId = String((typeof customId === 'string' && customId.trim() ? customId : identifier) ?? '').trim();
    const targetPass = String((typeof customPass === 'string' && customPass.trim() ? customPass : password) ?? '').trim();

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

      // Check if New Device 2FA is required
      if (res.ok && data && data.requires_2fa) {
        twoFactorState.startTwoFactor(data);
        setMode('two_factor');
        return;
      }

      // Direct Login Success
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
      setErrorMsg('Unable to connect to the server. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel2Fa = () => {
    twoFactorState.cancelTwoFactor();
    setMode('login');
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
    strengthScore,
    executeLogin,

    // Staff Signup
    ...staffState,

    // Password Recovery
    ...recoveryState,

    // 2FA State
    ...twoFactorState,
    handleCancel2Fa,
  };
}

export default useLoginModalState;
