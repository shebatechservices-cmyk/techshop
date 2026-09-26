import React, { useState, useEffect, useRef } from 'react';
import GlobalSearchBar from '../shared/GlobalSearchBar';
import RealtimeNotificationCenter from '../shared/RealtimeNotificationCenter';
import DeveloperConsoleModal from '../modals/DeveloperConsoleModal';
import Calculator from '../shared/Calculator';

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
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [internalDevMode, setInternalDevMode] = useState(() => localStorage.getItem('sheba_dev_mode') !== 'false');
  const isDevMode = propDevMode !== undefined ? propDevMode : internalDevMode;
  const [showDevConsole, setShowDevConsole] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const calcRef = useRef(null);
  const userMenuRef = useRef(null);

  const role = (currentUser?.role || '').toUpperCase();
  const roleName = (currentUser?.role_name || '').toLowerCase();
  const isTechnician = role === 'TECHNICIAN' || roleName.includes('technician') || roleName.includes('tech') || currentUser?.role_id === 4;

  // Live clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (calcRef.current && !calcRef.current.contains(event.target)) {
        setShowCalc(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format compact inline date & time
  const timeString = currentDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const dateString = currentDateTime.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const userInitials = (userName || 'Admin')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('') || 'A';

  return (
    <header className="sticky top-0 z-30 w-full h-16 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between shadow-sm select-none mb-4">
      {/* Left Section: Sidebar Toggle & Quick Global Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        {/* Mobile Hamburger Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none"
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
      <div className="flex items-center gap-4 sm:gap-5">
        {/* Quick New Sale (POS) Primary Button */}
        {!isTechnician && onQuickSale && (
          <button
            type="button"
            onClick={onQuickSale}
            className="flex items-center gap-2 px-3.5 py-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-lg text-xs font-bold shadow-sm hover:shadow transition-all"
            title="Open POS Terminal / New Sale"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="hidden sm:inline">POS Sale</span>
          </button>
        )}

        {/* Live Clock Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 font-mono">
          <span className="text-gray-800 font-semibold">{dateString}</span>
          <span className="text-gray-300">|</span>
          <span className="text-sky-700 font-bold">{timeString}</span>
        </div>

        {/* Quick Calculator Popover */}
        <div className="relative" ref={calcRef}>
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

        {/* Developer Console Shortcut (If Active) */}
        {isDevMode && (
          <button
            type="button"
            onClick={() => {
              if (onOpenDevConsole) onOpenDevConsole();
              else setShowDevConsole(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-colors"
            title="Developer Console (Ctrl + Shift + D)"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span>Dev</span>
          </button>
        )}

        {/* User Profile Avatar & Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-1.5 pr-2.5 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all text-left"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {userInitials}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
            </div>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-xs font-bold text-gray-800 truncate max-w-[120px]">
                {userName}
              </span>
              <span className="text-[10px] text-gray-500 truncate max-w-[120px]">
                {branchName}
              </span>
            </div>
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* User Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 text-xs animate-fadeIn">
              <div className="px-3.5 py-2.5 border-b border-gray-100">
                <div className="font-bold text-gray-900 truncate">{userName}</div>
                <div className="text-[11px] text-gray-500 truncate">{branchName}</div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-[10px] font-bold text-green-700 uppercase tracking-wide">
                    {role || 'STAFF'}
                  </span>
                </div>
              </div>

              <div className="py-1">
                {!isTechnician && onOpenRegisterModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenRegisterModal();
                    }}
                    className="w-full px-3.5 py-2 flex items-center gap-2.5 text-gray-700 hover:bg-gray-50 text-left transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Shift Closing (EOD)</span>
                  </button>
                )}

                {!isTechnician && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate && onNavigate({ section: 'settings' });
                      }}
                      className="w-full px-3.5 py-2 flex items-center gap-2.5 text-gray-700 hover:bg-gray-50 text-left transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Shop Settings</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate && onNavigate({ section: 'reports' });
                      }}
                      className="w-full px-3.5 py-2 flex items-center gap-2.5 text-gray-700 hover:bg-gray-50 text-left transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>Analytics & Reports</span>
                    </button>
                  </>
                )}

                {isDevMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      if (onOpenDevConsole) onOpenDevConsole();
                      else setShowDevConsole(true);
                    }}
                    className="w-full px-3.5 py-2 flex items-center gap-2.5 text-rose-700 hover:bg-rose-50 text-left font-medium transition-colors"
                  >
                    <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <span>Developer Console</span>
                  </button>
                )}
              </div>

              {onLogout && (
                <div className="pt-1 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full px-3.5 py-2 flex items-center gap-2.5 text-rose-600 hover:bg-rose-50 font-bold text-left transition-colors"
                  >
                    <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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

