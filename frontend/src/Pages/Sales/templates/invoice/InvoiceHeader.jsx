import React from 'react';

export default function InvoiceHeader({
  storeName,
  storeSubtitle,
  storeAddress,
  storePhones,
  storeEmail,
  storeWebsite,
  storeLogo,
  storeSecondaryLogo,
  storeWatermarkLogo,
  showLogo = true,
  isQuotation = false,
  isChalan = false,
}) {
  return (
    <>
      {/* Watermark Background (Center Subtle Logo) */}
      {storeWatermarkLogo && (
        <div
          className="print-watermark"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            opacity: 0.04,
            zIndex: 0,
          }}
        >
          <img
            src={storeWatermarkLogo}
            alt="Store Watermark"
            style={{
              maxHeight: '340px',
              maxWidth: '340px',
              objectFit: 'contain',
              filter: 'grayscale(100%)',
            }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      )}

      {/* 1. Header Grid */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #0f172a',
          paddingBottom: '6px',
          marginBottom: '4px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Primary Store Logo */}
        <div style={{ display: 'flex', alignItems: 'center', minWidth: '70px' }}>
          {showLogo && storeLogo && (
            <img
              src={storeLogo}
              alt={storeName || 'Store Logo'}
              style={{ maxHeight: '50px', maxWidth: '90px', objectFit: 'contain' }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
        </div>

        {/* Center Store Info */}
        <div style={{ textAlign: 'center', flex: 1, padding: '0 8px' }}>
          {storeName && (
            <h1 style={{ margin: 0, fontSize: '1.42rem', color: '#0f172a', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {storeName}
            </h1>
          )}
          {storeSubtitle && (
            <p style={{ margin: '1px 0 0 0', fontSize: '0.72rem', color: '#0284c7', fontWeight: 700, letterSpacing: '0.01em' }}>
              {storeSubtitle}
            </p>
          )}
          {storeAddress && (
            <p style={{ margin: '1.5px 0 0 0', fontSize: '0.66rem', color: '#334155', lineHeight: 1.25 }}>
              {storeAddress}
            </p>
          )}
          {storePhones && (
            <p style={{ margin: '1px 0 0 0', fontSize: '0.66rem', color: '#475569' }}>
              📞 <strong>Phone:</strong> {storePhones}
            </p>
          )}
          {(storeEmail || storeWebsite) && (
            <p style={{ margin: '1px 0 0 0', fontSize: '0.66rem', color: '#64748b' }}>
              {storeEmail && `✉️ ${storeEmail}`}
              {storeEmail && storeWebsite && ' | '}
              {storeWebsite && `🌐 ${storeWebsite}`}
            </p>
          )}
        </div>

        {/* Secondary / Partner Logo */}
        <div style={{ textAlign: 'right', minWidth: '70px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
          {storeSecondaryLogo && (
            <img
              src={storeSecondaryLogo}
              alt="Partner / Secondary Logo"
              style={{ maxHeight: '46px', maxWidth: '95px', objectFit: 'contain' }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
        </div>
      </div>

      {/* Center Document Tag */}
      <div style={{ textAlign: 'center', margin: '4px 0 6px 0', position: 'relative', zIndex: 1 }}>
        <span
          style={{
            display: 'inline-block',
            border: '1.5px solid #0f172a',
            background: isQuotation ? '#4f46e5' : (isChalan ? '#16a34a' : '#f8fafc'),
            color: isQuotation || isChalan ? '#ffffff' : '#0f172a',
            padding: '2px 20px',
            borderRadius: '4px',
            fontWeight: 800,
            fontSize: '0.82rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {isQuotation ? 'Sales Quotation' : (isChalan ? 'Delivery Challan' : 'Sales Invoice')}
        </span>
      </div>
    </>
  );
}
