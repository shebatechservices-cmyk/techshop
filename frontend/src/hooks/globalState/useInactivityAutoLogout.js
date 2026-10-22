import { useEffect } from 'react';
import API_BASE from '../../services/api';

export function useInactivityAutoLogout(currentUser, setCurrentUser, setShowLoginModal) {
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
  }, [currentUser, setCurrentUser, setShowLoginModal]);
}
