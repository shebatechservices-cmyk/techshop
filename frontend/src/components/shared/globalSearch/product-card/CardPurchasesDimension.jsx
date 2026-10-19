import React from 'react';
import { taka } from './cardFormatters';

export default function CardPurchasesDimension({ item, onSelect }) {
  const hasHistory = item.purchase_history && item.purchase_history.length > 0;

  return (
    <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
        <span>🚚</span> 3. PURCHASE INVOICES {hasHistory ? `(${item.purchase_history.length})` : ''}
      </div>
      {hasHistory ? (
        item.purchase_history.slice(0, 2).map((ph, idx) => (
          <div
            key={`ph-${idx}`}
            style={{
              fontSize: '0.73rem',
              color: '#334155',
              borderBottom: idx === 0 && item.purchase_history.length > 1 ? '1px dashed #cbd5e1' : 'none',
              paddingBottom: '2px',
              marginBottom: '2px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect({
                    section: 'purchases',
                    tab: 'history',
                    search: ph.po_number,
                  });
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: '#0e7490',
                  fontWeight: 800,
                  fontSize: '0.74rem',
                  textDecoration: 'underline',
                  textUnderlineOffset: '2px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                }}
                title={`Click to view Purchase Order #${ph.po_number}`}
              >
                #{ph.po_number} ↗
              </button>
              <span style={{ color: '#64748b', fontSize: '0.68rem' }}>
                {ph.purchase_date ? new Date(ph.purchase_date).toLocaleDateString() : ''}
              </span>
            </div>
            <div style={{ color: '#64748b', fontSize: '0.71rem' }}>
              {ph.supplier_name} • {ph.quantity} pcs @ {taka(ph.cost_price)}
            </div>
            {ph.supplier_warranty_expire_date && (
              <div style={{ color: '#0369a1', fontSize: '0.68rem', fontWeight: 600 }}>
                Sup Exp: {new Date(ph.supplier_warranty_expire_date).toLocaleDateString()}
              </div>
            )}
          </div>
        ))
      ) : (
        <div style={{ fontSize: '0.71rem', color: '#94a3b8', fontStyle: 'italic', padding: '4px 0' }}>
          No purchase records found
        </div>
      )}
    </div>
  );
}
