import React from 'react';
import LoginModal from '../modals/LoginModal';
import DeveloperConsoleModal from '../modals/DeveloperConsoleModal';

export default function AuthGateScreens({
  showDevConsole,
  handleLoginSuccess,
  toggleDevMode,
  exitDevModeToUserMode,
}) {
  return (
    <>
      <LoginModal
        isOpen={true}
        canClose={false}
        onLoginSuccess={handleLoginSuccess}
        onOpenDevConsole={toggleDevMode}
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
