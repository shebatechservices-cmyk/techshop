import { useState, useEffect } from 'react';
import { smartFetch, pingServer } from '../../services/api';

export function useLoginModalState({ onLoginSuccess }) {
  // Modes: 'login' | 'staff_signup' | 'forgot_password'
  const [mode, setMode] = useState('login');

  // Login State
  const [identifier, setIdentifier] = useState('shebatechservices@gmail.com');
  const [password, setPassword] = useState('578860');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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
      setErrorMsg('মোবাইল নম্বর অথবা ইমেইল এবং পাসওয়ার্ড উভয়ই প্রদান করুন।');
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
        setSuccessMsg('✓ লগইন সফল হয়েছে! ড্যাশবোর্ডে প্রবেশ করা হচ্ছে...');
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

      setErrorMsg((data && data.message) || 'ইউজার পাওয়া যায়নি অথবা পাসওয়ার্ড ভুল হয়েছে।');
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg(
        'সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি। ক্লাউড সার্ভার স্লিপ মোড থেকে চালু হচ্ছে, অনুগ্রহ করে কয়েক সেকেন্ড পর পুনরায় চেষ্টা করুন।'
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
      setStaffError('সকল প্রয়োজনীয় তথ্য পূরণ করুন।');
      return;
    }

    if (pass.length < 6) {
      setStaffError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
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
        setStaffSuccess('✓ স্টাফ রেজিস্ট্রেশন সফল হয়েছে! শপ অ্যাডমিন অনুমোদন করলে আপনি লগইন করতে পারবেন।');
        setStaffName('');
        setStaffIdentifier('');
        setStaffPassword('');
      } else {
        setStaffError(data.message || 'রেজিস্ট্রেশন সম্পন্ন করা সম্ভব হয়নি।');
      }
    } catch (err) {
      setStaffError('সার্ভারে যোগাযোগ করা সম্ভব হয়নি।');
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
      setRecoveryError('আপনার রেজিস্টার্ড মোবাইল নম্বর বা ইমেইল দিন।');
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
        setRecoverySuccess(data.message || 'পাসওয়ার্ড রিসেট অনুরোধ সফলভাবে পাঠানো হয়েছে।');
      } else {
        setRecoveryError(data.message || 'অনুরোধ পাঠাতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      setRecoveryError('সার্ভারের সাথে সংযোগ পাওয়া যায়নি।');
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
