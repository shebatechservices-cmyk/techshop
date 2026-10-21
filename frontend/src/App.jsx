import './style.css';
import React, { useState, useEffect } from 'react';
import useAppGlobalState from './hooks/useAppGlobalState';
import useLicenseCheck from './hooks/useLicenseCheck';
import ClassicSidebar from './components/layout/LeftHoverNav';
import TopWelcomeBar from './components/layout/TopWelcomeBar';
import TopLiveTickerBar from './components/layout/topbar/TopLiveTickerBar';
import LicenseLockScreen from './components/layout/LicenseLockScreen';
import AppModuleRouter from './routes/AppModuleRouter';
import MobileBottomNav from './components/layout/MobileBottomNav';
import TrialBanner from './components/layout/TrialBanner';
import AppModalsContainer from './components/layout/AppModalsContainer';
import AuthGateScreens from './components/layout/AuthGateScreens';
import MobileExperienceLayer from './components/layout/MobileExperienceLayer';
import MobilePocketAppShell from './components/mobile/home/MobilePocketAppShell';
import useMobileActions from './components/mobile/useMobileActions';

export default function App() {
  const globalState = useAppGlobalState();
  const {
    activeTab, setActiveTab, section, setSection,
    globalNav, setGlobalNav, isMobileDrawerOpen, setIsMobileDrawerOpen,
    isPurchaseOpen, setIsPurchaseOpen, isRegisterModalOpen, setIsRegisterModalOpen,
    shopInfo, currentUser, showLoginModal, setShowLoginModal,
    showDevConsole, isDevMode, exitDevModeToUserMode, toggleDevMode,
    deviceBlocked, setDeviceBlocked, currentDeviceId, checkDeviceAccess,
    handleLoginSuccess, handleLogout, handleGlobalNavigate,
  } = globalState;

  const mobileActions = useMobileActions();
  const { isMobileView, openModal, openDrawer } = mobileActions;

  const [isSidebarPinned, setIsSidebarPinned] = useState(() => {
    const saved = localStorage.getItem('sheba_sidebar_pinned');
    return saved !== null ? saved === 'true' : true;
  });

  const {
    isValid: isLicenseValid, isExpired: isLicenseExpired, isBlocked: isLicenseBlocked,
    isTrial, hasCommercialLicense, trialDaysRemaining, trialEndDate,
    loading: licenseLoading, licenseData: licenseDetails, recheckLicense,
  } = useLicenseCheck();

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

  if (!licenseLoading && (!isLicenseValid || isLicenseBlocked || isLicenseExpired)) {
    return <LicenseLockScreen licenseInfo={licenseDetails} onReactivated={recheckLicense} />;
  }

  if (!currentUser) {
    return (
      <AuthGateScreens
        showDevConsole={showDevConsole}
        handleLoginSuccess={handleLoginSuccess}
        toggleDevMode={toggleDevMode}
        exitDevModeToUserMode={exitDevModeToUserMode}
      />
    );
  }

  // Dedicated Native Mobile "Pocket Edition" View
  if (isMobileView && !isTechnician && section === 'dashboard') {
    return (
      <MobilePocketAppShell
        {...globalState}
        mobileActions={mobileActions}
        isTechnician={isTechnician}
      />
    );
  }

  // Classic Desktop ERP Layout
  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex">
      <ClassicSidebar
        activeSlug={section}
        currentUser={currentUser}
        shopName={shopInfo.shop_name || 'Sheba Technology'}
        shopLogo={shopInfo.logo_url}
        isPinned={isSidebarPinned}
        onTogglePin={() => {
          const next = !isSidebarPinned;
          setIsSidebarPinned(next);
          localStorage.setItem('sheba_sidebar_pinned', String(next));
        }}
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
            onToggleSidebar={() => {
              const next = !isSidebarPinned;
              setIsSidebarPinned(next);
              localStorage.setItem('sheba_sidebar_pinned', String(next));
            }}
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
            licenseLoading={licenseLoading}
            isTrial={isTrial}
            hasCommercialLicense={hasCommercialLicense}
            isLicenseValid={isLicenseValid}
            isLicenseBlocked={isLicenseBlocked}
            trialDaysRemaining={trialDaysRemaining}
            trialEndDate={trialEndDate}
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
