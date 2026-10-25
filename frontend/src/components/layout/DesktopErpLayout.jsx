import React, { useState } from 'react';
import ClassicSidebar from './LeftHoverNav';
import TopWelcomeBar from './TopWelcomeBar';
import TopLiveTickerBar from './topbar/TopLiveTickerBar';
import TrialBanner from './TrialBanner';
import AppModuleRouter from '../../routes/AppModuleRouter';
import MobileBottomNav from './MobileBottomNav';
import MobileExperienceLayer from './MobileExperienceLayer';
import AppModalsContainer from './AppModalsContainer';

export default function DesktopErpLayout({
  globalState,
  mobileActions,
  license,
  isTechnician,
}) {
  const {
    activeTab, setActiveTab, section, setSection,
    globalNav, setGlobalNav, isMobileDrawerOpen, setIsMobileDrawerOpen,
    isPurchaseOpen, setIsPurchaseOpen, isRegisterModalOpen, setIsRegisterModalOpen,
    shopInfo, currentUser, handleLoginSuccess, handleLogout, handleGlobalNavigate,
    isDevMode, exitDevModeToUserMode, toggleDevMode,
  } = globalState;

  const { openModal, openDrawer } = mobileActions;

  const [isSidebarPinned, setIsSidebarPinned] = useState(() => {
    const saved = localStorage.getItem('sheba_sidebar_pinned');
    return saved !== null ? saved === 'true' : true;
  });

  const togglePin = () => {
    setIsSidebarPinned((prev) => {
      const next = !prev;
      localStorage.setItem('sheba_sidebar_pinned', String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex">
      <ClassicSidebar
        activeSlug={section}
        currentUser={currentUser}
        shopName={shopInfo.shop_name || 'Sheba Technology'}
        shopLogo={shopInfo.logo_url}
        isPinned={isSidebarPinned}
        onTogglePin={togglePin}
        onLogout={handleLogout}
        onSelect={(slug) => {
          setSection(slug);
          setActiveTab(slug === 'products' ? 'catalog' : 'module');
        }}
      />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out">
        <TopLiveTickerBar onNavigate={handleGlobalNavigate} currentUser={currentUser} />

        <div className="page-shell w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-7 pb-20 md:pb-8 flex-1 flex flex-col">
          <TopWelcomeBar
            shopName={shopInfo.shop_name || 'Sheba Technology'}
            userName={currentUser?.name || 'Super Admin'}
            branchName={shopInfo.branch_name || 'Head Office - Dhaka'}
            currentUser={currentUser}
            isSidebarCollapsed={!isSidebarPinned}
            onToggleSidebar={togglePin}
            isDevMode={isDevMode}
            onOpenDevConsole={toggleDevMode}
            onSwitchToUserMode={exitDevModeToUserMode}
            onDeveloperLogin={(user) => {
              handleLoginSuccess(user);
              exitDevModeToUserMode();
            }}
            onQuickSale={isTechnician ? undefined : () => openModal('pos')}
            onQuickPurchase={isTechnician ? undefined : () => setIsPurchaseOpen(true)}
            onOpenRegisterModal={isTechnician ? undefined : () => setIsRegisterModalOpen(true)}
            onLogout={handleLogout}
            onNavigate={handleGlobalNavigate}
            onOpenMenu={() => setIsMobileDrawerOpen(true)}
          />

          <TrialBanner
            licenseLoading={license.loading}
            isTrial={license.isTrial}
            hasCommercialLicense={license.hasCommercialLicense}
            isLicenseValid={license.isValid}
            isLicenseBlocked={license.isBlocked}
            trialDaysRemaining={license.trialDaysRemaining}
            trialEndDate={license.trialEndDate}
            onActivate={() => handleGlobalNavigate({ section: 'settings', tab: 'license' })}
          />

          <AppModuleRouter
            section={section}
            activeTab={activeTab}
            globalNav={globalNav}
            currentUser={currentUser}
            isTechnician={isTechnician}
            setSection={setSection}
            setGlobalNav={setGlobalNav}
            handleLogout={handleLogout}
          />

          <MobileBottomNav
            section={section}
            isTechnician={isTechnician}
            onNavigate={handleGlobalNavigate}
            onOpenDrawer={() => setIsMobileDrawerOpen(true)}
            onOpenActionDrawer={openDrawer}
          />
        </div>
      </div>

      <MobileExperienceLayer
        mobileActions={mobileActions}
        isMobileDrawerOpen={isMobileDrawerOpen}
        setIsMobileDrawerOpen={setIsMobileDrawerOpen}
        section={section}
        setSection={setSection}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        shopInfo={shopInfo}
        isTechnician={isTechnician}
        onQuickPurchase={() => setIsPurchaseOpen(true)}
        onQuickRegister={() => setIsRegisterModalOpen(true)}
        handleGlobalNavigate={handleGlobalNavigate}
        handleLogout={handleLogout}
      />

      <AppModalsContainer {...globalState} />
    </div>
  );
}
