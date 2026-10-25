import './style.css';
import React, { useEffect } from 'react';
import useAppGlobalState from './hooks/useAppGlobalState';
import useLicenseCheck from './hooks/useLicenseCheck';
import useServerWakeupDetector from './hooks/useServerWakeupDetector';
import ServerWakeupScreen from './components/layout/wakeup/ServerWakeupScreen';
import LicenseLockScreen from './components/layout/LicenseLockScreen';
import AuthGateScreens from './components/layout/AuthGateScreens';
import MobilePocketAppShell from './components/mobile/home/MobilePocketAppShell';
import useMobileActions from './components/mobile/useMobileActions';
import DesktopErpLayout from './components/layout/DesktopErpLayout';

export default function App() {
  const globalState = useAppGlobalState();
  const wakeupDetector = useServerWakeupDetector();
  const mobileActions = useMobileActions();
  const license = useLicenseCheck();

  const {
    section, setSection, currentUser, showDevConsole, showDevGate,
    handleGateUnlocked, closeDevGate, handleLoginSuccess, exitDevModeToUserMode,
  } = globalState;

  const userRole = (currentUser?.role || '').toUpperCase();
  const isTechnician =
    userRole === 'TECHNICIAN' ||
    (currentUser?.role_name || '').toLowerCase().includes('tech') ||
    currentUser?.role_id === 4;

  useEffect(() => {
    if (isTechnician) {
      const allowed = ['projects', 'ecommerce', 'warranty', 'wallet'];
      if (!allowed.includes(section)) setSection('projects');
    }
  }, [isTechnician, section, setSection]);

  // 1. Dedicated Render Server Cold-Start Waiting Screen
  if (wakeupDetector.isWakingUp) {
    return (
      <ServerWakeupScreen
        elapsedSeconds={wakeupDetector.elapsedSeconds}
        progress={wakeupDetector.progress}
        status={wakeupDetector.status}
        serverUrl={wakeupDetector.serverUrl}
        onRetry={wakeupDetector.retry}
        onSkip={wakeupDetector.skip}
        onChangeServer={wakeupDetector.changeServer}
      />
    );
  }

  // 2. Commercial / Trial License Gate
  if (!license.loading && (!license.isValid || license.isBlocked || license.isExpired)) {
    return (
      <LicenseLockScreen
        licenseInfo={license.licenseData}
        onReactivated={license.recheckLicense}
      />
    );
  }

  // 3. User Authentication Barrier
  if (!currentUser) {
    return (
      <AuthGateScreens
        showDevConsole={showDevConsole}
        showDevGate={showDevGate}
        handleGateUnlocked={handleGateUnlocked}
        closeDevGate={closeDevGate}
        handleLoginSuccess={handleLoginSuccess}
        exitDevModeToUserMode={exitDevModeToUserMode}
      />
    );
  }

  // 4. Dedicated Native Mobile "Pocket Edition" View
  if (mobileActions.isMobileView && !isTechnician && section === 'dashboard') {
    return (
      <MobilePocketAppShell
        {...globalState}
        mobileActions={mobileActions}
        isTechnician={isTechnician}
      />
    );
  }

  // 5. Classic Desktop & Tablet ERP View
  return (
    <DesktopErpLayout
      globalState={globalState}
      mobileActions={mobileActions}
      license={license}
      isTechnician={isTechnician}
    />
  );
}
