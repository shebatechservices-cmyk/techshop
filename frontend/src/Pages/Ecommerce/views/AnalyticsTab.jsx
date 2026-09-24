import React from 'react';

export default function AnalyticsTab({ stats, products, taka }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      {/* Status Breakdown Box */}
      <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
          Order Fulfillment Pipeline
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { label: 'Pending Review', count: stats.pendingCount, color: '#b45309', bg: '#fef3c7' },
            { label: 'Processing & Packing', count: stats.processingCount, color: '#0369a1', bg: '#e0f2fe' },
            { label: 'Shipped & Out for Delivery', count: stats.shippedCount, color: '#4338ca', bg: '#e0e7ff' },
            { label: 'Delivered & Completed', count: stats.deliveredCount, color: '#15803d', bg: '#dcfce7' },
            { label: 'Cancelled / Returned', count: stats.cancelledCount, color: '#b91c1c', bg: '#fee2e2' },
          ].map((item) => {
            const pct = stats.totalOrders > 0 ? ((item.count / stats.totalOrders) * 100).toFixed(1) : 0;
            return (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, color: '#334155' }}>{item.label}</span>
                  <span style={{ fontWeight: 700, color: item.color }}>
                    {item.count} ({pct}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: item.color, borderRadius: '4px' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Metrics & Summary */}
      <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
          Performance Metrics
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
              Average Order Value (AOV)
            </span>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>
              {stats.totalOrders > 0 ? taka(stats.totalRevenue / (stats.totalOrders - stats.cancelledCount || 1)) : taka(0)}
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
              Active Inventory Count
            </span>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>
              {products.length} Products
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
              Fulfillment Success Rate
            </span>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#15803d', marginTop: '4px' }}>
              {stats.fulfillmentRate}%
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
              Return / Cancel Rate
            </span>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: stats.cancelledCount > 0 ? '#b91c1c' : '#64748b', marginTop: '4px' }}>
              {stats.totalOrders > 0 ? `${((stats.cancelledCount / stats.totalOrders) * 100).toFixed(1)}%` : '0%'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
