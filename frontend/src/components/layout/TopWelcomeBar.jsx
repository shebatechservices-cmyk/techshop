import React, { useState, useEffect, useRef } from 'react';
import GlobalSearchBar from '../shared/GlobalSearchBar';
import RealtimeNotificationCenter from '../shared/RealtimeNotificationCenter';
import DeveloperConsoleModal from '../modals/DeveloperConsoleModal';
import Calculator from '../shared/Calculator';

export default function TopWelcomeBar({ 
  shopName = 'Sheba Technology', 
  userName = 'Super Admin',
  branchName = 'Head Office - Dhaka',
  onQuickSale,
  onQuickPurchase,
  onQuickAddProduct,
  onQuickExpense,
  onQuickWarranty,
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
  const [devToast, setDevToast] = useState({ show: false, message: '', isDev: false });
  const [showCalc, setShowCalc] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const calcRef = useRef(null);
  const userMenuRef = useRef(null);

  // Live clock
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

  // Format single compact inline date & time
  const timeString = currentDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const dateString = currentDateTime.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  // Initials for avatar
  const userInitials = (userName || 'Admin')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('') || 'A';



  return (
    <div className="w-full flex flex-col gap-2 mb-3">
      {/* 1. Top Navigation Row: Sidebar Toggle, Brand, Quick Action Dock, Utilities & Profile */}
      <header className="top-header-wrapper !mb-0 flex items-center justify-between w-full">
        {/* Left Section: Sidebar Toggle & Brand Header */}
        <div className="top-header-left">
          {onOpenMenu && (
            <button
              type="button"
              className="top-header-menu-btn mobile-only"
              onClick={onOpenMenu}
              aria-label="Toggle Navigation Sidebar"
              title="Open Full Navigation Menu"
            >
              ☰
            </button>
          )}

          <div
            className="top-header-brand"
            onClick={() => onNavigate && onNavigate({ section: 'dashboard' })}
            title="Go to Sheba ERP Dashboard"
          >
            <div className="top-header-greeting-icon">⚡</div>
            <div className="top-header-brand-info">
              <div className="top-header-brand-title">
                <span className="brand-name">{shopName || 'Sheba Technology'}</span>
                <span className="brand-badge">ERP</span>
              </div>
              <span className="brand-subtitle">{branchName || 'Network & POS Solution'}</span>
            </div>
          </div>
        </div>

        {/* Right Section: Grouped Shortcuts, Compact Clock, Utilities & User Profile */}
        <div className="top-header-right">
          {/* Quick Action Shortcuts Dock */}
          <div className="top-quick-actions-dock">
            <button
              type="button"
              onClick={onQuickSale}
              className="top-quick-btn btn-sale"
              title="Emergency POS Sale (New Invoice)"
            >
              <span>⚡</span>
              <span>Sale</span>
            </button>

            <button
              type="button"
              onClick={onQuickPurchase}
              className="top-quick-btn btn-purchase"
              title="Stock In / Purchase Order"
            >
              <span>📦</span>
              <span>Purchase</span>
            </button>

            <button
              type="button"
              onClick={onQuickAddProduct}
              className="top-quick-btn btn-product"
              title="Add New Catalog Product"
            >
              <span>➕</span>
              <span>Item</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate && onNavigate({ section: 'inventory' })}
              className="top-quick-btn btn-stock"
              title="Inventory & Stock Master"
            >
              <span>🏬</span>
              <span>Stock</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenRegisterModal && onOpenRegisterModal()}
              className="top-quick-btn btn-register"
              style={{ background: 'linear-gradient(135deg, #475569 0%, #1e293b 100%)', color: '#ffffff', borderColor: '#334155' }}
              title="End-of-Day (EOD) / Cash Register Shift Closing"
            >
              <span>🔒</span>
              <span>EOD Close</span>
            </button>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="top-quick-btn btn-reload"
              title="Sync & Refresh Page"
            >
              🔄
            </button>
          </div>

          {/* Compact Inline Date & Time */}
          <div className="top-datetime-pill" title="Dhaka Time (GMT+6)">
            <span className="datetime-icon">📅</span>
            <span className="datetime-date">{dateString}</span>
            <span className="datetime-divider">|</span>
            <span className="datetime-time">{timeString}</span>
          </div>

          {/* Utility: Quick Calculator Popover */}
          <div style={{ position: 'relative' }} ref={calcRef}>
            <button
              type="button"
              className="top-header-icon-btn"
              onClick={() => setShowCalc(!showCalc)}
              title="Quick Calculator"
            >
              🧮
            </button>

            {showCalc && (
              <Calculator
                isOpen={showCalc}
                onClose={() => setShowCalc(false)}
              />
            )}
          </div>

          {/* Utility: Realtime Notifications */}
          <RealtimeNotificationCenter onNavigate={onNavigate} compact={true} />

          {/* Utility: Developer Console Toggle (Dev Mode only) */}
          {isDevMode && (
            <button
              type="button"
              className="top-header-dev-btn"
              onClick={() => {
                if (onOpenDevConsole) onOpenDevConsole();
                else setShowDevConsole(true);
              }}
              title="Developer Console (Ctrl + Shift + D)"
            >
              <span>🛠️ Dev</span>
            </button>
          )}

          {/* User Profile Avatar & Dropdown Menu */}
          <div className="top-user-menu-container" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="top-user-avatar-btn"
              title={`${userName} (${branchName}) — Click for options`}
            >
              <div className="top-user-avatar-wrapper">
                <div className="top-user-avatar-circle">
                  {userInitials}
                </div>
                <span className="top-user-online-dot" />
              </div>
              <div className="top-user-text">
                <span className="top-user-name">{userName}</span>
                <span className="top-user-status">Online</span>
              </div>
              <span className="top-user-caret">▾</span>
            </button>

            {/* User Profile Dropdown Menu */}
            {showUserMenu && (
              <div className="top-user-dropdown-menu">
                <div className="top-user-dropdown-header">
                  <div className="top-dropdown-name">{userName}</div>
                  <div className="top-dropdown-branch">{branchName}</div>
                  <div className="top-dropdown-status">
                    <span className="top-dropdown-dot" />
                    <span>Active Session</span>
                  </div>
                </div>

                <div className="top-user-dropdown-links">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenRegisterModal && onOpenRegisterModal();
                    }}
                    className="top-dropdown-item"
                  >
                    <span>🔒</span>
                    <span>Close Shift / EOD</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onNavigate && onNavigate({ section: 'settings' });
                    }}
                    className="top-dropdown-item"
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
                    className="top-dropdown-item"
                  >
                    <span>📊</span>
                    <span>Business Reports</span>
                  </button>
                  {isDevMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        if (onOpenDevConsole) onOpenDevConsole();
                        else setShowDevConsole(true);
                      }}
                      className="top-dropdown-item dev-item"
                    >
                      <span>🛠️</span>
                      <span>Developer Console</span>
                    </button>
                  )}
                </div>

                {onLogout && (
                  <div className="top-user-dropdown-footer">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="top-dropdown-logout-btn"
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
      </header>

      {/* 2. Full-Width Global Search Bar Row */}
      <div className="w-full">
        <GlobalSearchBar onNavigate={onNavigate} compact={false} />
      </div>

      {/* Dev Mode Notification Toast */}
      {devToast.show && (
        <div className="top-dev-toast">
          <span>{devToast.isDev ? '🛠️' : '👤'}</span>
          <span>{devToast.message}</span>
        </div>
      )}

      {/* Developer Console Modal */}
      {!onOpenDevConsole && (
        <DeveloperConsoleModal
          isOpen={showDevConsole}
          onClose={() => setShowDevConsole(false)}
          onSwitchToUserMode={() => {
            setInternalDevMode(false);
            localStorage.removeItem('sheba_dev_mode');
            setShowDevConsole(false);
            setDevToast({ show: true, message: '👤 Switched to Standard User Mode', isDev: false });
            setTimeout(() => setDevToast({ show: false, message: '', isDev: false }), 2500);
          }}
          onDeveloperLogin={onDeveloperLogin}
        />
      )}
    </div>
  );
}
