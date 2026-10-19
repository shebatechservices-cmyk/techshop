import React from 'react';

export default function PurchaseStatsBar({
  totalPurchasesCost = 0,
  totalPurchasesPaid = 0,
  totalPurchasesDue = 0,
  ordersCount = 0,
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '12px' }}>
      <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
          Total Purchase Cost
        </span>
        <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0 0', color: '#0284c7', fontWeight: 800 }}>
          ৳ {Number(totalPurchasesCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </h3>
      </div>
      <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
          Total Paid to Suppliers
        </span>
        <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0 0', color: '#16a34a', fontWeight: 800 }}>
          ৳ {Number(totalPurchasesPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </h3>
      </div>
      <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
          Outstanding Due
        </span>
        <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0 0', color: totalPurchasesDue > 0 ? '#ef4444' : '#64748b', fontWeight: 800 }}>
          ৳ {Number(totalPurchasesDue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </h3>
      </div>
      <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
          Orders Placed
        </span>
        <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0 0', color: '#0f172a', fontWeight: 800 }}>
          {ordersCount}
        </h3>
      </div>
    </div>
  );
}
