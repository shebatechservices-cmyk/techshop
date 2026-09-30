import React from 'react';

export default function PurchasePrintFinancials({
  isChalan = false,
  payments = [],
  itemsCost = 0,
  extraCost = 0,
  currentTotal = 0,
  previousDue = 0,
  totalPayable = 0,
  totalPaid = 0,
  remainingDue = 0,
  taka,
}) {
  if (isChalan) return null;

  return (
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
  );
}
