import { useState, useEffect } from 'react';
import {
  getDevShortcutConfig,
  isShortcutMatch,
  isDevSessionUnlocked,
  lockDevSession,
} from '../../utils/devConsoleConfig';

export function useAppDevModeState() {
  const [showDevConsole, setShowDevConsole] = useState(false);
  const [showDevGate, setShowDevGate] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);

  // Trigger Dev Entry with Password Gate Protection
  const triggerDevEntry = () => {
    if (isDevSessionUnlocked()) {
      setShowDevConsole(true);
      setIsDevMode(true);
    } else {
      setShowDevGate(true);
    }
  };

  const handleGateUnlocked = () => {
    setShowDevGate(false);
    setShowDevConsole(true);
    setIsDevMode(true);
  };

  const closeDevGate = () => {
    setShowDevGate(false);
  };

  const exitDevModeToUserMode = () => {
    setShowDevConsole(false);
    setShowDevGate(false);
    setIsDevMode(false);
    lockDevSession();
  };

  // Support ?dev=1 in URL (still requires password gate)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.location) {
        const params = new URLSearchParams(window.location.search);
        if (params.get('dev') === '1') {
          triggerDevEntry();
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Global Dynamic Secret Developer Console Shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.repeat) return;
      const config = getDevShortcutConfig();

      if (isShortcutMatch(e, config)) {
        e.preventDefault();
        e.stopPropagation();
        triggerDevEntry();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  return {
    showDevConsole,
    setShowDevConsole,
    showDevGate,
    setShowDevGate,
    isDevMode,
    setIsDevMode,
    triggerDevEntry,
    handleGateUnlocked,
    closeDevGate,
    exitDevModeToUserMode,
    toggleDevMode: triggerDevEntry,
  };
}

export default useAppDevModeState;
