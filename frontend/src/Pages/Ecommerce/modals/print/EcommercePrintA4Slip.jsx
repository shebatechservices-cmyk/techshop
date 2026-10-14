import React from 'react';

/**
 * A4 Printable Packing Slip layout for Ecommerce Orders
 */
export default function EcommercePrintA4Slip({
  order,
  company,
  showLogo,
  orderDate,
  items,
  itemsSubtotal,
  deliveryCharge,
  grandTotal,
  invoiceFooterNote,
  taka,
  money,
}) {
  return (
    <div
      className="ecom-printable-area"
      style={{
        maxWidth: '750px',
        margin: '0 auto',
        background: '#ffffff',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        color: '#1e293b',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '2px solid #0d9488',
          paddingBottom: '16px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {showLogo && company.logo && (
            <img
              src={company.logo}
              alt={company.name}
              style={{ width: '52px', height: '52px', objectFit: 'contain', borderRadius: '8px' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
              {company.name.toUpperCase()}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
              {company.tagline}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>
              {company.web && `🌐 ${company.web}`} · 📞 {company.phone}
              {company.email ? ` · ✉️ ${company.email}` : ''}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              display: 'inline-block',
              background: '#f0fdfa',
              border: '1px solid #99f6e4',
              color: '#0d9488',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}
          >
            ONLINE ORDER PACKING SLIP
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
            #{order.order_no || order.order_number || order.id}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>
            Order Placed: {orderDate}
          </div>
        </div>
      </div>

      {/* Customer & Shipping Details Boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px' }}>
          <div
            style={{
              fontSize: '0.74rem',
              fontWeight: 800,
              color: '#0d9488',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '6px',
            }}
          >
            📦 DELIVER TO / CUSTOMER
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
            {order.customer_name}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#334155', marginTop: '4px' }}>
            📞 {order.customer_phone}
          </div>
          <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '6px', lineHeight: '1.4' }}>
            📍 {order.shipping_address}
          </div>
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px' }}>
          <div
            style={{
              fontSize: '0.74rem',
              fontWeight: 800,
              color: '#0d9488',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '6px',
            }}
          >
            🚚 SHIPPING &amp; PAYMENT INFO
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
            <span style={{ color: '#64748b' }}>Courier Partner:</span>
            <strong style={{ color: '#0f172a' }}>{order.courier_name || 'Standard Courier'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
            <span style={{ color: '#64748b' }}>Consignment / Tracking:</span>
            <strong style={{ color: '#0f172a' }}>{order.tracking_code || 'Pending Dispatch'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
            <span style={{ color: '#64748b' }}>Payment Mode:</span>
            <strong style={{ textTransform: 'uppercase', color: '#0f172a' }}>
              {order.payment_method || 'Cash On Delivery'}
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
            <span style={{ color: '#64748b' }}>Payment Status:</span>
            <strong
              style={{
                color: (order.payment_status || '').toLowerCase() === 'paid' ? '#16a34a' : '#b45309',
                textTransform: 'uppercase',
              }}
            >
              {order.payment_status || 'Unpaid / COD'}
            </strong>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.86rem' }}>
        <thead>
          <tr style={{ background: '#0f172a', color: '#ffffff' }}>
            <th style={{ padding: '8px 10px', textAlign: 'center', width: '40px' }}>#</th>
            <th style={{ padding: '8px 10px', textAlign: 'left' }}>ITEM &amp; SPECIFICATION</th>
            <th style={{ padding: '8px 10px', textAlign: 'center', width: '60px' }}>QTY</th>
            <th style={{ padding: '8px 10px', textAlign: 'right', width: '100px' }}>UNIT PRICE</th>
            <th style={{ padding: '8px 10px', textAlign: 'right', width: '110px' }}>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => {
            const lineTotal = money(it.quantity) * money(it.unit_price);
            return (
              <tr
                key={idx}
                style={{
                  borderBottom: '1px solid #e2e8f0',
                  background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                }}
              >
                <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                <td style={{ padding: '8px 10px' }}>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>
                    {it.product_name || `Product ID #${it.product_id}`}
                  </div>
                  {it.sku && <div style={{ fontSize: '0.74rem', color: '#64748b' }}>SKU: {it.sku}</div>}
                </td>
                <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700 }}>{it.quantity}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#334155' }}>{taka(it.unit_price)}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                  {taka(lineTotal)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Total Calculation Box */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <div
          style={{
            width: '280px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '12px 16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.84rem',
              color: '#475569',
              marginBottom: '6px',
            }}
          >
            <span>Items Subtotal:</span>
            <span>{taka(itemsSubtotal)}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.84rem',
              color: '#475569',
              marginBottom: '8px',
            }}
          >
            <span>Delivery Charge:</span>
            <span>{taka(deliveryCharge)}</span>
          </div>
          <div
            style={{
              borderTop: '2px solid #cbd5e1',
              paddingTop: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1rem',
              fontWeight: 800,
              color: '#0f172a',
            }}
          >
            <span>Total Amount:</span>
            <span style={{ color: '#0d9488' }}>{taka(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Notes if any */}
      {order.customer_notes && (
        <div
          style={{
            background: '#fef3c7',
            border: '1px solid #fde68a',
            borderRadius: '6px',
            padding: '10px 14px',
            fontSize: '0.82rem',
            color: '#92400e',
            marginBottom: '20px',
          }}
        >
          <strong>Customer Note:</strong> {order.customer_notes}
        </div>
      )}

      {/* Footer Declaration */}
      <div
        style={{
          borderTop: '1px dashed #cbd5e1',
          paddingTop: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          fontSize: '0.76rem',
          color: '#64748b',
        }}
      >
        <div>
          <p style={{ margin: 0 }}>✓ Computer generated packing slip. No signature required.</p>
          <p style={{ margin: '2px 0 0 0' }}>Please inspect products upon parcel delivery.</p>
          {invoiceFooterNote && (
            <p style={{ margin: '4px 0 0 0', color: '#475569', fontWeight: 600 }}>🎁 {invoiceFooterNote}</p>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ width: '120px', borderBottom: '1px solid #94a3b8', marginBottom: '4px' }} />
          <span>Authorized Dispatch</span>
        </div>
      </div>
    </div>
  );
}
