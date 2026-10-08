import React from 'react';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) =>
  `৳${money(val).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function ExchangeSettlementSummary({
  returnSubtotal = 0,
  newSubtotal = 0,
  netDifference = 0,
  paidAmount = '',
  setPaidAmount,
  paymentMethod = 'Cash',
  setPaymentMethod,
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '10px',
        padding: '16px',
      }}
    >
      <h4
        style={{
          margin: '0 0 12px 0',
          fontSize: '0.95rem',
          fontWeight: 800,
          color: '#1e293b',
        }}
      >
        3. Exchange Settlement & Payment
      </h4>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginBottom: '14px',
        }}
      >
        <div
          style={{
            padding: '10px 14px',
            background: '#ecfdf5',
            borderRadius: '8px',
            border: '1px solid #a7f3d0',
          }}
        >
          <div
            style={{
              fontSize: '0.74rem',
              color: '#065f46',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            Return Credit Value
          </div>
          <div
            style={{
              fontSize: '1.2rem',
              fontWeight: 800,
              color: '#047857',
            }}
          >
            {taka(returnSubtotal)}
          </div>
        </div>
        <div
          style={{
            padding: '10px 14px',
            background: '#eef2ff',
            borderRadius: '8px',
            border: '1px solid #c7d2fe',
          }}
        >
          <div
            style={{
              fontSize: '0.74rem',
              color: '#3730a3',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            New Items Subtotal
          </div>
          <div
            style={{
              fontSize: '1.2rem',
              fontWeight: 800,
              color: '#4338ca',
            }}
          >
            {taka(newSubtotal)}
          </div>
        </div>
        <div
          style={{
            padding: '10px 14px',
            background: netDifference >= 0 ? '#fff7ed' : '#f0f9ff',
            borderRadius: '8px',
            border: `1px solid ${netDifference >= 0 ? '#fed7aa' : '#bae6fd'}`,
          }}
        >
          <div
            style={{
              fontSize: '0.74rem',
              color: netDifference >= 0 ? '#9a3412' : '#0369a1',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {netDifference > 0
              ? 'Customer Owes (Extra)'
              : netDifference < 0
              ? 'Customer Refund / Credit'
              : 'Even Exchange (৳0)'}
          </div>
          <div
            style={{
              fontSize: '1.2rem',
              fontWeight: 800,
              color:
                netDifference > 0
                  ? '#c2410c'
                  : netDifference < 0
                  ? '#0284c7'
                  : '#15803d',
            }}
          >
            {taka(Math.abs(netDifference))}
          </div>
        </div>
      </div>

      {netDifference !== 0 && (
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#475569',
                marginBottom: '4px',
              }}
            >
              {netDifference > 0
                ? 'Amount Paid by Customer:'
                : 'Amount Refunded to Customer (Cash):'}
            </label>
            <input
              type="number"
              min="0"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.88rem',
              }}
            />
          </div>
          {netDifference > 0 && (
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#475569',
                  marginBottom: '4px',
                }}
              >
                Payment Method:
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                }}
              >
                <option value="Cash">Cash Drawer</option>
                <option value="Bank">Bank Transfer</option>
                <option value="MFS">bKash / Nagad</option>
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
