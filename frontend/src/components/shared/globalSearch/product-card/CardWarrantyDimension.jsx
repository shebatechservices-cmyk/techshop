import React from 'react';
import { taka } from './cardFormatters';

export default function CardWarrantyDimension({ item, onSelect }) {
  const hasClaimsOrReturns =
    (item.warranty_claims && item.warranty_claims.length > 0) ||
    (item.returns_refunds && item.returns_refunds.length > 0);

  return (
    <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
        <span>🛡️</span> 4. WARRANTY & RETURNS
      </div>
      {hasClaimsOrReturns ? (
        <div>
          {item.warranty_claims?.slice(0, 1).map((wc, idx) => (
            <div
              key={`wc-${idx}`}
              style={{
                fontSize: '0.71rem',
                color: '#b45309',
                marginBottom: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect({ section: 'warranty', search: wc.claim_no });
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: '#b45309',
                  fontWeight: 800,
                  textDecoration: 'underline',
                }}
                title={`Click to view Claim #${wc.claim_no}`}
              >
                Claim #{wc.claim_no} ↗
              </button>
              <span>({wc.status}): {wc.issue_description || 'In process'}</span>
            </div>
          ))}
          {item.returns_refunds?.slice(0, 1).map((rr, idx) => (
            <div
              key={`rr-${idx}`}
              style={{
                fontSize: '0.71rem',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect({ section: 'warranty', search: rr.return_no });
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: '#dc2626',
                  fontWeight: 800,
                  textDecoration: 'underline',
                }}
                title={`Click to view Return #${rr.return_no}`}
              >
                Return #{rr.return_no} ↗
              </button>
              <span>: {rr.return_qty} pcs ({taka(rr.refund_amount)})</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: '0.71rem', color: '#94a3b8', fontStyle: 'italic', padding: '4px 0' }}>
          No active warranty claims or returns
        </div>
      )}
    </div>
  );
}
