import React from 'react';

export default function KpiSummaryCards({ stats, taka }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', marginBottom: '10px' }}>
      {/* Card 1: Online Revenue */}
      <div style={{ background: '#ffffff', borderRadius: '8px', padding: '8px 12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
            Online Revenue
          </span>
          <span style={{ padding: '2px 6px', background: '#f0fdfa', borderRadius: '4px', color: '#0d9488', fontSize: '0.72rem', fontWeight: 700 }}>
            ৳ Net
          </span>
        </div>
        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
          {taka(stats.totalRevenue)}
        </div>
        <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600 }}>
          ✓ {stats.totalOrders} total orders
        </div>
      </div>

      {/* Card 2: Orders Total */}
      <div style={{ background: '#ffffff', borderRadius: '8px', padding: '8px 12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
            Total Orders
          </span>
          <span style={{ padding: '2px 6px', background: '#f1f5f9', borderRadius: '4px', color: '#475569', fontSize: '0.72rem', fontWeight: 700 }}>
            📦 Orders
          </span>
        </div>
        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
          {stats.totalOrders}
        </div>
        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
          {stats.cancelledCount} cancelled / returned
        </div>
      </div>

      {/* Card 3: Pending & Processing */}
      <div style={{ background: '#ffffff', borderRadius: '8px', padding: '8px 12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase' }}>
            Pending Fulfillment
          </span>
          <span style={{ padding: '2px 6px', background: '#fef3c7', borderRadius: '4px', color: '#b45309', fontSize: '0.72rem', fontWeight: 800 }}>
            Action Req
          </span>
        </div>
        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#b45309', marginTop: '2px' }}>
          {stats.activeFulfillment}
        </div>
        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
          {stats.pendingCount} pending · {stats.processingCount} packing
        </div>
      </div>

      {/* Card 4: Delivered & Rate */}
      <div style={{ background: '#ffffff', borderRadius: '8px', padding: '8px 12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase' }}>
            Delivered Successfully
          </span>
          <span style={{ padding: '2px 6px', background: '#dcfce7', borderRadius: '4px', color: '#15803d', fontSize: '0.72rem', fontWeight: 700 }}>
            {stats.fulfillmentRate}%
          </span>
        </div>
        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#15803d', marginTop: '2px' }}>
          {stats.deliveredCount}
        </div>
        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
          {stats.shippedCount} out for delivery
        </div>
      </div>
    </div>
  );
}
