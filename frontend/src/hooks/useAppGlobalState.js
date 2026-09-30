/**
 * Global Application State Hook (Composed Architecture)
 * Architectural Decomposition: SRP & Hook Composition
 * 
 * Sub-hooks:
 * - ./globalState/useAppRoutingState.js: URL syncing, history, document.title, activeTab, section navigation
 * - ./globalState/useAppDevModeState.js: Developer console shortcuts & dev mode toggles
 * - ./globalState/useAppConfigState.js: Shop branding & license state verification
 * - ./globalState/useAppAuthSessionState.js: Auth session, login/logout, inactivity auto-logout, heartbeat, device lock
 */

import { useState } from 'react';
import { useAppRoutingState, SECTION_TITLES } from './globalState/useAppRoutingState';
import { useAppDevModeState } from './globalState/useAppDevModeState';
import { useAppConfigState } from './globalState/useAppConfigState';
import { useAppAuthSessionState } from './globalState/useAppAuthSessionState';

export { SECTION_TITLES };

export default function useAppGlobalState() {
  // Modal UI toggles
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Modular Sub-hooks
  const authSession = useAppAuthSessionState();
  const config = useAppConfigState(authSession.currentUser);
  const routing = useAppRoutingState(config.shopInfo?.shop_name);
  const devMode = useAppDevModeState();

  return {
    // 1. Navigation & Routing
    activeTab: routing.activeTab,
    setActiveTab: routing.setActiveTab,
    section: routing.section,
    setSection: routing.setSection,
    globalNav: routing.globalNav,
    setGlobalNav: routing.setGlobalNav,
    handleGlobalNavigate: routing.handleGlobalNavigate,

    // 2. Global Modal Toggles
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    isPurchaseOpen,
    setIsPurchaseOpen,
    isRegisterModalOpen,
    setIsRegisterModalOpen,

    // 3. Shop & License Configuration
    shopInfo: config.shopInfo,
    setShopInfo: config.setShopInfo,
    licenseState: config.licenseState,
    fetchLicenseCheck: config.fetchLicenseCheck,

    // 4. Authentication & Device Access
    currentUser: authSession.currentUser,
    setCurrentUser: authSession.setCurrentUser,
    showLoginModal: authSession.showLoginModal,
    setShowLoginModal: authSession.setShowLoginModal,
    deviceBlocked: authSession.deviceBlocked,
    setDeviceBlocked: authSession.setDeviceBlocked,
    currentDeviceId: authSession.currentDeviceId,
    checkDeviceAccess: authSession.checkDeviceAccess,
    handleLoginSuccess: authSession.handleLoginSuccess,
    handleLogout: authSession.handleLogout,

    // 5. Developer Mode
    showDevConsole: devMode.showDevConsole,
    setShowDevConsole: devMode.setShowDevConsole,
    isDevMode: devMode.isDevMode,
    setIsDevMode: devMode.setIsDevMode,
    exitDevModeToUserMode: devMode.exitDevModeToUserMode,
    toggleDevMode: devMode.toggleDevMode,
  };
}
