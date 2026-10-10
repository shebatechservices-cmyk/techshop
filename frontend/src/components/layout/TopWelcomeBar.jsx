import React, { useState, useEffect, useRef } from 'react';
import GlobalSearchBar from '../shared/GlobalSearchBar';
import RealtimeNotificationCenter from '../shared/RealtimeNotificationCenter';
import DeveloperConsoleModal from '../modals/DeveloperConsoleModal';
import Calculator from '../shared/Calculator';
import usePwaInstall from '../../hooks/usePwaInstall';
import LiveClockPill from './topbar/LiveClockPill';
import TopBarUserMenu from './topbar/TopBarUserMenu';
import ThemeSwitcherModal from './ThemeSwitcherModal';
import { useTheme } from '../../context/ThemeContext';

export default function TopWelcomeBar({
  shopName = 'Sheba Technology',
  userName = 'Super Admin',
  branchName = 'Head Office - Dhaka',
  currentUser,
  isSidebarCollapsed,
  onToggleSidebar,
  onQuickSale,
  onQuickPurchase,
  onOpenRegisterModal,
  onLogout,
  onNavigate,
  onOpenMenu,
  isDevMode: propDevMode,
  onOpenDevConsole,
  onSwitchToUserMode,
  onDeveloperLogin,
}) {
  const { currentThemeMeta } = useTheme();
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [internalDevMode] = useState(() => localStorage.getItem('sheba_dev_mode') !== 'false');
  const isDevMode = propDevMode !== undefined ? propDevMode : internalDevMode;
  const [showDevConsole, setShowDevConsole] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const calcRef = useRef(null);
  const { canInstall, installApp } = usePwaInstall();

  const role = (currentUser?.role || '').toUpperCase();
  const roleName = (currentUser?.role_name || '').toLowerCase();
  const isTechnician = role === 'TECHNICIAN' || roleName.includes('technician') || roleName.includes('tech') || currentUser?.role_id === 4;

  // Close calculator popover on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (calcRef.current && !calcRef.current.contains(event.target)) {
        setShowCalc(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full h-14 sm:h-16 bg-white border-b border-gray-200 px-2.5 sm:px-6 flex items-center justify-between shadow-xs select-none mb-2 sm:mb-4">
      {/* Left Section: Sidebar Toggle & Quick Global Search */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-xl">
        {/* Mobile Hamburger Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="md:hidden p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none flex-shrink-0"
          aria-label="Open Navigation Menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Desktop Sidebar Collapse Toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden md:flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none"
          title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Global Search Component */}
        <div className="flex-1 max-w-md">
          <GlobalSearchBar onNavigate={onNavigate} compact={true} />
        </div>
      </div>

      {/* Right Section: Quick POS Button, Live Clock, Utilities & User Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Quick New Sale (POS) Primary Button */}
        {!isTechnician && onQuickSale && (
          <button
            type="button"
            onClick={onQuickSale}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-lg text-xs font-bold shadow-sm hover:shadow transition-all"
            title="Open POS Terminal / New Sale"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="hidden sm:inline">POS Sale</span>
          </button>
        )}

        {/* Live Clock Pill Component */}
        <LiveClockPill />

        {/* Global Theme Switcher Button */}
        <button
          type="button"
          onClick={() => setIsThemeModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors shadow-xs"
          title={`Theme: ${currentThemeMeta?.name || 'Indigo'} (Click to change)`}
        >
          <span
            className="w-2.5 h-2.5 rounded-full inline-block shadow-xs border border-white"
            style={{ backgroundColor: currentThemeMeta?.primary || '#4f46e5' }}
          />
          <span className="hidden sm:inline">Theme</span>
        </button>

        {/* Quick Calculator Popover */}
        <div className="relative hidden sm:block" ref={calcRef}>
          <button
            type="button"
            onClick={() => setShowCalc(!showCalc)}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 transition-colors flex items-center justify-center"
            title="Calculator"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <line x1="8" y1="6" x2="16" y2="6" />
              <line x1="8" y1="10" x2="8" y2="10.01" />
              <line x1="12" y1="10" x2="12" y2="10.01" />
              <line x1="16" y1="10" x2="16" y2="10.01" />
              <line x1="8" y1="14" x2="8" y2="14.01" />
              <line x1="12" y1="14" x2="12" y2="14.01" />
              <line x1="16" y1="14" x2="16" y2="14.01" />
              <line x1="8" y1="18" x2="8" y2="18.01" />
              <line x1="12" y1="18" x2="12" y2="18.01" />
              <line x1="16" y1="18" x2="16" y2="18.01" />
            </svg>
          </button>
          {showCalc && <Calculator isOpen={showCalc} onClose={() => setShowCalc(false)} />}
        </div>

        {/* Realtime Notification Center */}
        <RealtimeNotificationCenter onNavigate={onNavigate} compact={true} />

        {/* Android APK Download Button */}
        <a
          href="/uploads/apk/sheba-pos.apk"
          download="sheba-pos.apk"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors shadow-xs"
          title="Download Android APK (Direct Install)"
        >
          <span className="text-sm leading-none">🤖</span>
          <span className="hidden xl:inline">Download APK</span>
        </a>

        {/* PWA Mobile/Desktop Install Button */}
        {canInstall && (
          <button
            type="button"
            onClick={installApp}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 rounded-lg text-xs font-bold transition-colors shadow-xs"
            title="Install Sheba App on Device"
          >
            <svg className="w-3.5 h-3.5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">Install App</span>
          </button>
        )}

        {/* Developer Console Shortcut (If Active) */}
        {isDevMode && (
          <button
            type="button"
            onClick={() => {
              if (onOpenDevConsole) onOpenDevConsole();
              else setShowDevConsole(true);
            }}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-colors"
            title="Developer Console (Ctrl + Shift + D)"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span>Dev</span>
          </button>
        )}

        {/* User Profile Avatar & Dropdown Component */}
        <TopBarUserMenu
          currentUser={currentUser}
          userName={userName}
          branchName={branchName}
          isTechnician={isTechnician}
          isDevMode={isDevMode}
          onOpenRegisterModal={onOpenRegisterModal}
          onNavigate={onNavigate}
          onOpenDevConsole={onOpenDevConsole ? onOpenDevConsole : () => setShowDevConsole(true)}
          onLogout={onLogout}
          canInstall={canInstall}
          installApp={installApp}
        />
      </div>

      {/* Global Theme Switcher Modal */}
      <ThemeSwitcherModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />

      {/* Developer Console Modal Fallback */}
      {!onOpenDevConsole && (
        <DeveloperConsoleModal
          isOpen={showDevConsole}
          onClose={() => setShowDevConsole(false)}
          onSwitchToUserMode={onSwitchToUserMode}
          onDeveloperLogin={onDeveloperLogin}
        />
      )}
    </header>
  );
}
