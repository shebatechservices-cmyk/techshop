import React, { createContext, useContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import useSettingsManager from '../../../hooks/useSettingsManager';
import { TABS } from '../../../utils/settingsConstants';

export const SettingsContext = createContext(null);

export function SettingsProvider({ children, onLogout, currentUser, value: customValue }) {
  const location = useLocation();
  const pathname = location?.pathname || '';
  const manager = useSettingsManager();

  const user = useMemo(() => {
    if (currentUser) return currentUser;
    try {
      const saved =
        localStorage.getItem('sheba_auth_user') ||
        sessionStorage.getItem('sheba_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, [currentUser]);

  const isAdmin = useMemo(() => {
    return Boolean(
      user &&
        (Number(user.role_id) === 1 ||
          Number(user.role_id) === 2 ||
          ['admin', 'super admin'].includes(String(user.role_name || '').toLowerCase()))
    );
  }, [user]);

  const visibleTabs = useMemo(() => {
    return TABS.filter((tab) => tab.id !== 'session' || isAdmin);
  }, [isAdmin]);

  const activeTabId = useMemo(() => {
    for (const t of visibleTabs) {
      if (pathname.endsWith(`/${t.id}`) || pathname.includes(`/${t.id}`)) return t.id;
    }
    return 'shop';
  }, [visibleTabs, pathname]);

  const contextValue = useMemo(() => {
    if (customValue) return customValue;
    return {
      ...manager,
      onLogout,
      currentUser: currentUser || user,
      user,
      isAdmin,
      visibleTabs,
      activeTabId,
    };
  }, [customValue, manager, onLogout, currentUser, user, isAdmin, visibleTabs, activeTabId]);

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  return context || {};
}

export default SettingsContext;
