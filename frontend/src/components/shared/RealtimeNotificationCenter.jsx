import React, { useState, useEffect, useRef } from 'react';
import { smartFetch } from '../../services/api';
import NotificationFloatingToast from './notifications/NotificationFloatingToast';
import NotificationHeader from './notifications/NotificationHeader';
import NotificationCategoryPills from './notifications/NotificationCategoryPills';
import NotificationItem from './notifications/NotificationItem';
import { playChime } from './notifications/notificationSound';

export { playChime };

export default function RealtimeNotificationCenter({ onNavigate, compact = false, currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [floatingToast, setFloatingToast] = useState(null);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  const role = (currentUser?.role || '').toUpperCase();
  const roleName = (currentUser?.role_name || '').toLowerCase();
  const isTechnician =
    role === 'TECHNICIAN' ||
    roleName.includes('technician') ||
    roleName.includes('tech') ||
    currentUser?.role_id === 4;

  // Close panel on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch live notifications from backend (scoped for technician)
  const fetchLiveNotifications = async () => {
    try {
      const params = new URLSearchParams();
      if (currentUser?.id) params.append('user_id', currentUser.id);
      if (currentUser?.role || currentUser?.role_name) {
        params.append('role', currentUser.role || currentUser.role_name);
      }
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await smartFetch(`/settings/notifications${qs}`).catch(() => null);
      if (res && res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.data)) {
          setNotifications((prev) =>
            json.data.map((item) => {
              const existing = prev.find((p) => p.id === item.id);
              if (existing) {
                return { ...item, isRead: existing.isRead };
              }
              return item;
            })
          );
        }
      }
    } catch (err) {
      console.warn('Fetch notifications notice:', err.message);
    }
  };

  useEffect(() => {
    fetchLiveNotifications();
    const interval = setInterval(fetchLiveNotifications, 30000); // 30s auto-poll
    return () => clearInterval(interval);
  }, [currentUser?.id, currentUser?.role]);

  // Reset category if switching roles
  useEffect(() => {
    if (
      isTechnician &&
      !['All', 'Assigned Projects', 'My Wallet', 'Offers & Campaigns'].includes(activeCategory)
    ) {
      setActiveCategory('All');
    }
  }, [isTechnician]);

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleToggleRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  };

  const handleClearAll = () => {
    setNotifications([]);
    setIsOpen(false);
  };

  const handleItemClick = (item) => {
    handleToggleRead(item.id);
    if (onNavigate && item.targetSection) {
      onNavigate({
        section: item.targetSection,
        tab: item.targetTab,
        search: '',
      });
      setIsOpen(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const CATEGORIES = isTechnician
    ? ['All', 'Assigned Projects', 'My Wallet', 'Offers & Campaigns']
    : [
        'All',
        'Offers & Campaigns',
        'Stock & Inventory',
        'Customer Due & Credit',
        'POS Sales',
        'Purchases',
        'New Products',
        'Warranty & Claims',
        'SOC Security',
        'SMS Gateway',
      ];

  const filteredNotifications =
    activeCategory === 'All'
      ? notifications
      : notifications.filter((n) => n.category === activeCategory);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <NotificationFloatingToast
        floatingToast={floatingToast}
        onClick={handleItemClick}
        onClose={() => setFloatingToast(null)}
      />

      {/* Bell Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all shadow-2xs ${
          isOpen
            ? 'bg-emerald-950 border-emerald-400 text-white shadow-inner'
            : 'bg-emerald-900/60 hover:bg-emerald-900 border-emerald-500/60 text-white shadow-2xs'
        }`}
        title="Live System Notifications"
      >
        <svg
          className="w-4 h-4 text-emerald-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        <span className="font-bold text-white">Alerts</span>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full leading-none">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Slide-out / Popover Notification Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '420px',
            maxWidth: '92vw',
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)',
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '560px',
            overflow: 'hidden',
          }}
        >
          <NotificationHeader
            unreadCount={unreadCount}
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
            onClose={() => setIsOpen(false)}
            onMarkAllAsRead={handleMarkAllAsRead}
          />

          <NotificationCategoryPills
            categories={CATEGORIES}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
          />

          {/* Notifications List Container */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
            {filteredNotifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: '#94a3b8' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>
                  🎉
                </span>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#64748b',
                  }}
                >
                  No notifications in this category
                </p>
                <small style={{ fontSize: '0.75rem' }}>
                  All systems and stock levels are normal
                </small>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredNotifications.map((item) => (
                  <NotificationItem
                    key={item.id}
                    item={item}
                    onClick={handleItemClick}
                    onToggleRead={handleToggleRead}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer with Clear all */}
          <div
            style={{
              padding: '10px 14px',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <button
              type="button"
              onClick={handleClearAll}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              🗑️ Clear notification list
            </button>

            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Sheba POS Live Sentinel
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
