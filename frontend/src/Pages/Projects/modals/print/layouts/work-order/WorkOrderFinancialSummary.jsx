import React from 'react';

export default function WorkOrderFinancialSummary({
  isCustomerCopy,
  setup = 0,
  conv = 0,
  meal = 0,
  totalTechPayout = 0,
  customerBill = 0,
  project = {},
}) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isCustomerCopy ? '1fr' : '1fr 1fr',
          gap: '10px',
        }}
      >
        {/* Technician Remuneration Breakdown (Hidden in Customer Copy) */}
        {!isCustomerCopy && (
          <div
            style={{
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                background: '#eff6ff',
                padding: '4px 10px',
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#1e40af',
                borderBottom: '1px solid #bfdbfe',
                textTransform: 'uppercase',
              }}
            >
              Technician Compensation Breakdown
            </div>
            <div style={{ fontSize: '0.76rem', padding: '4px 10px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '2px 0',
                  borderBottom: '1px dashed #f1f5f9',
                }}
              >
                <span style={{ color: '#475569' }}>Setup / Installation Fee:</span>
                <strong>৳ {setup.toLocaleString('en-IN')}</strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '2px 0',
                  borderBottom: '1px dashed #f1f5f9',
                }}
              >
                <span style={{ color: '#475569' }}>Conveyance / Transport:</span>
                <strong>৳ {conv.toLocaleString('en-IN')}</strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '2px 0',
                  borderBottom: '1px dashed #f1f5f9',
                }}
              >
                <span style={{ color: '#475569' }}>Meal Allowance:</span>
                <strong>৳ {meal.toLocaleString('en-IN')}</strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '3px 0 0',
                  fontWeight: 800,
                  color: '#1e40af',
                  borderTop: '1px solid #cbd5e1',
                  marginTop: '2px',
                }}
              >
                <span>Total Technician Receivable (Wallet):</span>
                <span style={{ fontSize: '0.85rem' }}>
                  ৳ {totalTechPayout.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Customer Billing Terms */}
        <div
          style={{
            border: '1px solid #bbf7d0',
            background: '#f0fdf4',
            borderRadius: '6px',
            padding: '8px 12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              color: '#166534',
              fontWeight: 800,
              textTransform: 'uppercase',
            }}
          >
            Customer Service Billing Summary
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '8px',
              margin: '3px 0',
            }}
          >
            <span
              style={{
                fontSize: '1.25rem',
                fontWeight: 900,
                color: '#15803d',
              }}
            >
              ৳ {customerBill.toLocaleString('en-IN')}
            </span>
            {customerBill === 0 && project.invoice_no && (
              <span
                style={{
                  fontSize: '0.74rem',
                  color: '#166534',
                  fontWeight: 700,
                }}
              >
                (Covered in Invoice #{project.invoice_no})
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: '0.68rem',
              color: '#15803d',
              lineHeight: '1.2',
            }}
          >
            {customerBill > 0
              ? '• Amount payable upon successful installation and live CCTV verification.'
              : project.invoice_no
              ? '• Hardware & installation package billed under official POS Invoice.'
              : '• Complimentary / standard maintenance work order.'}
          </div>
        </div>
      </div>
    </div>
  );
}
