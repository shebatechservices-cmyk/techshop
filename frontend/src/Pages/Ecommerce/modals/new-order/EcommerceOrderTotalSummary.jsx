import React from 'react';
import { taka } from './newOrderConstants';

export default function EcommerceOrderTotalSummary({
  itemsSubtotal,
  deliveryCharge,
  finalTotal,
}) {
  return (
    <div
      style={{
        background: '#f0fdfa',
        border: '1px solid #99f6e4',
        borderRadius: '10px',
        padding: '14px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
      }}
    >
      <div>
        <span style={{ fontSize: '0.8rem', color: '#0f766e' }}>
          Products Subtotal: {taka(itemsSubtotal)}
        </span>
        <span style={{ fontSize: '0.8rem', color: '#0f766e', marginLeft: '12px' }}>
          + Delivery: {taka(deliveryCharge)}
        </span>
      </div>
      <div style={{ textAlign: 'right' }}>
        <span
          style={{
            fontSize: '0.78rem',
            color: '#64748b',
            textTransform: 'uppercase',
            display: 'block',
          }}
        >
          Total Payable Amount
        </span>
        <span
          style={{
            fontSize: '1.25rem',
            fontWeight: 900,
            color: '#0f766e',
          }}
        >
          {taka(finalTotal)}
        </span>
      </div>
    </div>
  );
}
