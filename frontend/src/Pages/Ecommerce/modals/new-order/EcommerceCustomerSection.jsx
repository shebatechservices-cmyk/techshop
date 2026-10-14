import React from 'react';
import BangladeshiPhoneInput from '../../../../components/ui/BangladeshiPhoneInput';

export default function EcommerceCustomerSection({
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  shippingAddress,
  setShippingAddress,
  customerNotes,
  setCustomerNotes,
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        padding: '16px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        marginBottom: '16px',
      }}
    >
      <div
        style={{
          fontSize: '0.8rem',
          fontWeight: 800,
          color: '#0d9488',
          textTransform: 'uppercase',
          marginBottom: '12px',
        }}
      >
        1. Customer Information
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '12px',
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#334155',
              marginBottom: '4px',
            }}
          >
            Customer Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Shakil Ahmed"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <BangladeshiPhoneInput
            label="Phone Number"
            required
            placeholder="1X-XXXXXXXX"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#334155',
            marginBottom: '4px',
          }}
        >
          Delivery Address *
        </label>
        <textarea
          required
          rows={2}
          placeholder="House, Road, Area, District/Thana..."
          value={shippingAddress}
          onChange={(e) => setShippingAddress(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '0.88rem',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div>
        <label
          style={{
            display: 'block',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#64748b',
            marginBottom: '4px',
          }}
        >
          Customer Special Notes (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g. Call before delivery, urgent parcel..."
          value={customerNotes}
          onChange={(e) => setCustomerNotes(e.target.value)}
          style={{
            width: '100%',
            padding: '7px 12px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '0.84rem',
            boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  );
}
