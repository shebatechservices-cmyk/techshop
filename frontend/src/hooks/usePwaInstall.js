import { useState, useEffect } from 'react';

export default function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  });
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('pwa_prompt_dismissed') === 'true';
  });

  useEffect(() => {
    // Check display-mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e) => {
      if (e.matches) {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    };
    if (mediaQuery?.addEventListener) {
      mediaQuery.addEventListener('change', handleDisplayModeChange);
    }

    // Intercept beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      localStorage.setItem('pwa_app_installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (mediaQuery?.removeEventListener) {
        mediaQuery.removeEventListener('change', handleDisplayModeChange);
      }
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      return false;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    return outcome === 'accepted';
  };

  const dismissPrompt = () => {
    setIsDismissed(true);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  return {
    canInstall: !isInstalled && !!deferredPrompt,
    isInstalled,
    isDismissed,
    installApp,
    dismissPrompt,
  };
}
