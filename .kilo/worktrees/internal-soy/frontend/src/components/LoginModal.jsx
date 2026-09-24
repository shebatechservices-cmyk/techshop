import React, { useState, useEffect } from 'react';
import API, { smartFetch, pingServer } from '../services/api';

export default function LoginModal({ isOpen, onLoginSuccess, canClose = false, onClose }) {
  // Modes: 'login' | 'staff_signup' | 'forgot_password'
  const [mode, setMode] = useState('login');

  // Login State - Clean standard login (no pre-filled credentials)
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [serverOnline, setServerOnline] = useState(null);


  // Staff Sign Up State (No ecommerce clutter)
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

  // Password Combination Indicator (3-tier: letters, numbers, special characters)
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const strengthScore = [hasLetter, hasNumber, hasSpecial, password.length >= 6].filter(Boolean).length;

  useEffect(() => {
    let isMounted = true;
    pingServer().then((online) => {
      if (isMounted) setServerOnline(online);
    });
    return () => { isMounted = false; };
  }, []);


  if (!isOpen) return null;

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
        })
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (res.ok && data && data.success) {
        setSuccessMsg('✓ লগইন সফল হয়েছে! ড্যাশবোর্ডে প্রবেশ করা হচ্ছে...');
        const userObj = data.user;
        const sessionToken = data.token || `token-${userObj.id}-${Date.now()}`;
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
      setErrorMsg('সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি। ক্লাউড সার্ভার স্লিপ মোড থেকে চালু হচ্ছে, অনুগ্রহ করে কয়েক সেকেন্ড পর পুনরায় চেষ্টা করুন।');
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
          staff_role: staffRole
        })
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
          reason: 'Forgot password reset request'
        })
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

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      {/* Main Container Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
        width: '100%',
        maxWidth: '440px',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        position: 'relative'
      }}>
        {/* Header Branding */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          padding: '24px 24px 20px 24px',
          color: '#ffffff',
          position: 'relative'
        }}>
          {canClose && (
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem'
              }}
            >
              ✕
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
            }}>
              🏪
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Sheba Technology
              </h2>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>POS & ERP Management System</span>
                {serverOnline !== null && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.7rem',
                    color: serverOnline ? '#4ade80' : '#facc15'
                  }}>
                    ● {serverOnline ? 'Cloud Live' : 'Connecting...'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div style={{ padding: '24px' }}>
          {/* Mode 1: Standard ERP Login */}
          {mode === 'login' && (
            <form onSubmit={(e) => { e.preventDefault(); executeLogin(); }}>
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="login-username" style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  মোবাইল নম্বর অথবা ইমেইল (User ID)
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                    👤
                  </span>
                  <input
                    type="text"
                    id="login-username"
                    name="username"
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="017xxxxxxxx অথবা user@shebatech.com"
                    autoFocus
                    required
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 38px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.92rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#10b981'}
                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label htmlFor="login-password" style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155' }}>
                    পাসওয়ার্ড (Password)
                  </label>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot_password'); setErrorMsg(''); setSuccessMsg(''); }}
                    style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                    🔒
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="login-password"
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{
                      width: '100%',
                      padding: '11px 40px 11px 38px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#10b981'}
                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      color: '#64748b'
                    }}
                  >
                    {showPassword ? '👁️' : '🙈'}
                  </button>
                </div>

                {/* Password Strength Status */}
                {password.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                    <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                      <div style={{ height: '4px', flex: 1, borderRadius: '2px', background: strengthScore >= 1 ? '#ef4444' : '#e2e8f0' }} />
                      <div style={{ height: '4px', flex: 1, borderRadius: '2px', background: strengthScore >= 2 ? '#f59e0b' : '#e2e8f0' }} />
                      <div style={{ height: '4px', flex: 1, borderRadius: '2px', background: strengthScore >= 3 ? '#10b981' : '#e2e8f0' }} />
                      <div style={{ height: '4px', flex: 1, borderRadius: '2px', background: strengthScore >= 4 ? '#059669' : '#e2e8f0' }} />
                    </div>
                    <span style={{ fontSize: '0.72rem', color: strengthScore >= 3 ? '#10b981' : '#64748b' }}>
                      {strengthScore >= 3 ? '✓ Strong' : 'Standard'}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#10b981', cursor: 'pointer' }}
                />
                <label htmlFor="remember-me" style={{ marginLeft: '8px', fontSize: '0.84rem', color: '#475569', cursor: 'pointer' }}>
                  এই ব্রাউজারে লগইন মনে রাখুন
                </label>
              </div>

              {errorMsg && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: '#fef2f2',
                  border: '1px solid #fee2e2',
                  color: '#dc2626',
                  fontSize: '0.84rem',
                  marginBottom: '16px'
                }}>
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: '#ecfdf5',
                  border: '1px solid #d1fae5',
                  color: '#059669',
                  fontSize: '0.84rem',
                  marginBottom: '16px'
                }}>
                  {successMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '10px',
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {loading ? 'লগইন হচ্ছে...' : 'লগইন করুন (Sign In)'}
              </button>

              <div style={{
                marginTop: '16px',
                paddingTop: '14px',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.8rem',
                color: '#64748b'
              }}>
                <div>
                  <span>নতুন স্টাফ?</span>
                  <button
                    type="button"
                    onClick={() => { setMode('staff_signup'); setErrorMsg(''); setSuccessMsg(''); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#10b981',
                      fontWeight: 700,
                      marginLeft: '6px',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    রেজিস্ট্রেশন
                  </button>
                </div>
                {/* Developer Console is accessible via hidden shortcut (Ctrl + Shift + D) only */}
              </div>
            </form>
          )}

          {/* Mode 2: Staff Sign Up (Admin Confirmation Required) */}
          {mode === 'staff_signup' && (
            <form onSubmit={handleStaffSignup}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
                  স্টাফ রেজিস্ট্রেশন (Staff Registration)
                </h3>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  ← ব্যাক
                </button>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  পূর্ণ নাম (Full Name) *
                </label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Md. Kamal Hossain"
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  মোবাইল নম্বর অথবা ইমেইল *
                </label>
                <input
                  type="text"
                  value={staffIdentifier}
                  onChange={(e) => setStaffIdentifier(e.target.value)}
                  placeholder="017xxxxxxxx or staff@shebatech.com"
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  স্টাফ পদবী (Role)
                </label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                >
                  <option value="Sales Executive">Sales Executive (বিক্রয় প্রতিনিধি)</option>
                  <option value="Field Technician">Field Technician (মাঠ টেকনিশিয়ান)</option>
                  <option value="Inventory Officer">Inventory Officer (স্টক ইনচার্জ)</option>
                  <option value="Accountant">Accountant (হিসাবরক্ষক)</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  পাসওয়ার্ড (Password) *
                </label>
                <input
                  type="password"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>

              {staffError && (
                <div style={{ padding: '10px', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', fontSize: '0.84rem', marginBottom: '14px' }}>
                  {staffError}
                </div>
              )}

              {staffSuccess && (
                <div style={{ padding: '10px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', fontSize: '0.84rem', marginBottom: '14px' }}>
                  {staffSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={staffLoading}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: staffLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {staffLoading ? 'রেজিস্ট্রেশন হচ্ছে...' : 'আবেদন জমা দিন (Submit)'}
              </button>
            </form>
          )}

          {/* Mode 3: Forgot Password Recovery */}
          {mode === 'forgot_password' && (
            <form onSubmit={handleRecovery}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
                  পাসওয়ার্ড রিকভারি (Password Reset)
                </h3>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  ← ব্যাক
                </button>
              </div>

              <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5, margin: '0 0 14px 0' }}>
                আপনার রেজিস্টার্ড মোবাইল বা ইমেইল প্রদান করুন। অ্যাডমিন বা ডেভলপার প্যানেল থেকে আপনার পাসওয়ার্ড রিসেট করে দেওয়া হবে।
              </p>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  ইউজার ক্যাটাগরি
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setRecoveryRole('staff')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1.5px solid',
                      borderColor: recoveryRole === 'staff' ? '#10b981' : '#cbd5e1',
                      background: recoveryRole === 'staff' ? '#ecfdf5' : '#ffffff',
                      color: recoveryRole === 'staff' ? '#059669' : '#475569',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.82rem'
                    }}
                  >
                    স্টাফ / টেকনিশিয়ান
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecoveryRole('admin')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1.5px solid',
                      borderColor: recoveryRole === 'admin' ? '#0284c7' : '#cbd5e1',
                      background: recoveryRole === 'admin' ? '#f0f9ff' : '#ffffff',
                      color: recoveryRole === 'admin' ? '#0284c7' : '#475569',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.82rem'
                    }}
                  >
                    শপ অ্যাডমিন
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  রেজিস্টার্ড মোবাইল অথবা ইমেইল *
                </label>
                <input
                  type="text"
                  value={recoveryId}
                  onChange={(e) => setRecoveryId(e.target.value)}
                  placeholder="017xxxxxxxx or your@email.com"
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>

              {recoveryError && (
                <div style={{ padding: '10px', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', fontSize: '0.84rem', marginBottom: '14px' }}>
                  {recoveryError}
                </div>
              )}

              {recoverySuccess && (
                <div style={{ padding: '10px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', fontSize: '0.84rem', marginBottom: '14px' }}>
                  {recoverySuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={recoveryLoading}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: recoveryLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {recoveryLoading ? 'অনুরোধ পাঠানো হচ্ছে...' : 'রিসেট অনুরোধ পাঠান'}
              </button>
            </form>
          )}
        </div>
      </div>

    </div>
  );
}
