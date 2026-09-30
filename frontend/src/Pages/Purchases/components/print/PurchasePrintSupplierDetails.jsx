import React from 'react';

export default function PurchasePrintSupplierDetails({
  supplierName = '',
  supplierContact = '',
  supplierPhone = '',
  supplierAddress = '',
  order = {},
  items = [],
  isChalan = false,
  remainingDue = 0,
  totalPaid = 0,
  payments = [],
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1.2fr 1fr',
      gap: '14px',
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '8px 12px',
      marginBottom: '10px',
      fontSize: '0.78rem',
    }}>
      <div>
        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>
          Vendor / Supplier Details
        </div>
        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
          {supplierName}
        </div>
        {supplierContact && (
          <div style={{ color: '#475569', marginTop: '1px' }}>Contact ID: {supplierContact}</div>
        )}
        {supplierPhone && (
          <div style={{ color: '#475569', marginTop: '1px' }}>Phone: <strong>{supplierPhone}</strong></div>
        )}
        {supplierAddress && (
          <div style={{ color: '#64748b', marginTop: '1px' }}>{supplierAddress}</div>
        )}
      </div>

      <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '14px' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>
          Payment & Delivery Summary
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '105px 1fr', gap: '3px', color: '#334155' }}>
          <span>Total Units:</span>
          <strong>{order.unit_count || items.reduce((s, it) => s + Number(it.quantity || 0), 0)} Units ({items.length} Items)</strong>

          {!isChalan && (
            <>
              <span>Payment Status:</span>
              <strong style={{
                color: remainingDue === 0 ? '#16a34a' : totalPaid > 0 ? '#d97706' : '#dc2626',
                textTransform: 'uppercase',
              }}>
                {remainingDue === 0 ? 'Fully Paid' : totalPaid > 0 ? 'Partially Paid' : 'Due / Credit'}
              </strong>

              <span>Primary Method:</span>
              <strong>{payments[0]?.payment_method || 'Cash / Multi-tender'}</strong>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
