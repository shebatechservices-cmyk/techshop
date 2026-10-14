import React from 'react';

export default function NotificationItem({ item, onClick, onToggleRead }) {
  const borderCol =
    item.priority === 'urgent'
      ? '#ef4444'
      : item.priority === 'warning'
      ? '#f59e0b'
      : item.priority === 'success'
      ? '#10b981'
      : '#0284c7';

  return (
    <div
      onClick={() => onClick(item)}
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
        position: 'relative',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = item.isRead ? '#ffffff' : '#f0f9ff')
      }
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{item.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h5
              style={{
                margin: 0,
                fontSize: '0.85rem',
                fontWeight: item.isRead ? '600' : '800',
                color: '#0f172a',
              }}
            >
              {item.title}
            </h5>
            <span
              style={{
                fontSize: '0.68rem',
                color: '#94a3b8',
                whiteSpace: 'nowrap',
                marginLeft: '6px',
              }}
            >
              {item.timestamp}
            </span>
          </div>

          <p
            style={{
              margin: '3px 0 6px 0',
              fontSize: '0.78rem',
              color: '#475569',
              lineHeight: '1.4',
            }}
          >
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
                onToggleRead(item.id);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '0.7rem',
                cursor: 'pointer',
                padding: '2px 4px',
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
}
