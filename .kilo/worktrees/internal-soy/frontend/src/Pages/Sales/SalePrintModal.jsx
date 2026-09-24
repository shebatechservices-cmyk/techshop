import React, { useEffect, useState } from 'react';
import API from '../../services/api';

const taka = (val) => `৳${(Number(val) || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Convert a number to English words for "Taka In Word" (e.g. 1250.50 →
// "One Thousand Two Hundred Fifty Taka & Fifty Poisha Only").
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const twoDigits = (n) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`);
const threeDigits = (n) => `${n >= 100 ? `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? ' ' : ''}` : ''}${n % 100 ? twoDigits(n % 100) : ''}`;
const numToWords = (num) => {
    const n = Math.floor(Math.abs(Number(num) || 0));
    if (n === 0) return 'Zero';
    const parts = [];
    const crore = Math.floor(n / 10000000);
    const lakh = Math.floor((n % 10000000) / 100000);
    const thousand = Math.floor((n % 100000) / 1000);
    const rest = n % 1000;
    if (crore) parts.push(`${threeDigits(crore)} Crore`);
    if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
    if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
    if (rest) parts.push(threeDigits(rest));
    return parts.join(' ').replace(/\s+/g, ' ').trim();
};
const takaInWords = (val) => {
    const amount = Number(val) || 0;
    const takaPart = Math.floor(amount);
    const poisha = Math.round((amount - takaPart) * 100);
    let out = `${numToWords(takaPart)} Taka`;
    if (poisha > 0) out += ` & ${numToWords(poisha)} Poisha`;
    return `${out} Only`;
};

const DEFAULT_COMPANY = {
  name: 'Sheba Technology',
  tagline: 'Complete IT Solutions, Hardware, Networking & Surveillance',
  address: 'Multiplan Center, Level 9, New Elephant Road, Dhaka-1205',
  phone: '+880 1711-000000, +880 1811-000000',
  email: 'billing@shebatechnology.com',
  web: 'www.shebatechnology.com',
};

export default function SalePrintModal({
  isOpen,
  onClose,
  sale,
  isQuotation = false,
  company: propCompany = DEFAULT_COMPANY,
}) {
  const [mode, setMode] = useState('invoice'); // 'invoice' | 'chalan'
  const [shop, setShop] = useState({});

  useEffect(() => {
    if (isOpen) {
      setMode('invoice');
      fetch(`${API}/settings`)
        .then((res) => res.json())
        .then((json) => {
          if (json && json.data) setShop(json.data);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen || !sale) return null;

  const isChalan = !isQuotation && mode === 'chalan';

  const company = {
    name: shop.shop_name || propCompany.name,
    tagline: shop.shop_title || propCompany.tagline,
    address: shop.address || propCompany.address,
    phone: [shop.phone, shop.alt_phone].filter(Boolean).join(', ') || propCompany.phone,
    email: shop.email || propCompany.email,
    web: shop.website || propCompany.web,
    logo: shop.logo_url || '',
  };

  const showLogo = shop.show_logo_on_invoice !== false;
  const showSignature = shop.show_signature_on_invoice !== false;
  const invoiceFooterNote = shop.invoice_footer_note || '';
  const invoiceTerms = (shop.invoice_terms || '').trim();
  const warrantyPolicy = (shop.warranty_policy || '').trim();
  const returnRefundPolicy = (shop.return_refund_policy || '').trim();
  const brandLogos = Array.isArray(shop.invoice_brand_logos) ? shop.invoice_brand_logos.filter((b) => b && b.url) : [];

  const docNumber = isQuotation
    ? (sale.quotation_no || `QTN-${sale.id || 'DRAFT'}`)
    : (sale.invoice_no || `INV-${sale.id || 'DRAFT'}`);

  const dateStr = sale.created_at
    ? new Date(sale.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const customerName = sale.customer_name || 'Valued Customer / Walk-in';
  const customerPhone = sale.customer_phone || '';
  const customerEmail = sale.customer_email || '';
  const customerAddress = sale.customer_address || '';

  // Sales Person (selected from staff dropdown or any logged-in user) + operator name
  const salesPersonName = sale.sales_person || '';
  const customerDestination = sale.destination || '';
  const customerAttention = sale.attention || '';
  const dateOnly = dateStr.split(',').slice(0, -1).join(',');

  let operatorName = '';
  try {
    const au = JSON.parse(localStorage.getItem('sheba_auth_user') || sessionStorage.getItem('sheba_auth_user') || 'null');
    operatorName = (au && (au.name || au.username)) || '';
  } catch (e) {}
  const preparedByName = sale.prepared_by ? String(sale.prepared_by) : (operatorName || salesPersonName);
  const entryTime = dateStr.includes(',') ? dateStr.split(',').pop().trim() : '';

  const items = Array.isArray(sale.items) ? sale.items : [];
  const subtotal = Number(sale.subtotal || items.reduce((s, it) => s + (Number(it.unit_price || 0) * Number(it.quantity || 1)), 0));
  const discount = Number(sale.discount || 0);
  const vat = Number(sale.vat || 0);
  const setupCharge = Number(sale.setup_charge || 0);
  const extraCost = Number(sale.extra_cost || 0);
  const extraCostCategory = sale.extra_cost_category || '';
  const extraCostNotes = sale.extra_cost_notes || '';
  const paymentTenders = Array.isArray(sale.payment_details) ? sale.payment_details : [];
  const totalAmount = Number(sale.total_amount || sale.grand_total || (subtotal - discount + vat + setupCharge + extraCost));
  const paidAmount = Number(sale.paid_amount || 0);
  const dueAmount = Number(sale.due_amount || Math.max(0, totalAmount - paidAmount));

  // Inward section values
  const totalQty = items.reduce((s, it) => s + (Number(it.quantity || 1)), 0);
  const previousDue = Number(sale.previous_due || sale.customer_previous_due || 0);
  const totalPayable = totalAmount + previousDue;
  const receivedAmount = Number(sale.received_amount || paidAmount);
  const currentDue = Math.max(0, totalPayable - receivedAmount);
  const returnRefund = Number(sale.return_refund_amount || 0);
  const narration = sale.notes || '';

  const handlePrint = () => {
    window.print();
  };

  const buildShareText = () => {
    let msg = `*${company.name.toUpperCase()} - ${isQuotation ? 'SALES QUOTATION' : 'SALES INVOICE RECEIPT'}*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `*${isQuotation ? 'Quotation' : 'Invoice'} No:* ${docNumber}\n`;
    msg += `*Date:* ${dateStr}\n`;
    msg += `*Customer:* ${customerName}${customerPhone ? ` (${customerPhone})` : ''}\n`;
    if (isQuotation && sale.valid_until) {
      msg += `*Valid Until:* ${new Date(sale.valid_until).toLocaleDateString('en-GB')}\n`;
    }
    msg += `-------------------------------------\n`;
    msg += `*ITEMS:*\n`;
    items.forEach((it, idx) => {
      const name = it.full_name || it.product_name || it.name || 'Product';
      const qty = it.quantity || 1;
      const price = Number(it.unit_price || 0);
      const total = Number(it.line_total || price * qty);
      msg += `${idx + 1}. *${name}*\n   Qty: ${qty} × ৳${price.toLocaleString()} = ৳${total.toLocaleString()}\n`;
      if (it.serials && it.serials.length > 0) {
        msg += `   S/N: ${it.serials.join(', ')}\n`;
      }
    });
    msg += `-------------------------------------\n`;
    msg += `*Subtotal:* ৳${subtotal.toLocaleString()}\n`;
    if (discount > 0) {
      msg += `*Discount:* -৳${discount.toLocaleString()}\n`;
    }
    if (vat > 0) {
      msg += `*VAT:* +৳${vat.toLocaleString()}\n`;
    }
    if (setupCharge > 0) {
      msg += `*Setup / Installation:* +৳${setupCharge.toLocaleString()}\n`;
    }
    if (extraCost > 0) {
      msg += `*${extraCostCategory || 'Logistics / Extra Cost'}:* +৳${extraCost.toLocaleString()}\n`;
    }
    msg += `*Grand Total:* ৳${totalAmount.toLocaleString()}\n`;
    if (!isQuotation) {
      msg += `*Paid:* ৳${paidAmount.toLocaleString()}\n`;
      msg += `*Due:* ৳${dueAmount.toLocaleString()}\n`;
      if (paymentTenders.length > 0) {
        msg += `*Payment Breakdown:*\n`;
        paymentTenders.forEach((t, idx) => {
          const tMethod = t.method || 'Cash';
          const tSub = t.sub_option ? ` (${t.sub_option})` : '';
          const tTx = t.transaction_id ? ` · Txn: ${t.transaction_id}` : '';
          const tRecv = t.receiver_name ? ` · ${t.receiver_name}` : '';
          msg += `   ${idx + 1}. ${tMethod}${tSub}: ৳${(Number(t.amount || 0)).toLocaleString()}${tTx}${tRecv}\n`;
        });
      }
    }
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `_This is a computer-generated invoice. No signature required._\n`;
    msg += `Thank you for choosing ${company.name}!`;
    return msg;
  };

  const handleWhatsAppShare = () => {
    const rawText = buildShareText();
    let cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('01')) {
      cleanPhone = '88' + cleanPhone;
    }
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(rawText)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(rawText)}`;
    window.open(url, '_blank');
  };

  const handleEmailShare = () => {
    const rawText = buildShareText();
    const subject = `${isQuotation ? 'Quotation' : 'Invoice'} ${docNumber} - ${company.name}`;
    const mailto = `mailto:${customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(rawText)}`;
    window.open(mailto, '_blank');
  };

  return (
    <div
      className="print-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflowY: 'auto',
        padding: '20px 10px',
      }}
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #sale-print-area, #sale-print-area * {
            visibility: visible !important;
          }
          #sale-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            box-shadow: none !important;
          }
          .print-modal-backdrop {
            position: static !important;
            background: none !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
        }
      `}</style>

      {/* Floating Action Header (Hidden in Print) */}
      <div
        className="no-print"
        style={{
          width: '100%',
          maxWidth: '850px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#1e293b',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '12px 12px 0 0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem' }}>{isQuotation ? '📋' : '🧾'}</span>
          <div>
            <strong style={{ fontSize: '1rem', display: 'block' }}>
              {isQuotation ? 'Sales Quotation Preview' : (isChalan ? 'Delivery Challan (চালান) Preview' : 'Sales Invoice Receipt')}
            </strong>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              {docNumber} · Standard A4 Layout
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {!isQuotation && (
            <>
              <button
                type="button"
                onClick={() => setMode('invoice')}
                style={{
                  background: mode === 'invoice' ? '#0284c7' : 'rgba(255,255,255,0.12)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '7px 12px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                🧾 Invoice
              </button>
              <button
                type="button"
                onClick={() => setMode('chalan')}
                style={{
                  background: mode === 'chalan' ? '#0284c7' : 'rgba(255,255,255,0.12)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '7px 12px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                🚚 Chalan
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handlePrint}
            style={{
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '7px 14px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            🖨️ Print / Save PDF
          </button>

          <button
            type="button"
            onClick={handleWhatsAppShare}
            style={{
              background: '#16a34a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '7px 12px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
            title="Share complete order details via WhatsApp"
          >
            💬 WhatsApp
          </button>

          <button
            type="button"
            onClick={handleEmailShare}
            style={{
              background: '#475569',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '7px 12px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
            title="Share invoice via Email"
          >
            ✉️ Email
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '7px 12px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginLeft: '6px',
            }}
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Printable Sheet (Standard A4) */}
      <div
        id="sale-print-area"
        style={{
          width: '100%',
          maxWidth: '850px',
          background: '#ffffff',
          padding: '36px 40px',
          boxSizing: 'border-box',
          borderRadius: '0 0 12px 12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          color: '#1e293b',
          lineHeight: '1.4',
        }}
      >
        {/* Company Header - Simple */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2.5px solid #0284c7',
            paddingBottom: '12px',
            marginBottom: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {showLogo && company.logo && (
              <img
                src={company.logo}
                alt={company.name}
                style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a', fontWeight: 800, letterSpacing: '-0.01em' }}>
                {company.name}
              </h1>
              {company.tagline && (
                <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: '#0284c7', fontWeight: 600 }}>
                  {company.tagline}
                </p>
              )}
              <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: '#64748b' }}>
                {company.address}
                {company.phone && ` • ${company.phone}`}
                {company.email && ` • ${company.email}`}
                {company.web && ` • ${company.web}`}
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                display: 'inline-block',
                background: isQuotation ? '#4f46e5' : (isChalan ? '#16a34a' : '#0284c7'),
                color: '#ffffff',
                padding: '5px 12px',
                borderRadius: '5px',
                fontWeight: 800,
                fontSize: '0.92rem',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginBottom: '5px',
              }}
            >
              {isQuotation ? 'Sales Quotation' : (isChalan ? 'Delivery Challan' : 'Sales Invoice')}
            </div>
            <div style={{ fontSize: '0.84rem', color: '#0f172a', fontWeight: 700 }}>
              {docNumber}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '1px' }}>
              Date: {dateStr}
            </div>
            {isQuotation && sale.valid_until && (
              <div style={{ fontSize: '0.74rem', color: '#d97706', fontWeight: 700, marginTop: '1px' }}>
                Valid Until: {new Date(sale.valid_until).toLocaleDateString('en-GB')}
              </div>
            )}
          </div>
        </div>

        {/* Customer & Invoice Details - two labeled blocks */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '14px',
          }}
        >
          {/* Customer Details block */}
          <div
            style={{
              flex: '1 1 340px',
              border: '1.5px solid #cbd5e1',
              borderRadius: '7px',
              padding: '8px 12px',
              fontSize: '0.8rem',
              background: '#ffffff',
            }}
          >
            <div
              style={{
                borderBottom: '2px solid #0284c7',
                paddingBottom: '3px',
                marginBottom: '6px',
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#0284c7',
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
              }}
            >
              Customer Details
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '3px 12px', fontSize: '0.8rem' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Customer:</span><span style={{ color: '#0f172a', fontWeight: 700 }}>{customerName}</span>
              {customerPhone && <span style={{ color: '#64748b', fontWeight: 600 }}>Mobile:</span>}
              {customerPhone && <span style={{ color: '#0f172a' }}>{customerPhone}</span>}
              {customerAddress && <span style={{ color: '#64748b', fontWeight: 600 }}>Address:</span>}
              {customerAddress && <span style={{ color: '#0f172a' }}>{customerAddress}</span>}
              {customerEmail && <span style={{ color: '#64748b', fontWeight: 600 }}>E-mail:</span>}
              {customerEmail && <span style={{ color: '#0f172a' }}>{customerEmail}</span>}
              <span style={{ color: '#64748b', fontWeight: 600 }}>Attention:</span>
              <span style={{ color: '#0f172a' }}>{customerAttention || '—'}</span>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Destination:</span>
              <span style={{ color: '#0f172a' }}>{customerDestination || '—'}</span>
            </div>
          </div>

          {/* Invoice Details block */}
          <div
            style={{
              flex: '1 1 340px',
              border: '1.5px solid #cbd5e1',
              borderRadius: '7px',
              padding: '8px 12px',
              fontSize: '0.8rem',
              background: '#ffffff',
            }}
          >
            <div
              style={{
                borderBottom: '2px solid #0284c7',
                paddingBottom: '3px',
                marginBottom: '6px',
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#0284c7',
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
              }}
            >
              Invoice Details
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '3px 12px', fontSize: '0.8rem' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Invoice No.:</span><span style={{ color: '#0f172a', fontWeight: 700 }}>{docNumber}</span>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Date:</span><span style={{ color: '#0f172a' }}>{dateOnly}</span>
              {entryTime && <span style={{ color: '#64748b', fontWeight: 600 }}>Entry Time:</span>}
              {entryTime && <span style={{ color: '#0f172a' }}>{entryTime}</span>}
              {preparedByName && <span style={{ color: '#64748b', fontWeight: 600 }}>Prepared By:</span>}
              {preparedByName && <span style={{ color: '#0f172a' }}>{preparedByName}</span>}
              {salesPersonName && <span style={{ color: '#64748b', fontWeight: 600 }}>Sales Person:</span>}
              {salesPersonName && <span style={{ color: '#0f172a' }}>{salesPersonName}</span>}
              <span style={{ color: '#64748b', fontWeight: 600 }}>Bill Status:</span>
              <span
                style={{
                  fontWeight: 700,
                  color: dueAmount === 0 ? '#15803d' : (paidAmount > 0 ? '#b45309' : '#b91c1c'),
                }}
              >
                {dueAmount === 0 ? '✓ Paid Full' : (paidAmount > 0 ? 'Partial Paid' : 'Due / Unpaid')}
              </span>
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '22px',
            fontSize: '0.84rem',
          }}
        >
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
              <th style={{ padding: '5px 7px', textAlign: 'center', width: '30px', color: '#475569', fontSize: '0.78rem' }}>#</th>
              <th style={{ padding: '5px 7px', textAlign: 'left', color: '#475569', fontSize: '0.78rem' }}>Product Description & Serials</th>
              <th style={{ padding: '5px 7px', textAlign: 'center', width: '70px', color: '#475569', fontSize: '0.78rem' }}>Warranty</th>
              <th style={{ padding: '5px 7px', textAlign: 'center', width: '45px', color: '#475569', fontSize: '0.78rem' }}>Quantity</th>
              <th style={{ padding: '5px 7px', textAlign: 'center', width: '50px', color: '#475569', fontSize: '0.78rem' }}>UoM</th>
              {!isChalan && (
                <>
                  <th style={{ padding: '5px 7px', textAlign: 'right', width: '95px', color: '#475569', fontSize: '0.78rem' }}>Unit Price</th>
                  <th style={{ padding: '5px 7px', textAlign: 'right', width: '100px', color: '#475569', fontSize: '0.78rem' }}>Line Total</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => {
              const qty = Number(it.quantity || 1);
              const price = Number(it.unit_price || 0);
              const lineTotal = Number(it.line_total || price * qty);
              const serials = Array.isArray(it.serials) ? it.serials : [];
              const warranty = it.warranty_months ? `${it.warranty_months} Mos` : '—';

              return (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '4px 7px', textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>{idx + 1}</td>
                  <td style={{ padding: '4px 7px' }}>
                    <div style={{ color: '#0f172a', fontSize: '0.8rem', fontWeight: 700, lineHeight: 1.3 }}>
                      {it.full_name || it.product_name || it.name || 'Product'}
                    </div>
                    {serials.length > 0 && (
                      <div style={{ marginTop: '2px', fontSize: '0.68rem', color: '#0369a1', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        <strong>S/N:</strong> {serials.join(', ')}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '4px 7px', textAlign: 'center', color: '#475569', fontSize: '0.78rem' }}>{warranty}</td>
                  <td style={{ padding: '4px 7px', textAlign: 'center', fontWeight: 600, fontSize: '0.78rem' }}>{qty}</td>
                  <td style={{ padding: '4px 7px', textAlign: 'center', color: '#475569', fontSize: '0.78rem' }}>{it.uom || it.unit || 'Pcs'}</td>
                  {!isChalan && (
                    <>
                      <td style={{ padding: '4px 7px', textAlign: 'right', color: '#475569', fontSize: '0.78rem' }}>{taka(price)}</td>
                      <td style={{ padding: '4px 7px', textAlign: 'right', fontWeight: 700, color: '#0f172a', fontSize: '0.78rem' }}>{taka(lineTotal)}</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Inward Section — left: qty/words/narration, right: payment ladder */}
        {!isChalan && (
          <div
            style={{
              display: 'flex',
              gap: '14px',
              alignItems: 'stretch',
              marginBottom: '14px',
              fontSize: '0.8rem',
            }}
          >
            {/* Left column */}
            <div style={{ flex: '1 1 55%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: '#64748b', fontWeight: 700, minWidth: '90px' }}>Total Qty:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{totalQty}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: '#64748b', fontWeight: 700, minWidth: '90px' }}>Taka In Word:</span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>{takaInWords(totalPayable)}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: '#64748b', fontWeight: 700, minWidth: '90px' }}>Narration:</span>
                <span style={{ color: '#0f172a', whiteSpace: 'pre-line' }}>{narration || '—'}</span>
              </div>
              {returnRefund > 0 && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#64748b', fontWeight: 700, minWidth: '90px' }}>Return & Refund:</span>
                  <span style={{ color: '#dc2626', fontWeight: 700 }}>{taka(returnRefund)}</span>
                </div>
              )}
              {setupCharge > 0 && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#64748b', fontWeight: 700, minWidth: '90px' }}>Setup / Install:</span>
                  <span style={{ color: '#15803d', fontWeight: 700 }}>+{taka(setupCharge)}</span>
                </div>
              )}
              {extraCost > 0 && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#64748b', fontWeight: 700, minWidth: '90px' }}>{extraCostCategory || 'Extra Cost'}:</span>
                  <span style={{ color: '#c2410c', fontWeight: 700 }}>+{taka(extraCost)}</span>
                </div>
              )}
            </div>

            {/* Right column — payment ladder */}
            <div
              style={{
                flex: '0 0 300px',
                border: '1.5px solid #cbd5e1',
                borderRadius: '7px',
                padding: '6px 12px',
                alignSelf: 'flex-start',
              }}
            >
              {[
                ['Total Amount:', taka(subtotal), '#0f172a'],
                ['Less Discount:', `-${taka(discount)}`, '#dc2626'],
                ...(vat > 0 ? [['VAT / Tax:', `+${taka(vat)}`, '#0f172a']] : []),
              ].map(([label, value, color]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <span>{label}</span>
                  <strong style={{ color }}>{value}</strong>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #e2e8f0', fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                <span>Net Payable Amount:</span>
                <span style={{ color: '#0284c7' }}>{taka(totalAmount)}</span>
              </div>
              {!isQuotation && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <span>Previous Due:</span>
                    <strong style={{ color: '#0f172a' }}>{taka(previousDue)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a' }}>
                    <span>Total Payable Amount:</span>
                    <span>{taka(totalPayable)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #e2e8f0', color: '#15803d' }}>
                    <span>Received Amount:</span>
                    <strong>{taka(receivedAmount)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: currentDue > 0 ? '#b91c1c' : '#15803d', fontWeight: 800 }}>
                    <span>Current Due:</span>
                    <span>{taka(currentDue)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Payment breakdown & extras - one compact line */}
        {!isChalan && (paymentTenders.length > 0 || extraCostNotes) && (
          <div style={{ marginTop: '10px', fontSize: '0.78rem', color: '#475569', borderTop: '1px dashed #e2e8f0', paddingTop: '8px' }}>
            {paymentTenders.length > 0 && (
              <div style={{ marginBottom: extraCostNotes ? '3px' : 0 }}>
                <strong>Payment:</strong>{' '}
                {paymentTenders.map((t, idx) =>
                  `${idx + 1}. ${t.method || 'Cash'}${t.sub_option ? ` (${t.sub_option})` : ''}${t.transaction_id ? ` · Txn:${t.transaction_id}` : ''} = ${taka(t.amount || 0)}`
                ).join(' , ')}
              </div>
            )}
            {extraCostNotes && (
              <div style={{ color: '#c2410c' }}>
                <strong>Logistics / Extra Cost Note:</strong> {extraCostNotes}
              </div>
            )}
          </div>
        )}

        {/* Brand logos - compact single strip */}
        {brandLogos.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'center', marginTop: '12px', padding: '6px 0', borderTop: '1px solid #f1f5f9' }}>
            {brandLogos.map((brand, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', minWidth: '48px' }}>
                <img
                  src={brand.url}
                  alt={brand.name || 'Brand'}
                  style={{ height: '26px', maxWidth: '70px', objectFit: 'contain' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                {brand.name && <span style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 600 }}>{brand.name}</span>}
              </div>
            ))}
          </div>
        )}

        {invoiceFooterNote && (
          <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
            🎁 {invoiceFooterNote}
          </div>
        )}

        {/* Warranty void footnote */}
        <div
          style={{
            marginTop: '10px',
            fontSize: '0.72rem',
            color: '#475569',
            fontWeight: 600,
            borderTop: '1px dashed #e2e8f0',
            paddingTop: '8px',
            lineHeight: 1.5,
          }}
        >
          <strong>Warranty Void —</strong> The Warranty Is Not Applicable To Adaptor, Remote Control, Sticker-removed Items, Burnt & Physically Damaged Item.
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginTop: '32px',
            paddingTop: '12px',
            borderTop: '1px solid #e2e8f0',
          }}
        >
          <div style={{ textAlign: 'center', width: '180px' }}>
            <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '5px', fontSize: '0.74rem', color: '#475569', fontWeight: 600 }}>
              {isChalan ? "Delivered By (Operator)" : "Customer's Signature"}
            </div>
          </div>

          <div style={{ textAlign: 'center', flex: 1, padding: '0 16px', fontSize: '0.74rem', color: '#64748b' }}>
            <div style={{ fontWeight: 700, letterSpacing: '0.02em', color: '#475569' }}>
              {isChalan ? 'Computer-generated delivery challan.' : 'Computer-generated invoice.'}
            </div>
            {(warrantyPolicy || returnRefundPolicy || invoiceTerms) && (
              <div style={{ marginTop: '5px', lineHeight: 1.5, maxWidth: '430px', marginLeft: 'auto', marginRight: 'auto', whiteSpace: 'pre-line' }}>
                {warrantyPolicy || returnRefundPolicy || invoiceTerms}
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center', width: '180px' }}>
            <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '5px', fontSize: '0.74rem', color: '#475569', fontWeight: 600 }}>
              {isChalan ? 'Received By (Customer)' : 'Prepared By (Operator)'}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8', marginTop: '8px' }}>
          Thank you for choosing {company.name}!
        </div>
        {!showSignature && <div style={{ height: '8px' }} />}
      </div>
    </div>
  );
}
