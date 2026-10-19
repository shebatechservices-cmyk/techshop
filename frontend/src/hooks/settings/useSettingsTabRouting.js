import { useState, useEffect } from 'react';

export function checkIsAdmin() {
  try {
    const saved = localStorage.getItem('sheba_auth_user') || sessionStorage.getItem('sheba_auth_user');
    const user = saved ? JSON.parse(saved) : null;
    return Boolean(user && (
      Number(user.role_id) === 1 ||
      Number(user.role_id) === 2 ||
      ['admin', 'super admin'].includes(String(user.role_name || '').toLowerCase())
    ));
  } catch {
    return false;
  }
}

export function getInitialTab() {
  if (typeof window !== 'undefined' && window.location.hash) {
    const match = window.location.hash.match(/^#settings\/(.+)$/);
    if (match && match[1]) {
      if (match[1] === 'session' && !checkIsAdmin()) return 'shop';
      return match[1];
    }
  }
  return 'shop';
}

export function useSettingsTabRouting() {
  const [activeTab, setActiveTabState] = useState(getInitialTab);

  const setActiveTab = (tabId) => {
    let nextTab = tabId;
    if (nextTab === 'session' && !checkIsAdmin()) {
      nextTab = 'shop';
    }
    setActiveTabState(nextTab);
    if (typeof window !== 'undefined') {
      window.location.hash = `#settings/${nextTab}`;
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const match = window.location.hash.match(/^#settings\/(.+)$/);
      if (match && match[1]) {
        if (match[1] === 'session' && !checkIsAdmin()) {
          setActiveTabState('shop');
          window.location.hash = '#settings/shop';
          return;
        }
        setActiveTabState(match[1]);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return {
    activeTab,
    setActiveTab,
  };
}
