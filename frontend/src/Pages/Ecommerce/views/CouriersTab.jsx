import React from 'react';

export default function CouriersTab() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Steadfast Courier */}
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Steadfast Courier</span>
            <span style={{ padding: '2px 8px', background: '#ecfdf5', color: '#047857', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
              Active Partner
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 12px 0' }}>
            Fastest countrywide cash on delivery with automated next-day payment settlement.
          </p>
          <div style={{ fontSize: '0.82rem', color: '#334155', marginBottom: '14px' }}>
            <div>📍 Inside Dhaka: <strong>৳80</strong></div>
            <div>📍 Outside Dhaka: <strong>৳150</strong></div>
          </div>
          <a
            href="https://steadfast.com.bd/tracking"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '7px 14px',
              background: '#f1f5f9',
              color: '#0284c7',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            🔗 Steadfast Parcel Tracking Portal
          </a>
        </div>

        {/* Pathao Courier */}
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Pathao Courier</span>
            <span style={{ padding: '2px 8px', background: '#ecfdf5', color: '#047857', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
              Active Partner
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 12px 0' }}>
            On-demand express parcel booking across all 64 districts in Bangladesh.
          </p>
          <div style={{ fontSize: '0.82rem', color: '#334155', marginBottom: '14px' }}>
            <div>⚡ Express Delivery: <strong>৳120</strong></div>
            <div>📍 Standard Delivery: <strong>৳80 - ৳140</strong></div>
          </div>
          <a
            href="https://pathao.com/courier/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '7px 14px',
              background: '#f1f5f9',
              color: '#0284c7',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            🔗 Pathao Courier Dashboard
          </a>
        </div>

        {/* RedX Delivery */}
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>RedX Logistics</span>
            <span style={{ padding: '2px 8px', background: '#ecfdf5', color: '#047857', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
              Active Partner
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 12px 0' }}>
            Extensive nationwide distribution network with doorstep parcel pickup.
          </p>
          <div style={{ fontSize: '0.82rem', color: '#334155', marginBottom: '14px' }}>
            <div>📍 Standard Fee: <strong>৳100 - ৳130</strong></div>
            <div>🛡️ COD Return Protection: Included</div>
          </div>
          <a
            href="https://redx.com.bd/track-order"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '7px 14px',
              background: '#f1f5f9',
              color: '#0284c7',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            🔗 RedX Tracking Tool
          </a>
        </div>

        {/* Sundarban Courier */}
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Sundarban Courier</span>
            <span style={{ padding: '2px 8px', background: '#f1f5f9', color: '#475569', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
              Branch / Condition
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 12px 0' }}>
            Traditional branch-to-branch condition delivery for heavy hardware &amp; bulk CCTV systems.
          </p>
          <div style={{ fontSize: '0.82rem', color: '#334155', marginBottom: '14px' }}>
            <div>📦 Bulk Hardware: <strong>৳150 - ৳350</strong></div>
            <div>🏢 Branch Condition Cash Collection</div>
          </div>
          <a
            href="https://sundarbancourierltd.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '7px 14px',
              background: '#f1f5f9',
              color: '#0284c7',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            🔗 Sundarban Tracking
          </a>
        </div>
      </div>
    </div>
  );
}
