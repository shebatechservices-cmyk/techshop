import React from 'react';

export default function NotificationHeader({
  unreadCount,
  soundEnabled,
  setSoundEnabled,
  onClose,
  onMarkAllAsRead,
}) {
  return (
    <>
      <div
        style={{
          padding: '14px 16px',
          background: '#0f172a',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>🔔</span>
          <div>
            <h4
              style={{
                margin: 0,
                fontSize: '0.95rem',
                fontWeight: '800',
                letterSpacing: '0.2px',
              }}
            >
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
              cursor: 'pointer',
            }}
            title={soundEnabled ? 'Mute Chime' : 'Unmute Chime'}
          >
            {soundEnabled ? '🔊 Sound' : '🔇 Muted'}
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: '2px 6px',
            }}
          >
            ✕
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          fontSize: '0.75rem',
        }}
      >
        <button
          type="button"
          onClick={onMarkAllAsRead}
          style={{
            background: 'none',
            border: 'none',
            color: '#0284c7',
            fontWeight: '700',
            cursor: 'pointer',
            padding: '2px 4px',
          }}
        >
          ✓✓ Mark all as read
        </button>
      </div>
    </>
  );
}
