import React from 'react';

export default function ParcelTrackingView({
  trackQuery,
  setTrackQuery,
  handleTrackSearch,
  trackingLoading,
  trackingError,
  trackingOrders,
  taka,
  money,
}) {
  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          marginBottom: '20px',
        }}
      >
        <h3
          style={{
            margin: '0 0 6px 0',
            fontSize: '1.3rem',
            fontWeight: 900,
            color: '#0f172a',
          }}
        >
          📦 Track Your Parcel / Order
        </h3>
        <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '0.86rem' }}>
          Enter your Order Number (e.g. ECOM-123456) or Customer Mobile Number to see real-time delivery status
        </p>

        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={trackQuery}
            onChange={(e) => setTrackQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTrackSearch();
            }}
            placeholder="e.g. ECOM-482910 or 017XXXXXXXX"
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1.5px solid #0d9488',
              fontSize: '0.92rem',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={() => handleTrackSearch()}
            disabled={trackingLoading}
            style={{
              padding: '10px 22px',
              background: '#0d9488',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            {trackingLoading ? 'Searching...' : '🔍 Track Parcel'}
          </button>
        </div>

        {trackingError && (
          <div
            style={{
              marginTop: '14px',
              padding: '10px 14px',
              background: '#fee2e2',
              color: '#b91c1c',
              borderRadius: '8px',
              fontSize: '0.85rem',
            }}
          >
            ⚠️ {trackingError}
          </div>
        )}
      </div>

      {/* Tracking Results */}
      {trackingOrders.map((ord) => {
        const status = (ord.order_status || 'pending').toLowerCase();
        const steps = [
          { key: 'placed', label: 'Order Placed', desc: new Date(ord.created_at).toLocaleDateString() },
          { key: 'confirmed', label: 'Confirmed', desc: 'Verified by Sheba Tech' },
          { key: 'processing', label: 'Packed', desc: 'Ready for Courier' },
          { key: 'shipped', label: 'With Courier', desc: ord.courier_name || 'In Transit' },
          { key: 'delivered', label: 'Delivered', desc: 'Handed over' },
        ];

        let currentIdx = 0;
        if (status === 'processing') currentIdx = 2;
        else if (status === 'shipped') currentIdx = 3;
        else if (status === 'delivered') currentIdx = 4;
        else currentIdx = 1;

        return (
          <div
            key={ord.id}
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
                  background:
                    status === 'delivered'
                      ? '#dcfce7'
                      : status === 'shipped'
                      ? '#e0e7ff'
                      : status === 'processing'
                      ? '#fef3c7'
                      : '#f1f5f9',
                  color:
                    status === 'delivered'
                      ? '#15803d'
                      : status === 'shipped'
                      ? '#4338ca'
                      : status === 'processing'
                      ? '#b45309'
                      : '#475569',
                }}
              >
                {status}
              </span>
            </div>

            {/* Visual Stepper */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                position: 'relative',
                marginBottom: '24px',
              }}
            >
              {steps.map((st, sIdx) => {
                const isDone = currentIdx >= sIdx;
                return (
                  <div key={st.key} style={{ flex: 1, textAlign: 'center' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: isDone ? '#0d9488' : '#e2e8f0',
                        color: isDone ? '#ffffff' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 6px auto',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                      }}
                    >
                      {isDone ? '✓' : sIdx + 1}
                    </div>
                    <div
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: isDone ? '#0f172a' : '#94a3b8',
                      }}
                    >
                      {st.label}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                      {st.desc}
                    </div>
                  </div>
                );
              })}
            </div>

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
      })}
    </div>
  );
}
