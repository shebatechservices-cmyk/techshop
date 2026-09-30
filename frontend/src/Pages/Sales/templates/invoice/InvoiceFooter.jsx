import React from 'react';
import { formatPrintDateTime } from '../printModalHelpers';

export default function InvoiceFooter({
  showFooterDetails = true,
  warrantyDisclaimerText = '',
  invoiceFooterNote = '',
  isChalan = false,
  partnerLogos = [],
  storeName = '',
  printTime,
}) {
  if (!showFooterDetails) {
    return (
      <div className="avoid-break" style={{ position: 'relative', zIndex: 1, marginTop: 'auto', paddingTop: '4px' }}>
        <div
          style={{
            textAlign: 'center',
            fontSize: '9px',
            color: '#64748b',
            marginTop: '4px',
            letterSpacing: '0.01em',
          }}
        >
          Printed on: {formatPrintDateTime(printTime)}
        </div>
      </div>
    );
  }

  return (
    <div className="avoid-break" style={{ position: 'relative', zIndex: 1, marginTop: 'auto', paddingTop: '6px' }}>
      {warrantyDisclaimerText && (
        <div
          style={{
            border: '1.5px solid #0f172a',
            background: '#fffbeb',
            padding: '3px 8px',
            borderRadius: '3px',
            marginTop: '3px',
            fontSize: '0.64rem',
            color: '#0f172a',
            lineHeight: 1.25,
            textAlign: 'center',
          }}
        >
          <strong>{warrantyDisclaimerText}</strong>
        </div>
      )}

      {invoiceFooterNote && (
        <div style={{ marginTop: '3px', textAlign: 'center', fontSize: '0.66rem', color: '#64748b', fontWeight: 600 }}>
          🎁 {invoiceFooterNote}
        </div>
      )}

      {/* Signatures */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginTop: '12px',
          paddingTop: '4px',
        }}
      >
        <div style={{ textAlign: 'center', width: '150px' }}>
          <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '3px', fontSize: '0.68rem', color: '#475569', fontWeight: 600 }}>
            {isChalan ? 'Delivered By' : 'Customer Signature'}
          </div>
        </div>

        <div style={{ textAlign: 'center', flex: 1, padding: '0 10px', fontSize: '0.64rem', color: '#475569' }}>
          <div style={{ fontWeight: 800, letterSpacing: '0.02em', color: '#0f172a' }}>
            Computer Generated Bill, No Sign Required
          </div>
        </div>

        <div style={{ textAlign: 'center', width: '150px' }}>
          <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '3px', fontSize: '0.68rem', color: '#475569', fontWeight: 600 }}>
            {isChalan ? 'Received By' : 'Authorized Signature'}
          </div>
        </div>
      </div>

      {/* Partner Strip */}
      {partnerLogos.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '6px 14px',
            marginTop: '6px',
            padding: '4px 8px',
            borderTop: '1px solid #cbd5e1',
            borderBottom: '1px solid #cbd5e1',
            background: '#f8fafc',
            borderRadius: '3px',
          }}
        >
          {partnerLogos.map((brand, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={brand.name || ''}
            >
              {brand.url ? (
                <img
                  src={brand.url}
                  alt={brand.name || 'Partner'}
                  style={{ height: '18px', maxWidth: '70px', objectFit: 'contain' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#0f172a' }}>{brand.name}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {storeName && (
        <div style={{ textAlign: 'center', fontSize: '0.62rem', color: '#94a3b8', marginTop: '3px' }}>
          Thank you for choosing {storeName}!
        </div>
      )}

      <div
        style={{
          textAlign: 'center',
          fontSize: '9px',
          color: '#64748b',
          marginTop: '4px',
          letterSpacing: '0.01em',
        }}
      >
        Printed on: {formatPrintDateTime(printTime)}
      </div>
    </div>
  );
}
