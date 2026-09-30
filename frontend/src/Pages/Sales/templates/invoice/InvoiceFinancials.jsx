import React from 'react';
import { taka, formatDecimal, takaInWords } from '../printModalHelpers';

export default function InvoiceFinancials({
  isChalan = false,
  isQuotation = false,
  totalQuantity = 0,
  subtotal = 0,
  discount = 0,
  vat = 0,
  setupCharge = 0,
  extraCost = 0,
  extraCostCategory = '',
  extraCostNotes = '',
  netPayable = 0,
  previousDue = 0,
  totalDueAmount = 0,
  paidAmount = 0,
  dueAmount = 0,
  narration = '',
  returnPolicyText = '',
  paymentTenders = [],
}) {
  if (isChalan) return null;

  return (
    <>
      {/* 4. Settlement & Financial Ledger */}
      <div
        className="avoid-break"
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'stretch',
          marginBottom: '6px',
          fontSize: '0.72rem',
          position: 'relative',
          zIndex: 1,
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

      {/* Payment Breakdown & Notes */}
      {(paymentTenders.length > 0 || extraCostNotes) && (
        <div className="avoid-break" style={{ marginTop: '2px', fontSize: '0.66rem', color: '#475569', borderTop: '1px dashed #cbd5e1', paddingTop: '2px', position: 'relative', zIndex: 1 }}>
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
    </>
  );
}
