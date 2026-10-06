import React from 'react';
import PurchaseOrderModal from '../../Pages/Purchases/modals/PurchaseOrderModal';
import DeviceLimitModal from '../modals/DeviceLimitModal';
import LoginModal from '../modals/LoginModal';
import DeveloperConsoleModal from '../modals/DeveloperConsoleModal';
import RegisterClosingModal from '../modals/RegisterClosingModal';
import PwaInstallPrompt from '../shared/PwaInstallPrompt';

export default function AppModalsContainer({
  isPurchaseOpen,
  setIsPurchaseOpen,
  deviceBlocked,
  setDeviceBlocked,
  currentDeviceId,
  checkDeviceAccess,
  showLoginModal,
  setShowLoginModal,
  currentUser,
  handleLoginSuccess,
  toggleDevMode,
  showDevConsole,
  exitDevModeToUserMode,
  isRegisterModalOpen,
  setIsRegisterModalOpen,
  shopInfo,
}) {
  return (
    <>
      {/* Purchase Order Modal */}
      {isPurchaseOpen && (
        <PurchaseOrderModal
          products={[]}
          onClose={() => setIsPurchaseOpen(false)}
          onSaved={() => {
            setIsPurchaseOpen(false);
            window.dispatchEvent(new CustomEvent('products_changed'));
          }}
        />
      )}

      {/* Device Session Limit Barrier Modal */}
      {deviceBlocked && (
        <DeviceLimitModal
          currentDeviceId={currentDeviceId}
          deviceType={deviceBlocked.deviceType}
          activeDevices={deviceBlocked.activeDevices}
          onRetry={checkDeviceAccess}
          onClose={() => setDeviceBlocked(null)}
        />
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal || !currentUser}
        onLoginSuccess={handleLoginSuccess}
        canClose={!!currentUser}
        onClose={() => setShowLoginModal(false)}
        onOpenDevConsole={toggleDevMode}
      />

      {/* Super Admin & Developer Console Modal */}
      <DeveloperConsoleModal
        isOpen={showDevConsole}
        onClose={exitDevModeToUserMode}
        onSwitchToUserMode={exitDevModeToUserMode}
        onDeveloperLogin={(user) => {
          handleLoginSuccess(user);
          exitDevModeToUserMode();
        }}
      />

      {/* Cash Register Shift Closing Modal */}
      <RegisterClosingModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        currentUser={currentUser}
        shopInfo={shopInfo}
      />

      {/* PWA Android / Desktop Install Prompt */}
      <PwaInstallPrompt />
    </>
  );
}
