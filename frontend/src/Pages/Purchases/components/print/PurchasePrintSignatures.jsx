import React from 'react';

export default function PurchasePrintSignatures({
  showFooterDetails = true,
  isChalan = false,
  company = {},
}) {
  if (!showFooterDetails) return null;

  return (
    <div className="print-avoid-break" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        paddingTop: '20px',
        borderTop: '1px solid #cbd5e1',
        textAlign: 'center',
        fontSize: '0.76rem',
        color: '#475569',
      }}>
        <div>
          <div style={{ borderBottom: '1.5px dashed #94a3b8', width: '80%', margin: '0 auto 6px' }}></div>
          <strong>{isChalan ? 'Delivered By' : 'Prepared By'}</strong>
          <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{isChalan ? "Supplier's Representative" : 'Procurement Officer'}</div>
        </div>

        <div>
          <div style={{ borderBottom: '1.5px dashed #94a3b8', width: '80%', margin: '0 auto 6px' }}></div>
          <strong>Received By (Store)</strong>
          <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Inventory In-charge</div>
        </div>

        <div>
          <div style={{ borderBottom: '1.5px dashed #94a3b8', width: '80%', margin: '0 auto 6px' }}></div>
          <strong>Authorized Signature</strong>
          <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Managing Director</div>
        </div>
      </div>

      {/* System Watermark Note */}
      <div style={{
        marginTop: '12px',
        textAlign: 'center',
        fontSize: '0.68rem',
        color: '#94a3b8',
        borderTop: '1px solid #f1f5f9',
        paddingTop: '6px',
      }}>
        Computer-generated purchase receipt powered by {company.name || 'TechShop'} ERP System · Printed: {new Date().toLocaleString('en-GB')}
      </div>
    </div>
  );
}
