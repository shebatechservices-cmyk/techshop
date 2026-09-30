import React from 'react';
import { fullCatalogName as defaultFullCatalogName } from '../../../utils/productUtils';
import { taka as defaultTaka } from '../templates/purchaseModalHelpers';

export default function PurchasePrintDocument({
  paperSize = 'a4',
  pageMargin = 'default',
  company = {},
  showLogo = true,
  showSignature = true,
  isChalan = false,
  poNumber = '',
  dateStr = '',
  order = {},
  supplierName = '',
  supplierPhone = '',
  supplierContact = '',
  supplierAddress = '',
  items = [],
  payments = [],
  itemsCost = 0,
  extraCost = 0,
  currentTotal = 0,
  previousDue = 0,
  totalPayable = 0,
  totalPaid = 0,
  remainingDue = 0,
  showFooterDetails = true,
  taka = defaultTaka,
  fullCatalogName = defaultFullCatalogName,
}) {
  return (
    <div id="purchase-print-area" className="a4-page-sheet" style={{
      width: '100%',
      maxWidth: paperSize === 'thermal_80mm' ? '380px' : (paperSize === 'a5' ? '600px' : '840px'),
      minHeight: paperSize === 'thermal_80mm' ? 'auto' : (paperSize === 'a5' ? '195mm' : '275mm'),
      background: '#ffffff',
      color: '#1e293b',
      borderRadius: '12px',
      padding: pageMargin === '1in' ? '36px 40px' : (pageMargin === '0.5in' ? '22px 26px' : '16px 20px'),
      boxShadow: '0 10px 40px rgba(0,0,0,0.18)',
      boxSizing: 'border-box',
      fontSize: paperSize === 'thermal_80mm' ? '9.5px' : (paperSize === 'a5' ? '10px' : '11px'),
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      {/* Header Block */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottom: '2px solid #0f172a',
        paddingBottom: '10px',
        marginBottom: '10px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0284c7, #0f172a)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 900,
              fontSize: '1.1rem',
            }}>
              ST
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                {company.name}
              </h1>
              {company.tagline && (
                <p style={{ margin: '1px 0 0', fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                  {company.tagline}
                </p>
              )}
            </div>
          </div>
          {showLogo && company.logo && (
            <img
              src={company.logo}
              alt={company.name}
              style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '6px', marginTop: '6px' }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
          <div style={{ marginTop: '5px', fontSize: '0.75rem', color: '#475569', lineHeight: 1.35 }}>
            <div>{company.address}</div>
            <div>Phone: {company.phone} · Email: {company.email}</div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: '6px',
            background: '#f0f9ff',
            border: '1.5px solid #0284c7',
            color: '#0369a1',
            fontWeight: 800,
            fontSize: '0.88rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>
            Purchase {isChalan ? 'Delivery Challan' : 'Order'}
          </div>
          <div style={{ marginTop: '5px', fontSize: '0.8rem', color: '#0f172a', fontWeight: 700 }}>
            {isChalan ? 'Chalan No: ' : 'PO No: '}<span style={{ color: '#0284c7' }}>{poNumber}</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '1px' }}>
            Date: {dateStr}
          </div>
          {order.transaction_reference && (
            <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: '1px' }}>
              Ref: <strong>{order.transaction_reference}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Vendor & Order Details Grid */}
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

      {/* Itemized Table */}
      <div style={{ marginBottom: '12px' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.76rem',
          textAlign: 'left',
          pageBreakInside: 'auto',
          breakInside: 'auto',
        }}>
          <thead>
            <tr style={{ background: '#0f172a', color: '#ffffff' }}>
              <th style={{ padding: '4px 6px', width: '28px', textAlign: 'center' }}>#</th>
              <th style={{ padding: '4px 6px' }}>Product Description</th>
              <th style={{ padding: '4px 6px', width: '65px', textAlign: 'center' }}>Warranty</th>
              {!isChalan && <th style={{ padding: '4px 6px', width: '80px', textAlign: 'right' }}>Unit Cost</th>}
              <th style={{ padding: '4px 6px', width: '40px', textAlign: 'center' }}>Qty</th>
              {!isChalan && <th style={{ padding: '4px 6px', width: '90px', textAlign: 'right' }}>Total Cost</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const qty = Number(item.quantity || 0);
              const cost = Number(item.cost_price || 0);
              const total = Number(item.line_total || cost * qty);
              const serials = Array.isArray(item.serials) ? item.serials : [];
              return (
                <tr
                  key={idx}
                  style={{
                    borderBottom: '1px solid #e2e8f0',
                    background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid',
                  }}
                >
                  <td style={{ padding: '3.5px 6px', textAlign: 'center', fontWeight: 600, color: '#64748b' }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: '3.5px 6px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.25, fontSize: '0.78rem' }}>
                      {fullCatalogName(item) || item.full_name || item.name || item.product_name || 'Product'}
                    </div>
                    {!item.full_name && item.brand_name && (
                      <div style={{ fontSize: '0.68rem', color: '#64748b', lineHeight: 1.2 }}>
                        Brand: {item.brand_name}
                      </div>
                    )}
                    {serials.length > 0 && (
                      <div style={{
                        fontSize: '0.66rem',
                        color: '#0369a1',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        marginTop: '2px',
                        lineHeight: 1.25,
                        wordBreak: 'break-word',
                      }}>
                        <strong style={{ color: '#0284c7', fontFamily: 'inherit' }}>S/N:</strong> {serials.join(', ')}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '3.5px 6px', textAlign: 'center', color: '#475569' }}>
                    {item.warranty_months ? `${item.warranty_months} Mos` : '—'}
                  </td>
                  {!isChalan && (
                    <td style={{ padding: '3.5px 6px', textAlign: 'right', fontWeight: 600 }}>
                      {taka(cost)}
                    </td>
                  )}
                  <td style={{ padding: '3.5px 6px', textAlign: 'center', fontWeight: 700, color: '#0284c7' }}>
                    {qty}
                  </td>
                  {!isChalan && (
                    <td style={{ padding: '3.5px 6px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                      {taka(total)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Financial Calculation Breakdown & Payments */}
      {!isChalan && (
      <div className="print-avoid-break" style={{
        display: 'grid',
        gridTemplateColumns: '1.15fr 1fr',
        gap: '12px',
        marginBottom: '12px',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}>
        {/* Payment Tenders Detail */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '10px 12px',
          fontSize: '0.78rem',
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
            Payment Tenders Recorded ({payments.length})
          </div>
          {payments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {payments.map((p, pIdx) => (
                <div key={pIdx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 8px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '5px',
                }}>
                  <div>
                    <strong style={{ color: '#0f172a' }}>{p.payment_method || 'Cash'}</strong>
                    {p.account_name && <span style={{ color: '#64748b' }}> · {p.account_name}</span>}
                    {p.transaction_id && <span style={{ color: '#0284c7' }}> · Trx: {p.transaction_id}</span>}
                  </div>
                  <strong style={{ color: '#16a34a' }}>{taka(p.amount)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.74rem' }}>
              No payment tenders recorded (Full Due / Credit).
            </div>
          )}
        </div>

        {/* Financial Calculation Box */}
        <div style={{
          background: '#ffffff',
          border: '1.5px solid #cbd5e1',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '0.8rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', color: '#475569' }}>
            <span>Items Subtotal:</span>
            <strong>{taka(itemsCost)}</strong>
          </div>

          {extraCost > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', color: '#475569' }}>
              <span>Freight / Extra Cost:</span>
              <strong>{taka(extraCost)}</strong>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderTop: '1px solid #f1f5f9', color: '#0f172a', fontWeight: 700 }}>
            <span>Current Order Total:</span>
            <strong style={{ color: '#0284c7' }}>{taka(currentTotal)}</strong>
          </div>

          {previousDue > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', color: '#b45309' }}>
              <span>Previous Due Balance:</span>
              <strong>{taka(previousDue)}</strong>
            </div>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '5px 0',
            borderTop: '1.5px solid #0f172a',
            marginTop: '3px',
            fontSize: '0.92rem',
            fontWeight: 900,
            color: '#0f172a',
          }}>
            <span>Total Payable:</span>
            <span>{taka(totalPayable)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', color: '#16a34a', fontWeight: 700 }}>
            <span>Total Paid:</span>
            <strong>{taka(totalPaid)}</strong>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '4px 0',
            borderTop: '1px dashed #cbd5e1',
            marginTop: '2px',
            fontWeight: 800,
            color: remainingDue > 0 ? '#dc2626' : '#16a34a',
          }}>
            <span>Remaining Due:</span>
            <span>{taka(remainingDue)}</span>
          </div>
        </div>
      </div>
      )}

      {/* Terms & Signature Section */}
      {showFooterDetails && (
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
            Computer-generated purchase receipt powered by {company.name} ERP System · Printed: {new Date().toLocaleString('en-GB')}
          </div>
        </div>
      )}
      {!showSignature && <div style={{ height: '8px' }} />}
    </div>
  );
}
