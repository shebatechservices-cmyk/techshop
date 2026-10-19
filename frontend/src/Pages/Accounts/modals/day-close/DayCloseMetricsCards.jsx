import React from 'react';

export default function DayCloseMetricsCards({ summary, sales }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
        marginBottom: '20px',
      }}
    >
      {/* Expected Cash in Drawer */}
      <div
        style={{
          background: '#f0fdf4',
          border: '2px solid #86efac',
          borderRadius: '12px',
          padding: '16px',
        }}
      >
        <span
          style={{
            fontSize: '0.74rem',
            fontWeight: 800,
            color: '#166534',
            textTransform: 'uppercase',
          }}
        >
          Expected Cash in Hand / Drawer
        </span>
        <div
          style={{
            fontSize: '1.6rem',
            fontWeight: 800,
            color: '#15803d',
            marginTop: '4px',
          }}
        >
          ৳{' '}
          {Number(summary.current_cash_in_drawer || 0).toLocaleString('en-BD', {
            minimumFractionDigits: 2,
          })}
        </div>
        <small style={{ color: '#16a34a', fontWeight: 600 }}>
          Calculated physical drawer cash
        </small>
      </div>

      {/* Today's Gross Sales */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px',
        }}
      >
        <span
          style={{
            fontSize: '0.74rem',
            fontWeight: 700,
            color: '#64748b',
            textTransform: 'uppercase',
          }}
        >
          Today's Gross Sales ({sales.total_invoices || 0} Invoices)
        </span>
        <div
          style={{
            fontSize: '1.6rem',
            fontWeight: 800,
            color: '#0f172a',
            marginTop: '4px',
          }}
        >
          ৳ {Number(sales.gross_sales || 0).toLocaleString('en-BD')}
        </div>
        <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
          Paid:{' '}
          <strong style={{ color: '#16a34a' }}>
            ৳ {Number(sales.total_collected || 0).toLocaleString()}
          </strong>{' '}
          | Due:{' '}
          <strong style={{ color: '#ef4444' }}>
            ৳ {Number(sales.total_due_given || 0).toLocaleString()}
          </strong>
        </div>
      </div>

      {/* Net Cash Movement */}
      <div
        style={{
          background: summary.net_cash_flow >= 0 ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${
            summary.net_cash_flow >= 0 ? '#bbf7d0' : '#fecaca'
          }`,
          borderRadius: '12px',
          padding: '16px',
        }}
      >
        <span
          style={{
            fontSize: '0.74rem',
            fontWeight: 700,
            color: summary.net_cash_flow >= 0 ? '#15803d' : '#b91c1c',
            textTransform: 'uppercase',
          }}
        >
          Today's Net Cash Movement
        </span>
        <div
          style={{
            fontSize: '1.6rem',
            fontWeight: 800,
            color: summary.net_cash_flow >= 0 ? '#16a34a' : '#dc2626',
            marginTop: '4px',
          }}
        >
          {summary.net_cash_flow >= 0 ? '+' : ''}৳{' '}
          {Number(summary.net_cash_flow || 0).toLocaleString('en-BD')}
        </div>
        <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
          Inflow: +৳{Number(summary.cash_inflow || 0).toLocaleString()} | Outflow: -৳
          {Number(summary.cash_outflow || 0).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
