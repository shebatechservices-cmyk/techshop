import React from 'react';

export default function DayCloseBreakdownTables({ summary, sales, purchases }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '16px',
        marginBottom: '20px',
      }}
    >
      {/* Cash & Inflow Sources */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px',
        }}
      >
        <h4
          style={{
            margin: '0 0 12px',
            fontSize: '0.92rem',
            color: '#0f172a',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          📥 Inflow Receipts
        </h4>
        <table style={{ width: '100%', fontSize: '0.84rem', borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '8px 0', color: '#64748b' }}>Cash Sales Collection:</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                ৳ {Number(sales.total_collected || 0).toLocaleString()}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '8px 0', color: '#64748b' }}>Customer Due Collections:</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                ৳ {Number(summary.total_dues_collected || 0).toLocaleString()}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '8px 0', color: '#64748b' }}>Bank & MFS (bKash/Nagad) Inflow:</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, color: '#0284c7' }}>
                ৳ {Number(summary.bank_mfs_inflow || 0).toLocaleString()}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', fontWeight: 700, color: '#0f172a' }}>Total Today's Cash Inflow:</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 800, color: '#15803d', fontSize: '0.95rem' }}>
                ৳ {Number(summary.cash_inflow || 0).toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Cash Outflow Sources */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px',
        }}
      >
        <h4
          style={{
            margin: '0 0 12px',
            fontSize: '0.92rem',
            color: '#0f172a',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          📤 Outflow Disbursements
        </h4>
        <table style={{ width: '100%', fontSize: '0.84rem', borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '8px 0', color: '#64748b' }}>Supplier Payouts (Due & Advance):</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                ৳ {Number(summary.total_supplier_paid || 0).toLocaleString()}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '8px 0', color: '#64748b' }}>Today's Purchase Orders ({purchases.total_pos || 0} POs):</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, color: '#475569' }}>
                ৳ {Number(purchases.total_purchased || 0).toLocaleString()}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '8px 0', color: '#64748b' }}>Operating Expenses & Allowances:</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                ৳ {Number(summary.total_expenses || 0).toLocaleString()}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', fontWeight: 700, color: '#0f172a' }}>Total Today's Cash Outflow:</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 800, color: '#b91c1c', fontSize: '0.95rem' }}>
                ৳ {Number(summary.cash_outflow || 0).toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
