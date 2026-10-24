import React from 'react';
import MobilePocketHome from './MobilePocketHome';
import MobileBottomNav from '../../layout/MobileBottomNav';
import MobileExperienceLayer from '../../layout/MobileExperienceLayer';
import AppModalsContainer from '../../layout/AppModalsContainer';

export default function MobilePocketAppShell({
  currentUser,
  shopInfo,
  section,
  setSection,
  setActiveTab,
  mobileActions,
  isMobileDrawerOpen,
  setIsMobileDrawerOpen,
  isPurchaseOpen,
  setIsPurchaseOpen,
  isRegisterModalOpen,
  setIsRegisterModalOpen,
  deviceBlocked,
  setDeviceBlocked,
  currentDeviceId,
  checkDeviceAccess,
  showLoginModal,
  setShowLoginModal,
  handleLoginSuccess,
  showDevConsole,
  showDevGate,
  handleGateUnlocked,
  closeDevGate,
  exitDevModeToUserMode,
  handleGlobalNavigate,
  handleLogout,
}) {
  const { toggleViewMode, openModal, openDrawer } = mobileActions;

  return (
    <div className="min-h-screen bg-slate-100/90 dark:bg-slate-950 text-slate-900 flex flex-col font-sans">
      <MobilePocketHome
        currentUser={currentUser}
        shopInfo={shopInfo}
        onToggleDesktopView={toggleViewMode}
        onOpenMenu={() => setIsMobileDrawerOpen(true)}
        onQuickPos={() => openModal('pos')}
        onQuickDue={() => openModal('due')}
        onStockLookup={() => openModal('stock')}
        onCameraScan={() => openModal('scanner')}
        onQuickExpense={() => handleGlobalNavigate({ section: 'expenses' })}
        onDailyRegister={() => setIsRegisterModalOpen(true)}
        onSelectSale={(sale) => window.dispatchEvent(new CustomEvent('mobile:preview_sale', { detail: sale }))}
        onViewAllSales={() => handleGlobalNavigate({ section: 'sales' })}
      />

      <MobileBottomNav
        section={section}
        isTechnician={false}
        onNavigate={handleGlobalNavigate}
        onOpenDrawer={() => setIsMobileDrawerOpen(true)}
        onOpenActionDrawer={openDrawer}
      />

      <MobileExperienceLayer
        mobileActions={mobileActions}
        isMobileDrawerOpen={isMobileDrawerOpen}
        setIsMobileDrawerOpen={setIsMobileDrawerOpen}
        section={section}
        setSection={setSection}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        shopInfo={shopInfo}
        isTechnician={false}
        onQuickPurchase={() => setIsPurchaseOpen(true)}
        onQuickRegister={() => setIsRegisterModalOpen(true)}
        handleGlobalNavigate={handleGlobalNavigate}
        handleLogout={handleLogout}
      />

      <AppModalsContainer
        isPurchaseOpen={isPurchaseOpen}
        setIsPurchaseOpen={setIsPurchaseOpen}
        deviceBlocked={deviceBlocked}
        setDeviceBlocked={setDeviceBlocked}
        currentDeviceId={currentDeviceId}
        checkDeviceAccess={checkDeviceAccess}
        showLoginModal={showLoginModal}
        setShowLoginModal={setShowLoginModal}
        currentUser={currentUser}
        handleLoginSuccess={handleLoginSuccess}
        showDevConsole={showDevConsole}
        showDevGate={showDevGate}
        handleGateUnlocked={handleGateUnlocked}
        closeDevGate={closeDevGate}
        exitDevModeToUserMode={exitDevModeToUserMode}
        isRegisterModalOpen={isRegisterModalOpen}
        setIsRegisterModalOpen={setIsRegisterModalOpen}
        shopInfo={shopInfo}
      />
    </div>
  );
}
