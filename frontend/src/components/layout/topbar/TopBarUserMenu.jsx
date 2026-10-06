import React, { useState, useEffect, useRef } from 'react';

export default function TopBarUserMenu({
  currentUser,
  userName = 'Super Admin',
  branchName = 'Head Office - Dhaka',
  isTechnician = false,
  isDevMode = false,
  onOpenRegisterModal,
  onNavigate,
  onOpenDevConsole,
  onLogout,
  canInstall = false,
  installApp,
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  const role = (currentUser?.role || '').toUpperCase();

  const userInitials = (userName || 'Admin')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('') || 'A';

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={userMenuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setShowUserMenu(!showUserMenu)}
        className="flex items-center gap-3 p-1.5 pr-2.5 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all text-left"
        aria-label="User profile menu"
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
          {/* Header Details */}
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
                }}
                className="w-full px-3.5 py-2 flex items-center gap-2.5 text-rose-700 hover:bg-rose-50 text-left font-medium transition-colors"
              >
                <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <span>Developer Console</span>
              </button>
            )}

            {canInstall && (
              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  installApp && installApp();
                }}
                className="w-full px-3.5 py-2 flex items-center gap-2.5 text-sky-700 hover:bg-sky-50 text-left font-medium transition-colors"
              >
                <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Install App on Device</span>
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
  );
}
