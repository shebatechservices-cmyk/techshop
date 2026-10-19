import React from 'react';
import ParcelTrackingStepper from './ParcelTrackingStepper';

const getStatusBadgeStyle = (status) => {
  if (status === 'delivered') return { bg: '#dcfce7', color: '#15803d' };
  if (status === 'shipped') return { bg: '#e0e7ff', color: '#4338ca' };
  if (status === 'processing') return { bg: '#fef3c7', color: '#b45309' };
  return { bg: '#f1f5f9', color: '#475569' };
};

export default function ParcelTrackingOrderCard({ ord, taka, money }) {
  const status = (ord.order_status || 'pending').toLowerCase();
  const badgeStyle = getStatusBadgeStyle(status);

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e2e8f0',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      {/* Order Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #f1f5f9',
          paddingBottom: '14px',
          marginBottom: '18px',
        }}
      >
        <div>
          <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
            Order #{ord.order_no}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
            Placed on {new Date(ord.created_at).toLocaleString()}
          </div>
        </div>
        <span
          style={{
            padding: '4px 12px',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            background: badgeStyle.bg,
            color: badgeStyle.color,
          }}
        >
          {status}
        </span>
      </div>

      {/* Visual Stepper */}
      <ParcelTrackingStepper ord={ord} status={status} />

      {/* Courier & Shipping Details */}
      <div
        style={{
          background: '#f8fafc',
          borderRadius: '8px',
          padding: '14px',
          border: '1px solid #e2e8f0',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          fontSize: '0.84rem',
          marginBottom: '16px',
        }}
      >
        <div>
          <span
            style={{
              color: '#64748b',
              display: 'block',
              fontSize: '0.74rem',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            Delivery Courier Partner
          </span>
          <strong style={{ color: '#0f172a' }}>{ord.courier_name || 'Standard Courier'}</strong>
          {ord.tracking_code && (
            <div style={{ marginTop: '4px', color: '#0284c7', fontWeight: 700 }}>
              Consignment ID: {ord.tracking_code}
            </div>
          )}
        </div>

        <div>
          <span
            style={{
              color: '#64748b',
              display: 'block',
              fontSize: '0.74rem',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            Delivery Destination
          </span>
          <span style={{ color: '#1e293b' }}>{ord.shipping_address}</span>
        </div>
      </div>

      {/* Items in parcel */}
      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
        <div
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#64748b',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          Items In Parcel:
        </div>
        {(ord.items || []).map((it, iIdx) => (
          <div
            key={iIdx}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.85rem',
              padding: '4px 0',
            }}
          >
            <span style={{ color: '#0f172a', fontWeight: 600 }}>
              {it.product_name || `Product #${it.product_id}`} × {it.quantity}
            </span>
            <strong style={{ color: '#0f172a' }}>
              {taka(money(it.quantity) * money(it.unit_price))}
            </strong>
          </div>
        ))}
      </div>

      <div
        style={{
          borderTop: '1px solid #e2e8f0',
          paddingTop: '10px',
          marginTop: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
          Payment: <strong>{(ord.payment_method || 'COD').toUpperCase()}</strong> (
          {ord.payment_status === 'paid' ? 'Paid' : 'Collect on Delivery'})
        </span>
        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0d9488' }}>
          Total: {taka(ord.total_amount)}
        </div>
      </div>
    </div>
  );
}
