import React from 'react';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function SearchProductCard({ item, onSelect, onQuickView }) {
  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        marginBottom: '8px',
        background: '#ffffff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}
    >
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
              {item.name}
            </span>
            {item.brand_name && (
              <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: '4px' }}>
                {item.brand_name}
              </span>
            )}
            {item.category_name && (
              <span style={{ fontSize: '0.7rem', fontWeight: 600, background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: '4px' }}>
                {item.category_name}
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {item.sku ? `SKU: ${item.sku} ` : ''}{item.barcode ? `• Barcode: ${item.barcode}` : ''}
            {item.matched_serial && (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  background: item.matched_serial_status === 'Sold' ? '#f3e8ff' : '#ecfdf5',
                  color: item.matched_serial_status === 'Sold' ? '#7e22ce' : '#047857',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: `1px solid ${item.matched_serial_status === 'Sold' ? '#d8b4fe' : '#a7f3d0'}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>🎯 Matched S/N:</span>
                <span style={{ fontFamily: 'monospace' }}>{item.matched_serial}</span>
                <span>•</span>
                <span>{item.matched_serial_status === 'Sold' ? 'Sold' : 'In Stock'}</span>
              </span>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {onQuickView && (
            <button
              type="button"
              onClick={() => onQuickView(item)}
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                color: '#1e293b',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
              }}
              title="Open full 4-dimension modal popup"
            >
              <span>⚡</span> Quick View
            </button>
          )}
          <button
            type="button"
            onClick={() => onSelect({ section: 'inventory', search: item.name || item.sku })}
            style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              color: '#0284c7',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            View in Inventory →
          </button>
        </div>
      </div>

      {/* 4 Operational Dimensions Sub-Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '8px', marginTop: '10px' }}>
        
        {/* Dimension 1: Inventory and Stock */}
        <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
            <span>📦</span> 1. INVENTORY & STOCK
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
            <span>Stock: <strong style={{ color: Number(item.stock) > 0 ? '#15803d' : '#ef4444' }}>{item.stock} pcs</strong></span>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: Number(item.stock) > 0 ? '#dcfce7' : '#fee2e2', color: Number(item.stock) > 0 ? '#15803d' : '#991b1b' }}>
              {Number(item.stock) > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
            Sale: <strong>{taka(item.sale_price)}</strong> | Cost: {taka(item.cost_price)}
          </div>
          {item.supplier_warranty_expire_date ? (
            <div style={{ fontSize: '0.7rem', color: '#0369a1', fontWeight: 700, marginTop: '4px', background: '#e0f2fe', padding: '2px 5px', borderRadius: '4px' }}>
              🛡️ Supplier Exp (+60d): {new Date(item.supplier_warranty_expire_date).toLocaleDateString()}
            </div>
          ) : (
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '4px' }}>
              Supplier Warranty: Not assigned
            </div>
          )}
        </div>

        {/* Dimension 2: Sales Invoice (if sold) */}
        <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
            <span>🛒</span> 2. SALES INVOICES {item.sales_history?.length > 0 ? `(${item.sales_history.length})` : ''}
          </div>
          {item.sales_history && item.sales_history.length > 0 ? (
            item.sales_history.slice(0, 2).map((sh, idx) => (
              <div key={`sh-${idx}`} style={{ fontSize: '0.73rem', color: '#334155', borderBottom: idx === 0 && item.sales_history.length > 1 ? '1px dashed #cbd5e1' : 'none', paddingBottom: '2px', marginBottom: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect({
                        section: 'sales',
                        tab: 'history',
                        search: sh.invoice_no,
                      });
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      color: '#15803d',
                      fontWeight: 800,
                      fontSize: '0.74rem',
                      textDecoration: 'underline',
                      textUnderlineOffset: '2px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                    title={`Click to view Sale Invoice #${sh.invoice_no}`}
                  >
                    #{sh.invoice_no} ↗
                  </button>
                  <span style={{ color: '#64748b', fontSize: '0.68rem' }}>{sh.sale_date ? new Date(sh.sale_date).toLocaleDateString() : ''}</span>
                </div>
                <div style={{ color: '#64748b', fontSize: '0.71rem' }}>
                  {sh.customer_name} • {sh.quantity} pcs @ {taka(sh.unit_price)}
                </div>
              </div>
            ))
          ) : (
            <div style={{ fontSize: '0.71rem', color: item.matched_serial ? '#059669' : '#94a3b8', fontStyle: item.matched_serial ? 'normal' : 'italic', fontWeight: item.matched_serial ? 600 : 400, padding: '4px 0' }}>
              {item.matched_serial ? '✓ Unit in stock (Never sold)' : 'No sales recorded yet'}
            </div>
          )}
        </div>

        {/* Dimension 3: Purchase Invoice */}
        <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
            <span>🚚</span> 3. PURCHASE INVOICES {item.purchase_history?.length > 0 ? `(${item.purchase_history.length})` : ''}
          </div>
          {item.purchase_history && item.purchase_history.length > 0 ? (
            item.purchase_history.slice(0, 2).map((ph, idx) => (
              <div key={`ph-${idx}`} style={{ fontSize: '0.73rem', color: '#334155', borderBottom: idx === 0 && item.purchase_history.length > 1 ? '1px dashed #cbd5e1' : 'none', paddingBottom: '2px', marginBottom: '2px' }}>
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
                  <span style={{ color: '#64748b', fontSize: '0.68rem' }}>{ph.purchase_date ? new Date(ph.purchase_date).toLocaleDateString() : ''}</span>
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

        {/* Dimension 4: Warranty, Return-Refund */}
        <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
            <span>🛡️</span> 4. WARRANTY & RETURNS
          </div>
          {((item.warranty_claims && item.warranty_claims.length > 0) || (item.returns_refunds && item.returns_refunds.length > 0)) ? (
            <div>
              {item.warranty_claims?.slice(0, 1).map((wc, idx) => (
                <div key={`wc-${idx}`} style={{ fontSize: '0.71rem', color: '#b45309', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
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
                <div key={`rr-${idx}`} style={{ fontSize: '0.71rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
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

      </div>
    </div>
  );
}
