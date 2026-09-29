import React from 'react';

const defaultTaka = (val) =>
  `৳${(Number(val) || 0).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function LedgerFinancialSummary({
  payments = [],
  itemsSubtotal = 0,
  extraCost = 0,
  totalCost = 0,
  totalPaid = 0,
  remainingDue = 0,
  order = {},
  taka = defaultTaka,
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      {/* Payment Tenders Recorded */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', background: '#f8fafc' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
          Payment Tenders
        </div>
        {payments.length === 0 ? (
          <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>
            No payment records attached (Fully Due)
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {payments.map((p, pIdx) => (
              <div key={p.id || pIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', padding: '6px 8px', background: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{p.payment_method || 'Cash'}</span>
                  <span style={{ color: '#64748b', fontSize: '0.76rem', marginLeft: '6px' }}>
                    ({p.account_name || p.sub_option || 'Primary'})
                  </span>
                  {p.receiver_name && (
                    <div style={{ fontSize: '0.72rem', color: '#0284c7' }}>
                      Receiver: {p.receiver_name}
                    </div>
                  )}
                  {p.transaction_id && (
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Trx: {p.transaction_id}
                    </div>
                  )}
                </div>
                <strong style={{ color: '#10b981' }}>{taka(p.amount)}</strong>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totals Summary */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#475569' }}>
          <span>Items Subtotal:</span>
          <span>{taka(itemsSubtotal)}</span>
        </div>
        {extraCost > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#475569' }}>
            <span>Extra Cost ({order?.extra_cost_category || 'Logistics'}):</span>
            <span>{taka(extraCost)}</span>
          </div>
        )}
        <div style={{ height: '1px', background: '#e2e8f0', margin: '2px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.94rem', fontWeight: 800, color: '#0f172a' }}>
          <span>Grand Total Cost:</span>
          <span>{taka(totalCost)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#10b981', fontWeight: 600 }}>
          <span>Total Paid:</span>
          <span>{taka(totalPaid)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, color: remainingDue > 0 ? '#dc2626' : '#10b981' }}>
          <span>Remaining Due:</span>
          <span>{remainingDue > 0 ? taka(remainingDue) : '✓ No Dues'}</span>
        </div>
      </div>
    </div>
  );
}
