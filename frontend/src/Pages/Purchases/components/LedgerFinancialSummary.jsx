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
        {Number(order?.discount || 0) > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#dc2626' }}>
            <span>Less Discount:</span>
            <span>- {taka(order.discount)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>
          <span>Supplier Bill:</span>
          <span>{taka(totalCost)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#10b981', fontWeight: 600 }}>
          <span>Paid to Supplier:</span>
          <span>{taka(totalPaid)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, color: remainingDue > 0 ? '#dc2626' : '#10b981' }}>
          <span>Supplier Due:</span>
          <span>{remainingDue > 0 ? taka(remainingDue) : '✓ Paid in Full'}</span>
        </div>

        {extraCost > 0 && (
          <div style={{ marginTop: '4px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#d97706', fontWeight: 600 }}>
              <span>🚚 Logistics ({order?.extra_cost_category || 'Expense'}):</span>
              <span>+ {taka(extraCost)} (In Expenses)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 800, color: '#334155' }}>
              <span>Total Landed Cost:</span>
              <span>{taka(Number(totalCost) + Number(extraCost))}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
