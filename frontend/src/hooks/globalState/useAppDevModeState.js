import { useState, useEffect } from 'react';

export function useAppDevModeState() {
  const [showDevConsole, setShowDevConsole] = useState(false);
  const [isDevMode, setIsDevMode] = useState(() => {
    return localStorage.getItem('sheba_dev_mode') !== 'false';
  });

  // Support ?dev=1 in URL
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.location) {
        const params = new URLSearchParams(window.location.search);
        if (params.get('dev') === '1') {
          setShowDevConsole(true);
          setIsDevMode(true);
          localStorage.setItem('sheba_dev_mode', 'true');
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const exitDevModeToUserMode = () => {
    setIsDevMode(false);
    setShowDevConsole(false);
    localStorage.setItem('sheba_dev_mode', 'false');
  };

  const toggleDevMode = () => {
    setShowDevConsole((prev) => {
      const next = !prev;
      if (next) {
        setIsDevMode(true);
        localStorage.setItem('sheba_dev_mode', 'true');
      } else {
        setIsDevMode(false);
        localStorage.setItem('sheba_dev_mode', 'false');
      }
      return next;
    });
  };

  // Global Secret Developer Console Shortcut (Ctrl + Shift + D or Ctrl + Alt + D)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.repeat) return;
      const isDKey =
        e.key === 'D' || e.key === 'd' || e.code === 'KeyD' || e.keyCode === 68;
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const isShiftOrAlt = e.shiftKey || e.altKey;

      if (isCtrlOrMeta && isShiftOrAlt && isDKey) {
        e.preventDefault();
        e.stopPropagation();
        toggleDevMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  return {
    showDevConsole,
    setShowDevConsole,
    isDevMode,
    setIsDevMode,
    exitDevModeToUserMode,
    toggleDevMode,
  };
}
