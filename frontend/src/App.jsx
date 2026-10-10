import './style.css';
import React, { useState, useEffect } from 'react';
import useAppGlobalState from './hooks/useAppGlobalState';
import useLicenseCheck from './hooks/useLicenseCheck';
import ClassicSidebar from './components/layout/LeftHoverNav';
import TopWelcomeBar from './components/layout/TopWelcomeBar';
import MobileQuickActionFab from './components/layout/MobileQuickActionFab';
import MobileNavDrawer from './components/layout/MobileNavDrawer';
import LicenseLockScreen from './components/layout/LicenseLockScreen';
import LoginModal from './components/modals/LoginModal';
import DeveloperConsoleModal from './components/modals/DeveloperConsoleModal';
import AppModuleRouter from './routes/AppModuleRouter';
import MobileBottomNav from './components/layout/MobileBottomNav';
import TrialBanner from './components/layout/TrialBanner';
import AppModalsContainer from './components/layout/AppModalsContainer';

export default function App() {
  const {
    activeTab,
    setActiveTab,
    section,
    setSection,
    globalNav,
    setGlobalNav,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    isPurchaseOpen,
    setIsPurchaseOpen,
    isRegisterModalOpen,
    setIsRegisterModalOpen,
    shopInfo,
    currentUser,
    showLoginModal,
    setShowLoginModal,
    showDevConsole,
    isDevMode,
    exitDevModeToUserMode,
    toggleDevMode,
    deviceBlocked,
    setDeviceBlocked,
    currentDeviceId,
    checkDeviceAccess,
    handleLoginSuccess,
    handleLogout,
    handleGlobalNavigate,
  } = useAppGlobalState();

  const [isSidebarPinned, setIsSidebarPinned] = useState(() => {
    return localStorage.getItem('sheba_sidebar_pinned') === 'true';
  });

  const {
    isValid: isLicenseValid,
    isExpired: isLicenseExpired,
    isBlocked: isLicenseBlocked,
    isTrial,
    hasCommercialLicense,
    trialDaysRemaining,
    trialEndDate,
    loading: licenseLoading,
    licenseData: licenseDetails,
    recheckLicense,
  } = useLicenseCheck();

  const userRole = (currentUser?.role || '').toUpperCase();
  const userRoleName = (currentUser?.role_name || '').toLowerCase();
  const isTechnician =
    userRole === 'TECHNICIAN' ||
    userRoleName.includes('technician') ||
    userRoleName.includes('tech') ||
    currentUser?.role_id === 4;

  // Strict Technician Route Guard: Technicians can ONLY access projects, inventory, and wallet
  useEffect(() => {
    if (isTechnician) {
      const allowedTechSections = ['projects', 'inventory', 'wallet'];
      if (!allowedTechSections.includes(section)) {
        setSection('projects');
      }
    }
  }, [isTechnician, section, setSection]);

  // Strict Vendor License Kill-Switch Gate
  if (!licenseLoading && (!isLicenseValid || isLicenseBlocked || isLicenseExpired)) {
    return (
      <LicenseLockScreen
        licenseInfo={licenseDetails}
        onReactivated={recheckLicense}
      />
    );
  }

  // Strict Full-Screen Login Gate
  if (!currentUser) {
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

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex">
      {/* Classic Desktop ERP Sidebar */}
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
          if (slug === 'products') {
            setActiveTab('catalog');
          } else {
            setActiveTab('module');
          }
        }}
      />

      {/* Main Content Workspace Shell */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out">
        <div className="page-shell w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-7 pb-20 md:pb-8 flex-1 flex flex-col">
          {/* Classic Top Navigation Bar */}
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
            onQuickSale={isTechnician ? undefined : () => handleGlobalNavigate({ section: 'sales', tab: 'new' })}
            onQuickPurchase={isTechnician ? undefined : () => setIsPurchaseOpen(true)}
            onOpenRegisterModal={isTechnician ? undefined : () => setIsRegisterModalOpen(true)}
            onLogout={handleLogout}
            onNavigate={handleGlobalNavigate}
            onOpenMenu={() => setIsMobileDrawerOpen(true)}
          />

          {/* 15-Day Free Trial Alert Banner */}
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

          {/* Dynamic Module Route View */}
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

          {/* Mobile Bottom Navigation Bar (Hidden on Desktop) */}
          <MobileBottomNav
            section={section}
            isTechnician={isTechnician}
            onNavigate={handleGlobalNavigate}
            onOpenDrawer={() => setIsMobileDrawerOpen(true)}
          />
        </div>
      </div>

      {/* Mobile Floating Action Button (Hidden on Desktop & for Technicians) */}
      {!isTechnician && (
        <div className="md:hidden">
          <MobileQuickActionFab
            onQuickSale={() => {
              setSection('sales');
              setGlobalNav({ section: 'sales', tab: 'new', key: Date.now() });
            }}
            onQuickPurchase={() => setIsPurchaseOpen(true)}
            onQuickExpense={() => {
              setSection('expenses');
              setGlobalNav({ section: 'expenses', key: Date.now() });
            }}
            onQuickScanner={() => {
              setSection('inventory');
              setGlobalNav({ section: 'inventory', key: Date.now() });
            }}
            onQuickAddProduct={() => {
              setSection('products');
              window.dispatchEvent(new CustomEvent('open-add-product'));
            }}
          />
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      <MobileNavDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        activeSlug={section}
        onSelect={(slug) => {
          setSection(slug);
          if (slug === 'products') {
            setActiveTab('catalog');
          } else {
            setActiveTab('module');
          }
        }}
        shopName={shopInfo.shop_name || 'Sheba Technology'}
        shopLogo={shopInfo.logo_url}
        userName={currentUser?.name || 'Super Admin'}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Global Application Modals Container */}
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
        toggleDevMode={toggleDevMode}
        showDevConsole={showDevConsole}
        exitDevModeToUserMode={exitDevModeToUserMode}
        isRegisterModalOpen={isRegisterModalOpen}
        setIsRegisterModalOpen={setIsRegisterModalOpen}
        shopInfo={shopInfo}
      />
    </div>
  );
}
