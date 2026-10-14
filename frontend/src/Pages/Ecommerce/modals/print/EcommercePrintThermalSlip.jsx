import React from 'react';

/**
 * Thermal (80mm / 58mm) Sticker Printable Format for Ecommerce Orders
 */
export default function EcommercePrintThermalSlip({
  order,
  company,
  items,
  grandTotal,
  taka,
}) {
  return (
    <div
      className="ecom-printable-area"
      style={{
        width: '320px',
        margin: '0 auto',
        padding: '8px',
        fontFamily: 'monospace',
        fontSize: '0.8rem',
        color: '#000000',
        lineHeight: '1.3',
      }}
    >
      <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '8px' }}>
        <strong style={{ fontSize: '1rem', display: 'block' }}>{company.name.toUpperCase()}</strong>
        <span style={{ fontSize: '0.72rem' }}>Online Store Dispatch</span>
        <div style={{ fontWeight: 800, marginTop: '4px' }}>
          #{order.order_no || order.order_number || order.id}
        </div>
      </div>

      <div style={{ borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '6px' }}>
        <div><strong>RECIPIENT:</strong></div>
        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{order.customer_name}</div>
        <div>📞 {order.customer_phone}</div>
        <div style={{ marginTop: '2px' }}>📍 {order.shipping_address}</div>
      </div>

      <div style={{ borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '6px' }}>
        <div><strong>COURIER:</strong> {order.courier_name || 'General'}</div>
        {order.tracking_code && <div><strong>TRACK:</strong> {order.tracking_code}</div>}
        <div><strong>PAYMENT:</strong> {(order.payment_method || 'COD').toUpperCase()}</div>
      </div>

      <div style={{ borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
          <span>ITEM</span>
          <span>QTY</span>
        </div>
        {items.map((it, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginTop: '2px' }}>
            <span style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {it.product_name || `Item #${it.product_id}`}
            </span>
            <strong>x{it.quantity}</strong>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.95rem' }}>
        TOTAL PAYABLE: {taka(grandTotal)}
      </div>

      <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.7rem' }}>
        *** Thank You for Shopping With Us ***
      </div>
    </div>
  );
}
