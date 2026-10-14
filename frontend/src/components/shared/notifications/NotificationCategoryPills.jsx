import React from 'react';

export default function NotificationCategoryPills({
  categories,
  activeCategory,
  onSelectCategory,
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '6px',
        padding: '8px 12px',
        overflowX: 'auto',
        background: '#fff',
        borderBottom: '1px solid #f1f5f9',
      }}
    >
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onSelectCategory(cat)}
          style={{
            padding: '3px 10px',
            borderRadius: '16px',
            border: '1px solid #cbd5e1',
            background: activeCategory === cat ? '#0f172a' : '#f8fafc',
            color: activeCategory === cat ? '#fff' : '#475569',
            fontSize: '0.7rem',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
          }}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
