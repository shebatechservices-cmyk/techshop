import React from 'react';

export default function NewProjectInvoiceSelector({
  invoices = [],
  selectedInvoice,
  onSelectInvoice
}) {
  return (
    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 16px', marginBottom: '18px' }}>
      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1e40af', marginBottom: '6px' }}>
        🔗 Select Sales Invoice (Customer & equipment details will auto-load):
      </label>
      <select
        value={selectedInvoice?.id || ''}
        onChange={(e) => onSelectInvoice(e.target.value)}
        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #93c5fd', fontSize: '0.85rem', background: '#fff' }}
      >
        <option value="">-- Select Recent Invoice --</option>
        {invoices.map(inv => (
          <option key={inv.id} value={inv.id}>
            {inv.invoice_no} — {inv.customer_name} ({inv.customer_phone || 'No Phone'}) — ৳ {Number(inv.total_amount || 0).toLocaleString('en-BD')}{Number(inv.setup_charge) > 0 ? ` [Setup Fee: ৳${Number(inv.setup_charge).toLocaleString('en-BD')}]` : ''}
          </option>
        ))}
      </select>

      {/* Attached items preview */}
      {selectedInvoice && (
        <div style={{ marginTop: '10px', background: '#fff', borderRadius: '6px', padding: '10px 12px', border: '1px solid #dbeafe' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e40af', display: 'block', marginBottom: '6px' }}>
            Invoice Items / Equipment Attached:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(selectedInvoice.items || []).map((it, idx) => (
              <span key={idx} style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '0.76rem', color: '#334155' }}>
                • {it.product_name} <strong>(x{it.quantity})</strong>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
