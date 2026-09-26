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
    <header className="sticky top-0 z-30 w-full h-14 bg-white border-b border-slate-200 px-3 sm:px-5 flex items-center justify-between shadow-sm select-none mb-4 rounded-xl">
      {/* Left Section: Sidebar Toggle & Quick Global Search */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-xl">
        {/* Mobile Hamburger Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="md:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open Navigation Menu"
        >
          <span className="text-lg leading-none">☰</span>
        </button>

        {/* Desktop Sidebar Collapse Toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden md:flex items-center justify-center p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <span className="text-base leading-none">☰</span>
        </button>

        {/* Global Search Component */}
        <div className="flex-1 max-w-md">
          <GlobalSearchBar onNavigate={onNavigate} compact={true} />
        </div>
      </div>

      {/* Right Section: Quick POS Button, Live Clock, Utilities & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick New Sale (POS) Primary Button */}
        {!isTechnician && onQuickSale && (
          <button
            type="button"
            onClick={onQuickSale}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm hover:shadow transition-all"
            title="Open POS Terminal / New Sale"
          >
            <span className="text-sm leading-none">⚡</span>
            <span className="hidden sm:inline">POS Sale</span>
          </button>
        )}

        {/* Live Clock Pill */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600 font-mono">
          <span className="text-slate-700 font-semibold">{dateString}</span>
          <span className="text-slate-300">|</span>
          <span className="text-sky-700 font-bold">{timeString}</span>
        </div>

        {/* Quick Calculator Popover */}
        <div className="relative" ref={calcRef}>
          <button
            type="button"
            onClick={() => setShowCalc(!showCalc)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 text-sm transition-colors"
            title="Calculator"
          >
            🧮
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
            className="px-2 py-1 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-colors"
            title="Developer Console (Ctrl + Shift + D)"
          >
            🛠️ Dev
          </button>
        )}

        {/* User Profile Avatar & Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 pl-1.5 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all text-left"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
                {userInitials}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                {userName}
              </span>
              <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                {branchName}
              </span>
            </div>
            <span className="text-slate-400 text-xs">▾</span>
          </button>

          {/* User Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-fadeIn">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="font-bold text-slate-900 truncate">{userName}</div>
                <div className="text-[11px] text-slate-500 truncate">{branchName}</div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-semibold text-emerald-700 uppercase">
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
                    className="w-full px-3 py-2 flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 text-left transition-colors"
                  >
                    <span>🔒</span>
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
                      className="w-full px-3 py-2 flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 text-left transition-colors"
                    >
                      <span>⚙️</span>
                      <span>Shop Settings</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate && onNavigate({ section: 'reports' });
                      }}
                      className="w-full px-3 py-2 flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 text-left transition-colors"
                    >
                      <span>📈</span>
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
                    className="w-full px-3 py-2 flex items-center gap-2.5 text-rose-700 hover:bg-rose-50 text-left font-medium transition-colors"
                  >
                    <span>🛠️</span>
                    <span>Developer Console</span>
                  </button>
                )}
              </div>

              {onLogout && (
                <div className="pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full px-3 py-2 flex items-center gap-2.5 text-rose-600 hover:bg-rose-50 font-bold text-left transition-colors"
                  >
                    <span>🚪</span>
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
