import { useState, useEffect } from 'react';
import API_BASE from '../../services/api';

export function useAppAuthSessionState() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved =
        localStorage.getItem('sheba_auth_user') ||
        sessionStorage.getItem('sheba_auth_user');
      const token =
        localStorage.getItem('sheba_auth_token') ||
        sessionStorage.getItem('sheba_auth_token');
      // Must have both valid user profile AND active session token
      if (!saved || !token) return null;
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  const [showLoginModal, setShowLoginModal] = useState(() => {
    const saved =
      localStorage.getItem('sheba_auth_user') ||
      sessionStorage.getItem('sheba_auth_user');
    const token =
      localStorage.getItem('sheba_auth_token') ||
      sessionStorage.getItem('sheba_auth_token');
    return !saved || !token;
  });

  const [deviceBlocked, setDeviceBlocked] = useState(null);
  const [currentDeviceId, setCurrentDeviceId] = useState('');

  // Support ?login=1 or ?logout=1 in URL
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.location) {
        const params = new URLSearchParams(window.location.search);
        if (params.get('logout') === '1' || params.get('login') === '1') {
          localStorage.removeItem('sheba_auth_user');
          localStorage.removeItem('sheba_auth_token');
          sessionStorage.removeItem('sheba_auth_user');
          sessionStorage.removeItem('sheba_auth_token');
          setCurrentUser(null);
          setShowLoginModal(true);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Session Expiration Listener
  useEffect(() => {
    const handleExpired = () => {
      setCurrentUser(null);
      setShowLoginModal(true);
    };
    window.addEventListener('sheba:session_expired', handleExpired);
    return () => window.removeEventListener('sheba:session_expired', handleExpired);
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setShowLoginModal(false);
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out from Sheba ERP?')) {
      try {
        const token =
          localStorage.getItem('sheba_auth_token') ||
          sessionStorage.getItem('sheba_auth_token');
        if (token) {
          await fetch(`${API_BASE}/security/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          }).catch(() => null);
        }
      } catch (err) {
        console.error('Logout error:', err);
      }
      localStorage.removeItem('sheba_auth_user');
      localStorage.removeItem('sheba_auth_token');
      sessionStorage.removeItem('sheba_auth_user');
      sessionStorage.removeItem('sheba_auth_token');
      setCurrentUser(null);
      setShowLoginModal(true);
    }
  };

  // Session Heartbeat & Token Verification (Maintains active session)
  useEffect(() => {
    if (!currentUser) return;
    const token =
      localStorage.getItem('sheba_auth_token') ||
      sessionStorage.getItem('sheba_auth_token');
    if (!token) return;

    const verifySession = async () => {
      try {
        const currentTok =
          localStorage.getItem('sheba_auth_token') ||
          sessionStorage.getItem('sheba_auth_token');
        if (!currentTok) return;
        const res = await fetch(
          `${API_BASE}/security/session-verify?token=${encodeURIComponent(currentTok)}`
        );
        if (res.status === 401) {
          localStorage.removeItem('sheba_auth_user');
          localStorage.removeItem('sheba_auth_token');
          sessionStorage.removeItem('sheba_auth_user');
          sessionStorage.removeItem('sheba_auth_token');
          setCurrentUser(null);
          setShowLoginModal(true);
        }
      } catch (err) {
        // network retry
      }
    };

    verifySession();
    const verifyInterval = setInterval(verifySession, 30000);
    return () => clearInterval(verifyInterval);
  }, [currentUser]);

  // Auto-Logout After 10 Minutes of Inactivity
  useEffect(() => {
    if (!currentUser) return;

    const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes
    const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove'];
    let idleTimer = null;

    const clearIdleTimer = () => {
      if (idleTimer) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }
    };

    const forceLogout = () => {
      clearIdleTimer();
      const token =
        localStorage.getItem('sheba_auth_token') ||
        sessionStorage.getItem('sheba_auth_token');
      if (token) {
        fetch(`${API_BASE}/security/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        }).catch(() => null);
      }
      localStorage.removeItem('sheba_auth_user');
      localStorage.removeItem('sheba_auth_token');
      sessionStorage.removeItem('sheba_auth_user');
      sessionStorage.removeItem('sheba_auth_token');
      setCurrentUser(null);
      setShowLoginModal(true);
    };

    let lastReset = 0;
    const resetIdleTimer = () => {
      const now = Date.now();
      if (now - lastReset < 1000) return;
      lastReset = now;
      clearIdleTimer();
      idleTimer = setTimeout(forceLogout, INACTIVITY_TIMEOUT);
    };

    resetIdleTimer();
    ACTIVITY_EVENTS.forEach((eventName) =>
      window.addEventListener(eventName, resetIdleTimer, { passive: true })
    );

    return () => {
      clearIdleTimer();
      ACTIVITY_EVENTS.forEach((eventName) =>
        window.removeEventListener(eventName, resetIdleTimer)
      );
    };
  }, [currentUser]);

  // Device Limit & Access Session Management
  const checkDeviceAccess = async () => {
    try {
      let devId = localStorage.getItem('app_device_id');
      if (!devId) {
        devId =
          'dev-' +
          Math.random().toString(36).substring(2, 11) +
          '-' +
          Date.now().toString(36);
        localStorage.setItem('app_device_id', devId);
      }
      setCurrentDeviceId(devId);

      const isMobile =
        window.innerWidth <= 768 ||
        /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      const devType = isMobile ? 'mobile' : 'desktop';
      const devName =
        localStorage.getItem('app_device_name') ||
        (isMobile ? 'Mobile Phone' : 'Desktop / Laptop');

      const res = await fetch(`${API_BASE}/devices/check-or-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: devId,
          device_type: devType,
          device_name: devName,
        }),
      });
      if (!res.ok) {
        setDeviceBlocked(null);
        return;
      }
      const data = await res.json();
      if (!data.allowed) {
        setDeviceBlocked({
          deviceType: devType,
          activeDevices: data.active_devices || [],
        });
      } else {
        setDeviceBlocked(null);
      }
    } catch (err) {
      setDeviceBlocked(null);
    }
  };

  useEffect(() => {
    checkDeviceAccess();
  }, []);

  return {
    currentUser,
    setCurrentUser,
    showLoginModal,
    setShowLoginModal,
    deviceBlocked,
    setDeviceBlocked,
    currentDeviceId,
    checkDeviceAccess,
    handleLoginSuccess,
    handleLogout,
  };
}
