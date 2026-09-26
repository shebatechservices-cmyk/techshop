import React from 'react';
import { taka, formatDecimal, takaInWords, formatPrintDateTime } from './printModalHelpers';

export default function A4InvoiceView({
  store,
  storeName,
  storeSubtitle,
  storeAddress,
  storePhones,
  storeEmail,
  storeWebsite,
  storeLogo,
  storeSecondaryLogo,
  storeWatermarkLogo,
  showLogo,
  partnerLogos,
  returnPolicyText,
  warrantyDisclaimerText,
  invoiceFooterNote,
  showFooterDetails,
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
  items,
  totalQuantity,
  subtotal,
  discount,
  vat,
  setupCharge,
  extraCost,
  extraCostCategory,
  extraCostNotes,
  netPayable,
  previousDue,
  totalDueAmount,
  paidAmount,
  dueAmount,
  narration,
  paymentTenders,
  isQuotation,
  isChalan,
  printTime,
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

      {/* Top Document Content */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* 1. Header Grid */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid #0f172a',
            paddingBottom: '6px',
            marginBottom: '4px',
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
        <div style={{ textAlign: 'center', margin: '4px 0 6px 0' }}>
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

        {/* 2. Customer & Metadata Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            border: '1px solid #475569',
            borderRadius: '3px',
            marginBottom: '6px',
            background: '#ffffff',
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
              Invoice Metadata
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

        {/* 3. Dynamic Itemized Accounting Table */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid #475569',
            marginBottom: '6px',
            fontSize: '0.72rem',
          }}
        >
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #475569' }}>
              <th style={{ border: '1px solid #475569', padding: '3px 4px', textAlign: 'center', width: '28px', color: '#0f172a', fontSize: '0.68rem', fontWeight: 800 }}>SL</th>
              <th style={{ border: '1px solid #475569', padding: '3px 6px', textAlign: 'left', color: '#0f172a', fontSize: '0.68rem', fontWeight: 800 }}>Product Description & Serials</th>
              <th style={{ border: '1px solid #475569', padding: '3px 4px', textAlign: 'center', width: '65px', color: '#0f172a', fontSize: '0.68rem', fontWeight: 800 }}>Warranty</th>
              <th style={{ border: '1px solid #475569', padding: '3px 4px', textAlign: 'right', width: '40px', color: '#0f172a', fontSize: '0.68rem', fontWeight: 800 }}>Qty</th>
              <th style={{ border: '1px solid #475569', padding: '3px 4px', textAlign: 'center', width: '36px', color: '#0f172a', fontSize: '0.68rem', fontWeight: 800 }}>UoM</th>
              {!isChalan && (
                <>
                  <th style={{ border: '1px solid #475569', padding: '3px 6px', textAlign: 'right', width: '75px', color: '#0f172a', fontSize: '0.68rem', fontWeight: 800 }}>Unit Price</th>
                  <th style={{ border: '1px solid #475569', padding: '3px 6px', textAlign: 'right', width: '85px', color: '#0f172a', fontSize: '0.68rem', fontWeight: 800 }}>Amount</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #64748b', pageBreakInside: 'avoid' }}>
                <td style={{ border: '1px solid #64748b', padding: '2px 4px', textAlign: 'center', color: '#475569', fontSize: '0.7rem' }}>{idx + 1}</td>
                <td style={{ border: '1px solid #64748b', padding: '2px 6px' }}>
                  <div style={{ color: '#0f172a', fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.25 }}>
                    {it.name}
                  </div>
                  {it.serials && it.serials.length > 0 && (
                    <div style={{ marginTop: '1px', fontSize: '0.64rem', color: '#0284c7', fontFamily: 'monospace', fontWeight: 600, wordBreak: 'break-all' }}>
                      <strong>S/N:</strong> {it.serials.join(', ')}
                    </div>
                  )}
                </td>
                <td style={{ border: '1px solid #64748b', padding: '2px 4px', textAlign: 'center', color: '#334155', fontSize: '0.68rem', fontWeight: 600 }}>
                  {it.warranty || '—'}
                </td>
                <td style={{ border: '1px solid #64748b', padding: '2px 4px', textAlign: 'right', fontWeight: 700, fontSize: '0.72rem' }}>
                  {formatDecimal(it.qty)}
                </td>
                <td style={{ border: '1px solid #64748b', padding: '2px 4px', textAlign: 'center', color: '#475569', fontSize: '0.68rem' }}>
                  {it.uom}
                </td>
                {!isChalan && (
                  <>
                    <td style={{ border: '1px solid #64748b', padding: '2px 6px', textAlign: 'right', color: '#334155', fontSize: '0.72rem' }}>
                      {taka(it.unitPrice)}
                    </td>
                    <td style={{ border: '1px solid #64748b', padding: '2px 6px', textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: '0.72rem' }}>
                      {taka(it.amount)}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* 4. Settlement & Financial Ledger */}
        {!isChalan && (
          <div
            className="avoid-break"
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'stretch',
              marginBottom: '6px',
              fontSize: '0.72rem',
            }}
          >
            {/* Left Column: Total Qty badge, In Words, Narration, Return Policy */}
            <div style={{ flex: '1 1 54%', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    border: '1px solid #0f172a',
                    background: '#f8fafc',
                    padding: '1.5px 8px',
                    borderRadius: '3px',
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    color: '#0f172a',
                  }}
                >
                  Total Qty: {formatDecimal(totalQuantity)}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '6px', padding: '1px 0' }}>
                <span style={{ color: '#475569', fontWeight: 700, minWidth: '78px', fontSize: '0.7rem' }}>Taka In Word:</span>
                <span style={{ color: '#0f172a', fontWeight: 700, fontSize: '0.7rem' }}>{takaInWords(netPayable + previousDue)}</span>
              </div>

              {narration && (
                <div style={{ display: 'flex', gap: '6px', padding: '1px 0' }}>
                  <span style={{ color: '#475569', fontWeight: 700, minWidth: '78px', fontSize: '0.7rem' }}>Narration:</span>
                  <span style={{ color: '#0f172a', whiteSpace: 'pre-line', fontSize: '0.7rem' }}>{narration}</span>
                </div>
              )}

              {returnPolicyText && (
                <div
                  style={{
                    marginTop: '2px',
                    padding: '4px 6px',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '3px',
                    fontSize: '0.64rem',
                    color: '#334155',
                    lineHeight: 1.3,
                    whiteSpace: 'pre-line',
                  }}
                >
                  <strong style={{ color: '#0f172a', display: 'block', marginBottom: '1.5px' }}>Terms & Return Policy:</strong>
                  {returnPolicyText}
                </div>
              )}
            </div>

            {/* Right Column: Ledger Math */}
            <div
              style={{
                flex: '0 0 255px',
                border: '1px solid #475569',
                borderRadius: '3px',
                padding: '3px 6px',
                alignSelf: 'flex-start',
                fontSize: '0.72rem',
                background: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>
                <span>Total Amount:</span>
                <strong style={{ color: '#0f172a' }}>{taka(subtotal)}</strong>
              </div>

              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>
                  <span>Less Discount:</span>
                  <strong style={{ color: '#dc2626' }}>-{taka(discount)}</strong>
                </div>
              )}

              {vat > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>
                  <span>Add VAT / Tax:</span>
                  <strong style={{ color: '#0f172a' }}>+{taka(vat)}</strong>
                </div>
              )}

              {(setupCharge > 0 || extraCost > 0) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>
                  <span>{extraCostCategory || 'Extra / Logistics Charges'}:</span>
                  <strong style={{ color: '#15803d' }}>+{taka(setupCharge + extraCost)}</strong>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid #94a3b8', fontWeight: 800, fontSize: '0.76rem', color: '#0f172a', background: '#f8fafc' }}>
                <span>Net Payable Amount:</span>
                <span style={{ color: '#0284c7' }}>{taka(netPayable)}</span>
              </div>

              {!isQuotation && (
                <>
                  {previousDue !== 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>
                      <span>Previous Due:</span>
                      <strong style={{ color: '#0f172a' }}>{taka(previousDue)}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', borderBottom: '1px solid #f1f5f9', fontWeight: 700, color: '#0f172a' }}>
                    <span>Total Due Amount:</span>
                    <span>{taka(totalDueAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', borderBottom: '1px solid #f1f5f9', color: '#15803d' }}>
                    <span>Received Amount:</span>
                    <strong>{taka(paidAmount)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5px 0', color: dueAmount > 0 ? '#b91c1c' : '#15803d', fontWeight: 800, background: dueAmount > 0 ? '#fef2f2' : '#f0fdf4' }}>
                    <span>Balance Due:</span>
                    <span>{taka(dueAmount)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Payment Breakdown & Notes */}
        {!isChalan && (paymentTenders.length > 0 || extraCostNotes) && (
          <div className="avoid-break" style={{ marginTop: '2px', fontSize: '0.66rem', color: '#475569', borderTop: '1px dashed #cbd5e1', paddingTop: '2px' }}>
            {paymentTenders.length > 0 && (
              <div style={{ marginBottom: extraCostNotes ? '1px' : 0 }}>
                <strong>Payment Tenders:</strong>{' '}
                {paymentTenders.map((t, idx) =>
                  `${idx + 1}. ${t.method || 'Cash'}${t.sub_option ? ` (${t.sub_option})` : ''}${t.transaction_id ? ` · Txn:${t.transaction_id}` : ''} = ${taka(t.amount || 0)}`
                ).join(' , ')}
              </div>
            )}
            {extraCostNotes && (
              <div style={{ color: '#c2410c' }}>
                <strong>Extra Charge Note:</strong> {extraCostNotes}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Details: Signatures, Partner Strip, Disclaimer */}
      {showFooterDetails ? (
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
      ) : (
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
      )}
    </>
  );
}
