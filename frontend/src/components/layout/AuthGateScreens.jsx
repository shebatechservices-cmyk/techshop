import React from 'react';
import LoginModal from '../modals/LoginModal';
import DeveloperConsoleModal from '../modals/DeveloperConsoleModal';
import DevGateModal from '../modals/dev/DevGateModal';

export default function AuthGateScreens({
  showDevConsole,
  showDevGate,
  handleGateUnlocked,
  closeDevGate,
  handleLoginSuccess,
  exitDevModeToUserMode,
}) {
  return (
    <>
      <LoginModal
        isOpen={true}
        canClose={false}
        onLoginSuccess={handleLoginSuccess}
      />
      <DevGateModal
        isOpen={showDevGate}
        onClose={closeDevGate}
        onUnlocked={handleGateUnlocked}
      />
      <DeveloperConsoleModal
        isOpen={showDevConsole}
        onClose={exitDevModeToUserMode}
        onSwitchToUserMode={exitDevModeToUserMode}
        onDeveloperLogin={(user) => {
          handleLoginSuccess(user);
          exitDevModeToUserMode();
        }}
      />
    </>
  );
}
