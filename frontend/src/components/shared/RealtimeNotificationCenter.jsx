import React, { useState, useEffect, useRef } from 'react';
import API from '../../services/api';

const DEFAULT_NOTIFICATIONS = [];

// Pleasant synthesized Web Audio chime (zero external files required)
function playChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.28);
  } catch (e) {
    // Audio context may be restricted by browser policy before first interaction
  }
}

export default function RealtimeNotificationCenter({ onNavigate, compact = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [activeCategory, setActiveCategory] = useState('All');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [floatingToast, setFloatingToast] = useState(null);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

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

  // Fetch live notifications from backend
  const fetchLiveNotifications = async () => {
    try {
      const token = localStorage.getItem('sheba_auth_token') || sessionStorage.getItem('sheba_auth_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API}/settings/notifications`, { headers }).catch(() => null);
      if (res && res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.data)) {
          setNotifications(prev => {
            // Keep local read status if matched by ID
            return json.data.map(item => {
              const existing = prev.find(p => p.id === item.id);
              if (existing) {
                return { ...item, isRead: existing.isRead };
              }
              return item;
            });
          });
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
  }, []);

  // Mark all notifications as read
  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // Toggle single notification read status
  const handleToggleRead = (id) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  };

  // Clear all notifications
  const handleClearAll = () => {
    setNotifications([]);
    setIsOpen(false);
  };

  // Navigate to target section
  const handleItemClick = (item) => {
    handleToggleRead(item.id);
    if (onNavigate && item.targetSection) {
      onNavigate({
        section: item.targetSection,
        tab: item.targetTab,
        search: ''
      });
      setIsOpen(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const CATEGORIES = [
    'All',
    'Stock & Inventory',
    'Customer Due & Credit',
    'Warranty & Claims',
    'POS Sales',
    'SOC Security',
    'SMS Gateway'
  ];

  const filteredNotifications = activeCategory === 'All'
    ? notifications
    : notifications.filter(n => n.category === activeCategory);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Floating Push Toast (When drawer is closed) */}
      {floatingToast && (
        <div
          onClick={() => handleItemClick(floatingToast)}
          style={{
            position: 'fixed',
            top: '70px',
            right: '24px',
            zIndex: 999999,
            background: '#0f172a',
            color: '#fff',
            padding: '12px 16px',
            borderRadius: '10px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            maxWidth: '380px',
            cursor: 'pointer',
            border: '1px solid #334155',
            animation: 'slideIn 0.25s ease-out'
          }}
        >
          <span style={{ fontSize: '1.4rem' }}>{floatingToast.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '700', fontSize: '0.85rem', color: '#38bdf8' }}>
                {floatingToast.title}
              </span>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{floatingToast.timestamp}</span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {floatingToast.message}
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setFloatingToast(null); }}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Bell Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
          isOpen
            ? 'bg-gray-100 border-gray-300 text-gray-900 shadow-inner'
            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm'
        }`}
        title="Live System Notifications"
      >
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span className="font-bold text-gray-700">Alerts</span>
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
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            background: '#0f172a',
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🔔</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', letterSpacing: '0.2px' }}>
                  Live System Alerts
                </h4>
                <small style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                  {unreadCount} unread notifications
                </small>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: soundEnabled ? '#38bdf8' : '#94a3b8',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
                title={soundEnabled ? 'Mute Chime' : 'Unmute Chime'}
              >
                {soundEnabled ? '🔊 Sound' : '🔇 Muted'}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  padding: '2px 6px'
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Toolbar: Mark all read & Simulate live alert */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 12px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            fontSize: '0.75rem'
          }}>
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              style={{
                background: 'none',
                border: 'none',
                color: '#0284c7',
                fontWeight: '700',
                cursor: 'pointer',
                padding: '2px 4px'
              }}
            >
              ✓✓ Mark all as read
            </button>
          </div>

          {/* Category Pills */}
          <div style={{
            display: 'flex',
            gap: '6px',
            padding: '8px 12px',
            overflowX: 'auto',
            background: '#fff',
            borderBottom: '1px solid #f1f5f9'
          }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '3px 10px',
                  borderRadius: '16px',
                  border: '1px solid #cbd5e1',
                  background: activeCategory === cat ? '#0f172a' : '#f8fafc',
                  color: activeCategory === cat ? '#fff' : '#475569',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Notifications List Container */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
            {filteredNotifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: '#94a3b8' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>🎉</span>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>
                  No notifications in this category
                </p>
                <small style={{ fontSize: '0.75rem' }}>All systems and stock levels are normal</small>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredNotifications.map(item => {
                  const borderCol =
                    item.priority === 'urgent' ? '#ef4444' :
                    item.priority === 'warning' ? '#f59e0b' :
                    item.priority === 'success' ? '#10b981' : '#0284c7';

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: item.isRead ? '#ffffff' : '#f0f9ff',
                        borderLeft: `4px solid ${borderCol}`,
                        borderTop: '1px solid #f1f5f9',
                        borderRight: '1px solid #f1f5f9',
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = item.isRead ? '#ffffff' : '#f0f9ff')}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{item.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h5 style={{
                              margin: 0,
                              fontSize: '0.85rem',
                              fontWeight: item.isRead ? '600' : '800',
                              color: '#0f172a'
                            }}>
                              {item.title}
                            </h5>
                            <span style={{ fontSize: '0.68rem', color: '#94a3b8', whiteSpace: 'nowrap', marginLeft: '6px' }}>
                              {item.timestamp}
                            </span>
                          </div>

                          <p style={{ margin: '3px 0 6px 0', fontSize: '0.78rem', color: '#475569', lineHeight: '1.4' }}>
                            {item.message}
                          </p>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 'bold' }}>
                              Click to view in {item.targetSection} →
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleRead(item.id);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#94a3b8',
                                fontSize: '0.7rem',
                                cursor: 'pointer',
                                padding: '2px 4px'
                              }}
                              title={item.isRead ? 'Mark unread' : 'Mark read'}
                            >
                              {item.isRead ? '○ Unread' : '● Read'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer with Clear all */}
          <div style={{
            padding: '10px 14px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <button
              type="button"
              onClick={handleClearAll}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: '600'
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
