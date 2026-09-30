import React from 'react';

export default function InvoiceMetaGrid({
  customerName,
  customerAddress,
  customerPhone,
  customerEmail,
  customerAttention,
  customerDestination,
  docNumber,
  dateFormatted,
  timeFormatted,
  preparedBy,
  salesPerson,
  paymentStatus,
  isFullyPaid,
  isPartialPaid,
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        border: '1px solid #475569',
        borderRadius: '3px',
        marginBottom: '6px',
        background: '#ffffff',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Customer Info */}
      <div
        style={{
          padding: '4px 8px',
          borderRight: '1px solid #475569',
          fontSize: '0.72rem',
        }}
      >
        <div
          style={{
            borderBottom: '1px solid #cbd5e1',
            paddingBottom: '2px',
            marginBottom: '3px',
            fontSize: '0.68rem',
            fontWeight: 800,
            color: '#0284c7',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
          }}
        >
          Customer Details
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '1.5px 4px', fontSize: '0.72rem', lineHeight: 1.25 }}>
          <span style={{ color: '#475569', fontWeight: 600 }}>Customer:</span>
          <span style={{ color: '#0f172a', fontWeight: 700 }}>{customerName}</span>

          {customerAddress && (
            <>
              <span style={{ color: '#475569', fontWeight: 600 }}>Address:</span>
              <span style={{ color: '#0f172a' }}>{customerAddress}</span>
            </>
          )}

          {customerPhone && (
            <>
              <span style={{ color: '#475569', fontWeight: 600 }}>Mobile:</span>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>{customerPhone}</span>
            </>
          )}

          {customerEmail && (
            <>
              <span style={{ color: '#475569', fontWeight: 600 }}>Email:</span>
              <span style={{ color: '#0f172a' }}>{customerEmail}</span>
            </>
          )}

          {customerAttention && customerAttention.trim() !== '' && (
            <>
              <span style={{ color: '#475569', fontWeight: 600 }}>Attention:</span>
              <span style={{ color: '#0f172a' }}>{customerAttention}</span>
            </>
          )}

          {customerDestination && customerDestination.trim() !== '' && (
            <>
              <span style={{ color: '#475569', fontWeight: 600 }}>Destination:</span>
              <span style={{ color: '#0f172a' }}>{customerDestination}</span>
            </>
          )}
        </div>
      </div>

      {/* Invoice Meta */}
      <div
        style={{
          padding: '4px 8px',
          fontSize: '0.72rem',
        }}
      >
        <div
          style={{
            borderBottom: '1px solid #cbd5e1',
            paddingBottom: '2px',
            marginBottom: '3px',
            fontSize: '0.68rem',
            fontWeight: 800,
            color: '#0284c7',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
          }}
        >
          Invoice Details
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '75px 1fr', gap: '1.5px 4px', fontSize: '0.72rem', lineHeight: 1.25 }}>
          <span style={{ color: '#475569', fontWeight: 600 }}>Invoice No:</span>
          <span style={{ color: '#0f172a', fontWeight: 800 }}>{docNumber}</span>

          <span style={{ color: '#475569', fontWeight: 600 }}>Date:</span>
          <span style={{ color: '#0f172a' }}>{dateFormatted}</span>

          {timeFormatted && (
            <>
              <span style={{ color: '#475569', fontWeight: 600 }}>Entry Time:</span>
              <span style={{ color: '#0f172a' }}>{timeFormatted}</span>
            </>
          )}

          {preparedBy && (
            <>
              <span style={{ color: '#475569', fontWeight: 600 }}>Prepared By:</span>
              <span style={{ color: '#0f172a' }}>{preparedBy}</span>
            </>
          )}

          {salesPerson && salesPerson !== preparedBy && (
            <>
              <span style={{ color: '#475569', fontWeight: 600 }}>Sales Person:</span>
              <span style={{ color: '#0f172a' }}>{salesPerson}</span>
            </>
          )}

          <span style={{ color: '#475569', fontWeight: 600 }}>Bill Status:</span>
          <div>
            <span
              style={{
                display: 'inline-block',
                padding: '1px 6px',
                borderRadius: '3px',
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.02em',
                background: isFullyPaid ? '#dcfce7' : (isPartialPaid ? '#fef3c7' : '#fee2e2'),
                color: isFullyPaid ? '#15803d' : (isPartialPaid ? '#b45309' : '#b91c1c'),
                border: `1px solid ${isFullyPaid ? '#86efac' : (isPartialPaid ? '#fde68a' : '#fca5a5')}`,
                textTransform: 'uppercase',
              }}
            >
              {paymentStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
