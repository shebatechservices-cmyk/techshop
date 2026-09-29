import React from 'react';

export default function LedgerSupplierMeta({
  supplierName = '',
  supplierPhone = '',
  supplierContact = '',
  order = {},
  extraCost = 0,
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr',
        gap: '16px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '14px 18px',
      }}
    >
      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Supplier Information
        </div>
        <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#0f172a', marginTop: '2px' }}>
          {supplierName}
        </div>
        <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '3px', display: 'flex', gap: '12px' }}>
          {supplierPhone && <span>📞 {supplierPhone}</span>}
          {supplierContact && <span>Code: {supplierContact}</span>}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Reference & Status
        </div>
        <div style={{ fontSize: '0.86rem', color: '#1e293b', fontWeight: 600, marginTop: '2px' }}>
          Ref: {order?.transaction_reference || 'N/A'}
        </div>
        <div style={{ marginTop: '4px', display: 'flex', gap: '6px' }}>
          <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, background: '#dcfce7', color: '#15803d' }}>
            Status: Approved
          </span>
          {extraCost > 0 && (
            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: '#fef3c7', color: '#b45309' }}>
              Overhead: {order?.extra_cost_category || 'Logistics'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
