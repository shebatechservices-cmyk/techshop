import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function EcommercePrintModal({ isOpen, onClose, order }) {
  const [printFormat, setPrintFormat] = useState('a4'); // 'a4' | 'pos'
  const [shop, setShop] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetch(`${API}/settings`)
        .then((res) => res.json())
        .then((json) => {
          if (json && json.data) setShop(json.data);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const company = {
    name: shop.shop_name || 'Sheba Technology',
    tagline: shop.shop_title || 'Security Solutions, Networking & IT Hardware',
    phone: [shop.phone, shop.alt_phone].filter(Boolean).join(', ') || '+880 1700-000000',
    email: shop.email || '',
    web: shop.website || 'www.shebatech.com.bd',
    logo: shop.logo_url || '',
  };

  const showLogo = shop.show_logo_on_invoice !== false;
  const invoiceFooterNote = shop.invoice_footer_note || '';

  const handlePrint = () => {
    window.print();
  };

  const items = order.items || [];
  const itemsSubtotal = items.reduce((sum, it) => sum + money(it.quantity) * money(it.unit_price), 0);
  const deliveryCharge = money(order.delivery_charge || 0);
  const grandTotal = money(order.total_amount || (itemsSubtotal + deliveryCharge));
  const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .ecom-printable-area, .ecom-printable-area * {
            visibility: visible;
          }
          .ecom-printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 10px !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: printFormat === 'a4' ? '820px' : '420px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          transition: 'max-width 0.2s ease',
        }}
      >
        {/* Top Control Header */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
              Print Online Order #{order.order_no || order.order_number || order.id}
            </span>
            <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '6px', padding: '2px' }}>
              <button
                type="button"
                onClick={() => setPrintFormat('a4')}
                style={{
                  padding: '4px 10px',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: printFormat === 'a4' ? '#ffffff' : 'transparent',
                  color: printFormat === 'a4' ? '#0f172a' : '#64748b',
                  boxShadow: printFormat === 'a4' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                📄 A4 Invoice
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('pos')}
                style={{
                  padding: '4px 10px',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: printFormat === 'pos' ? '#ffffff' : 'transparent',
                  color: printFormat === 'pos' ? '#0f172a' : '#64748b',
                  boxShadow: printFormat === 'pos' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                🏷️ Thermal Sticker
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                padding: '7px 16px',
                background: '#0d9488',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              🖨️ Print Now
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '7px 12px',
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.86rem',
                cursor: 'pointer',
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document View */}
        <div style={{ overflowY: 'auto', padding: '24px', flex: 1, background: '#ffffff' }}>
          {printFormat === 'a4' ? (
            /* A4 FORMAT */
            <div
              className="ecom-printable-area"
              style={{
                maxWidth: '750px',
                margin: '0 auto',
                background: '#ffffff',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                color: '#1e293b',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0d9488', paddingBottom: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {showLogo && company.logo && (
                    <img
                      src={company.logo}
                      alt={company.name}
                      style={{ width: '52px', height: '52px', objectFit: 'contain', borderRadius: '8px' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                      {company.name.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                      {company.tagline}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>
                      {company.web && `🌐 ${company.web}`} · 📞 {company.phone}
                      {company.email ? ` · ✉️ ${company.email}` : ''}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-block', background: '#f0fdfa', border: '1px solid #99f6e4', color: '#0d9488', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
                    ONLINE ORDER PACKING SLIP
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                    #{order.order_no || order.order_number || order.id}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>
                    Order Placed: {orderDate}
                  </div>
                </div>
              </div>

              {/* Customer & Shipping Details Boxes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                    📦 DELIVER TO / CUSTOMER
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                    {order.customer_name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#334155', marginTop: '4px' }}>
                    📞 {order.customer_phone}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '6px', lineHeight: '1.4' }}>
                    📍 {order.shipping_address}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                    🚚 SHIPPING &amp; PAYMENT INFO
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                    <span style={{ color: '#64748b' }}>Courier Partner:</span>
                    <strong style={{ color: '#0f172a' }}>{order.courier_name || 'Standard Courier'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                    <span style={{ color: '#64748b' }}>Consignment / Tracking:</span>
                    <strong style={{ color: '#0f172a' }}>{order.tracking_code || 'Pending Dispatch'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                    <span style={{ color: '#64748b' }}>Payment Mode:</span>
                    <strong style={{ textTransform: 'uppercase', color: '#0f172a' }}>{order.payment_method || 'Cash On Delivery'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: '#64748b' }}>Payment Status:</span>
                    <strong style={{ color: (order.payment_status || '').toLowerCase() === 'paid' ? '#16a34a' : '#b45309', textTransform: 'uppercase' }}>
                      {order.payment_status || 'Unpaid / COD'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Products Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: '40px' }}>#</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>ITEM &amp; SPECIFICATION</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: '60px' }}>QTY</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', width: '100px' }}>UNIT PRICE</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', width: '110px' }}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const lineTotal = money(it.quantity) * money(it.unit_price);
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                        <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{it.product_name || `Product ID #${it.product_id}`}</div>
                          {it.sku && <div style={{ fontSize: '0.74rem', color: '#64748b' }}>SKU: {it.sku}</div>}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700 }}>{it.quantity}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#334155' }}>{taka(it.unit_price)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{taka(lineTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Total Calculation Box */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                <div style={{ width: '280px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#475569', marginBottom: '6px' }}>
                    <span>Items Subtotal:</span>
                    <span>{taka(itemsSubtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#475569', marginBottom: '8px' }}>
                    <span>Delivery Charge:</span>
                    <span>{taka(deliveryCharge)}</span>
                  </div>
                  <div style={{ borderTop: '2px solid #cbd5e1', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                    <span>Total Amount:</span>
                    <span style={{ color: '#0d9488' }}>{taka(grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Notes if any */}
              {order.customer_notes && (
                <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '6px', padding: '10px 14px', fontSize: '0.82rem', color: '#92400e', marginBottom: '20px' }}>
                  <strong>Customer Note:</strong> {order.customer_notes}
                </div>
              )}

              {/* Footer Declaration */}
              <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.76rem', color: '#64748b' }}>
                <div>
                  <p style={{ margin: 0 }}>✓ Computer generated packing slip. No signature required.</p>
                  <p style={{ margin: '2px 0 0 0' }}>Please inspect products upon parcel delivery.</p>
                  {invoiceFooterNote && <p style={{ margin: '4px 0 0 0', color: '#475569', fontWeight: 600 }}>🎁 {invoiceFooterNote}</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ width: '120px', borderBottom: '1px solid #94a3b8', marginBottom: '4px' }} />
                  <span>Authorized Dispatch</span>
                </div>
              </div>
            </div>
          ) : (
            /* THERMAL 80MM / 58MM STICKER FORMAT */
            <div
              className="ecom-printable-area"
              style={{
                width: '320px',
                margin: '0 auto',
                padding: '8px',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                color: '#000000',
                lineHeight: '1.3',
              }}
            >
              <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '8px' }}>
                <strong style={{ fontSize: '1rem', display: 'block' }}>{company.name.toUpperCase()}</strong>
                <span style={{ fontSize: '0.72rem' }}>Online Store Dispatch</span>
                <div style={{ fontWeight: 800, marginTop: '4px' }}>
                  #{order.order_no || order.order_number || order.id}
                </div>
              </div>

              <div style={{ borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '6px' }}>
                <div><strong>RECIPIENT:</strong></div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{order.customer_name}</div>
                <div>📞 {order.customer_phone}</div>
                <div style={{ marginTop: '2px' }}>📍 {order.shipping_address}</div>
              </div>

              <div style={{ borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '6px' }}>
                <div><strong>COURIER:</strong> {order.courier_name || 'General'}</div>
                {order.tracking_code && <div><strong>TRACK:</strong> {order.tracking_code}</div>}
                <div><strong>PAYMENT:</strong> {(order.payment_method || 'COD').toUpperCase()}</div>
              </div>

              <div style={{ borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>ITEM</span>
                  <span>QTY</span>
                </div>
                {items.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginTop: '2px' }}>
                    <span style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {it.product_name || `Item #${it.product_id}`}
                    </span>
                    <strong>x{it.quantity}</strong>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.95rem' }}>
                TOTAL PAYABLE: {taka(grandTotal)}
              </div>

              <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.7rem' }}>
                *** Thank You for Shopping With Us ***
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
