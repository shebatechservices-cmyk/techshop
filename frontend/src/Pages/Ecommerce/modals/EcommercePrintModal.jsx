import React, { useState, useEffect } from 'react';
import { smartFetch } from '../../../services/api';
import EcommercePrintA4Slip from './print/EcommercePrintA4Slip';
import EcommercePrintThermalSlip from './print/EcommercePrintThermalSlip';

const money = (val) => Number.parseFloat(val || 0) || 0;
const taka = (val) => `৳${money(val).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function EcommercePrintModal({ isOpen, onClose, order }) {
  const [printFormat, setPrintFormat] = useState('a4'); // 'a4' | 'pos'
  const [shop, setShop] = useState({});

  useEffect(() => {
    if (isOpen) {
      smartFetch('/settings')
        .then((res) => res && res.json())
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
  const orderDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'N/A';

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
            <EcommercePrintA4Slip
              order={order}
              company={company}
              showLogo={showLogo}
              orderDate={orderDate}
              items={items}
              itemsSubtotal={itemsSubtotal}
              deliveryCharge={deliveryCharge}
              grandTotal={grandTotal}
              invoiceFooterNote={invoiceFooterNote}
              taka={taka}
              money={money}
            />
          ) : (
            <EcommercePrintThermalSlip
              order={order}
              company={company}
              items={items}
              grandTotal={grandTotal}
              taka={taka}
            />
          )}
        </div>
      </div>
    </div>
  );
}
