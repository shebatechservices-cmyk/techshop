import React from 'react';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function QuotationFinancialSummary({
  notes,
  onNotesChange,
  subtotal,
  discount,
  onDiscountChange,
  vat,
  onVatChange,
  grandTotal,
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '18px', alignItems: 'flex-start' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>
          Quotation Notes, Delivery & Payment Terms
        </label>
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Specify terms, delivery timeframe, or account details..."
          style={{
            width: '100%',
            padding: '9px 12px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '0.84rem',
            outline: 'none',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem' }}>
          <span>Subtotal:</span>
          <strong>{taka(subtotal)}</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: '0.85rem' }}>
          <span>Discount ৳:</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={discount}
            onChange={(e) => onDiscountChange(e.target.value)}
            style={{
              width: '90px',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              textAlign: 'right',
              fontSize: '0.85rem',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: '0.85rem' }}>
          <span>VAT / Tax ৳:</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={vat}
            onChange={(e) => onVatChange(e.target.value)}
            style={{
              width: '90px',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              textAlign: 'right',
              fontSize: '0.85rem',
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '10px 0 4px 0',
            borderTop: '2px solid #cbd5e1',
            marginTop: '8px',
            fontSize: '1.1rem',
            fontWeight: 800,
            color: '#0f172a',
          }}
        >
          <span>Grand Total:</span>
          <span style={{ color: '#4f46e5' }}>{taka(grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}
