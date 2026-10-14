import React from 'react';
import { COURIER_PRESETS } from './newOrderConstants';

export default function EcommerceCourierPaymentSection({
  courierName,
  setCourierName,
  deliveryCharge,
  setDeliveryCharge,
  paymentMethod,
  setPaymentMethod,
  paymentStatus,
  setPaymentStatus,
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
        3. Courier &amp; Payment Options
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
            Courier Service Preset
          </label>
          <select
            value={
              COURIER_PRESETS.find(
                (p) => p.name === courierName && p.charge === deliveryCharge
              )?.label || ''
            }
            onChange={(e) => {
              const preset = COURIER_PRESETS.find((p) => p.label === e.target.value);
              if (preset) {
                setCourierName(preset.name);
                setDeliveryCharge(preset.charge);
              }
            }}
            style={{
              width: '100%',
              padding: '7px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.84rem',
            }}
          >
            {COURIER_PRESETS.map((p) => (
              <option key={p.label} value={p.label}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

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
            Delivery Fee (৳)
          </label>
          <input
            type="number"
            min="0"
            value={deliveryCharge}
            onChange={(e) => setDeliveryCharge(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '7px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.84rem',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
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
            Payment Method
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.84rem',
            }}
          >
            <option value="cod">Cash on Delivery (COD)</option>
            <option value="bkash">bKash</option>
            <option value="nagad">Nagad</option>
            <option value="bank">Bank Transfer</option>
            <option value="prepaid">Pre-paid / Card</option>
          </select>
        </div>

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
            Payment Status
          </label>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.84rem',
            }}
          >
            <option value="unpaid">Unpaid (Collect on Delivery)</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>
    </div>
  );
}
