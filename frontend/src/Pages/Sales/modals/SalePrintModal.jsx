import React, { useEffect, useState } from 'react';
import API from '../../../services/api';
import { fullCatalogName } from '../../../utils/productUtils';
import { shareInvoiceDocument } from '../../../utils/invoiceShareHelper';
import InvoiceShareModal from '../templates/InvoiceShareModal';
import { taka, formatDecimal, takaInWords, formatPrintDateTime } from '../templates/printModalHelpers';

export default function SalePrintModal({
  isOpen,
  onClose,
  sale: propSale,
  invoice: propInvoice,
  customer: propCustomer,
  storeSettings: propSettings,
  company: propCompany,
  isQuotation = false,
}) {
  const [mode, setMode] = useState('invoice'); // 'invoice' | 'chalan'
  const [fetchedSettings, setFetchedSettings] = useState({});
  const [printTime, setPrintTime] = useState(() => new Date());

  useEffect(() => {
    if (isOpen) {
      setPrintTime(new Date());
      setMode('invoice');
      const token = localStorage.getItem('sheba_auth_token') || sessionStorage.getItem('sheba_auth_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      fetch(`${API}/settings`, { headers })
        .then((res) => res.json())
        .then((json) => {
          if (json && json.data) setFetchedSettings(json.data);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Unify invoice / sale payload
  const invoice = propInvoice || propSale;
  if (!invoice) return null;

  const isChalan = !isQuotation && mode === 'chalan';

  // 1. Dynamic Store Settings (Merged from propSettings, fetchedSettings, and propCompany)
  const store = { ...fetchedSettings, ...propCompany, ...propSettings };
  const storeName = store.business_name || store.shop_name || store.name || 'SHEBA TECHNOLOGY BD';
  const storeSubtitle = store.sub_title || store.shop_title || store.sister_concern_name || store.tagline || '';
  const storeAddress = store.address || '';
  const storePhones = store.phone_numbers || [store.phone, store.alt_phone, store.hotline].filter(Boolean).join(', ') || '';
  const storeEmail = store.email || '';
  const storeWebsite = store.website || store.web || '';
  const storeLogo = store.logo_url || store.logo || '';
  const storeSecondaryLogo = store.secondary_logo_url || store.partner_logo_url || '';
  const storeWatermarkLogo = store.watermark_logo_url || store.watermark_url || storeLogo;
  const returnPolicyText = store.return_policy_text || store.return_refund_policy || store.invoice_terms || '';
  const warrantyDisclaimerText = store.warranty_disclaimer_text || store.warranty_policy || 'Warranty Void — The Warranty Is Not Applicable To Adaptor, Remote, Burnt Items.';
  const invoiceFooterNote = store.invoice_footer_note || '';
  const showLogo = store.show_logo_on_invoice !== false;
  const showSignature = store.show_signature_on_invoice !== false;

  // Advanced Print Layout Settings from Store
  const paperSize = store.paper_size || (store.default_invoice_format === 'thermal_80mm' ? 'thermal_80mm' : (store.default_invoice_format === 'a5_invoice' ? 'a5' : 'a4'));
  const pageMargin = store.page_margin || 'default';
  const showFooterDetails = store.show_footer_details !== false;

  const pageSizeRule = paperSize === 'a5' ? 'A5 portrait' : (paperSize === 'thermal_80mm' ? '80mm auto' : 'A4 portrait');
  const pageMarginRule = pageMargin === '0.5in' ? '0.5in' : (pageMargin === '1in' ? '1.0in' : '8mm');

  // Dynamic Partner Logos Array from Store Settings
  const partnerLogos = Array.isArray(store.footer_partner_logos)
    ? store.footer_partner_logos
    : (Array.isArray(store.invoice_brand_logos) ? store.invoice_brand_logos : []);

  // 2. Dynamic Customer Info
  const cust = propCustomer || invoice.customer || {};
  const customerName = cust.name || invoice.customer_name || invoice.client_name || 'Walk-in Customer';
  const customerPhone = cust.phone || cust.mobile || invoice.customer_phone || invoice.client_phone || '';
  const customerAddress = cust.address || invoice.customer_address || invoice.client_address || '';
  const customerEmail = cust.email || invoice.customer_email || invoice.client_email || '';
  const customerAttention = invoice.attention || cust.attention || '';
  const customerDestination = invoice.destination || cust.destination || '';

  // 3. Dynamic Invoice Metadata
  const docNumber = isQuotation
    ? (invoice.quotation_no || invoice.quotation_number || `QTN-${invoice.id || 'DRAFT'}`)
    : (invoice.invoice_no || invoice.invoice_number || `INV-${invoice.id || 'DRAFT'}`);

  const rawDate = invoice.created_at || invoice.date || new Date();
  const dateObj = new Date(rawDate);
  const isValidDate = !isNaN(dateObj.getTime());
  const dateFormatted = isValidDate
    ? dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : (invoice.date || '');
  const timeFormatted = isValidDate
    ? dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    : (invoice.time || '');

  let operatorName = '';
  try {
    const au = JSON.parse(localStorage.getItem('sheba_auth_user') || sessionStorage.getItem('sheba_auth_user') || 'null');
    operatorName = (au && (au.name || au.username)) || '';
  } catch (e) {}

  const preparedBy = invoice.prepared_by || invoice.created_by_name || operatorName || '';
  const salesPerson = invoice.sales_person || invoice.salesperson_name || invoice.sales_person_name || '';

  // 4. Dynamic Items & Financial Calculations
  const rawItems = Array.isArray(invoice.items)
    ? invoice.items
    : (Array.isArray(invoice.invoice_items) ? invoice.invoice_items : (Array.isArray(invoice.products) ? invoice.products : []));

  const items = rawItems.map((it) => {
    const name = fullCatalogName(it) || it.full_name || it.product_name || it.item_name || it.name || 'Item';
    const serials = Array.isArray(it.serials)
      ? it.serials
      : (Array.isArray(it.serial_numbers) ? it.serial_numbers : (typeof it.serials === 'string' && it.serials ? it.serials.split(',').map(s => s.trim()) : []));
    const qty = Number(it.quantity ?? it.qty ?? 1);
    const unitPrice = Number(it.unit_price ?? it.price ?? it.rate ?? 0);
    const amount = Number(it.line_total ?? it.amount ?? it.total ?? (qty * unitPrice));
    const uom = it.uom || it.unit || it.unit_of_measure || 'PCS';
    
    let warranty = it.warranty || it.warranty_text || '';
    if (!warranty && it.warranty_months) {
      const mo = Number(it.warranty_months);
      warranty = mo >= 12 && mo % 12 === 0 ? `${mo / 12} YEARS` : `${mo} MONTHS`;
    }

    return { name, serials, qty, unitPrice, amount, uom, warranty };
  });

  const subtotal = Number(invoice.subtotal ?? invoice.gross_amount ?? items.reduce((sum, it) => sum + it.amount, 0));
  const discount = Number(invoice.discount ?? invoice.discount_amount ?? 0);
  const vat = Number(invoice.vat ?? invoice.tax ?? invoice.tax_amount ?? 0);
  const setupCharge = Number(invoice.setup_charge ?? 0);
  const extraCost = Number(invoice.extra_cost ?? invoice.delivery_charge ?? invoice.shipping_cost ?? 0);
  const extraCostCategory = invoice.extra_cost_category || invoice.extra_cost_label || '';
  const extraCostNotes = invoice.extra_cost_notes || '';
  const totalQuantity = Number(invoice.total_quantity ?? invoice.total_qty ?? items.reduce((sum, it) => sum + it.qty, 0));

  const netPayable = Number(invoice.total_amount ?? invoice.net_payable ?? invoice.grand_total ?? (subtotal - discount + vat + setupCharge + extraCost));
  const previousDue = Number(invoice.previous_due ?? invoice.customer_previous_due ?? cust.previous_due ?? 0);
  const totalDueAmount = netPayable + previousDue;
  const paidAmount = Number(invoice.paid_amount ?? invoice.received_amount ?? 0);
  const dueAmount = Number(invoice.due_amount ?? invoice.balance_due ?? Math.max(0, totalDueAmount - paidAmount));

  const isFullyPaid = dueAmount <= 0;
  const isPartialPaid = paidAmount > 0 && dueAmount > 0;
  const paymentStatus = invoice.payment_status || invoice.bill_status || (isFullyPaid ? 'PAID' : (isPartialPaid ? 'PARTIAL PAID' : 'DUE'));

  const narration = invoice.narration || invoice.notes || invoice.remarks || '';
  const paymentTenders = Array.isArray(invoice.payment_details) ? invoice.payment_details : (Array.isArray(invoice.tenders) ? invoice.tenders : []);

  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('pdf'); // 'pdf' | 'jpg'
  const [shareLoading, setShareLoading] = useState(false);
  const [shareStep, setShareStep] = useState('');
  const [activeAction, setActiveAction] = useState(null);

  const handlePrint = () => {
    window.print();
  };

  const handleExecuteShare = async (target) => {
    const elem = document.getElementById('sale-print-area');
    if (!elem) return;
    setActiveAction(target);
    setShareLoading(true);
    try {
      await shareInvoiceDocument({
        element: elem,
        target, // 'whatsapp' | 'email' | 'web_share' | 'download'
        format: selectedFormat,
        docType: isQuotation ? 'Quotation' : (isChalan ? 'Challan' : 'Invoice'),
        docNumber,
        customerName,
        customerPhone,
        customerEmail,
        storeName,
        storePhone: storePhones,
        netPayable,
        paidAmount,
        dueAmount,
        onStatusChange: (status) => setShareStep(status),
      });
      if (target === 'download') {
        setShowShareModal(false);
      }
    } catch (err) {
      console.error('Share/Export error:', err);
      alert('Could not complete share/export: ' + (err.message || err));
    } finally {
      setShareLoading(false);
      setActiveAction(null);
      setShareStep('');
    }
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
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: ${paperSize === 'thermal_80mm' ? 'auto' : '100%'} !important;
            max-height: ${paperSize === 'thermal_80mm' ? 'none' : '100%'} !important;
            overflow: hidden !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          .print-modal-backdrop {
            position: static !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            overflow: visible !important;
          }
          #sale-print-area, #sale-print-area * {
            visibility: visible !important;
          }
          #sale-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
            height: ${paperSize === 'thermal_80mm' ? 'auto' : '100vh'} !important;
            max-height: ${paperSize === 'thermal_80mm' ? 'none' : (paperSize === 'a5' ? '210mm' : '297mm')} !important;
            min-height: ${paperSize === 'thermal_80mm' ? 'auto' : (paperSize === 'a5' ? '210mm' : '297mm')} !important;
            margin: 0 !important;
            padding: ${pageMargin === '1in' ? '20mm 24mm' : (pageMargin === '0.5in' ? '12mm 14mm' : '8mm 10mm')} !important;
            box-sizing: border-box !important;
            background: #ffffff !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            font-size: ${paperSize === 'thermal_80mm' ? '9.5px' : (paperSize === 'a5' ? '10px' : '11px')} !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
          }
          .print-watermark {
            display: flex !important;
            opacity: 0.05 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          @page {
            size: ${pageSizeRule};
            margin: 0;
          }
        }
      `}</style>

      {/* Floating Action Header (Hidden in Print) */}
      <div
        className="no-print"
        style={{
          width: '100%',
          maxWidth: paperSize === 'thermal_80mm' ? '380px' : (paperSize === 'a5' ? '600px' : '850px'),
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#1e293b',
          color: '#ffffff',
          padding: '10px 16px',
          borderRadius: '10px 10px 0 0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.1rem' }}>{isQuotation ? '📋' : '🧾'}</span>
          <div>
            <strong style={{ fontSize: '0.92rem', display: 'block' }}>
              {isQuotation ? 'Sales Quotation Preview' : (isChalan ? 'Delivery Challan Preview' : 'Sales Invoice Receipt')}
            </strong>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
              {docNumber} · {paperSize.toUpperCase()} · Margin: {pageMargin}
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
                  padding: '6px 12px',
                  fontSize: '0.8rem',
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
                  padding: '6px 12px',
                  fontSize: '0.8rem',
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
            disabled={shareLoading}
            style={{
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: shareLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(2,132,199,0.3)',
            }}
          >
            🖨️ Print
          </button>

          {/* Consolidated Share / Export Button */}
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            disabled={shareLoading}
            style={{
              background: '#16a34a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: shareLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(22,163,74,0.3)',
            }}
            title="Share or Export Invoice as PDF or JPG"
          >
            📤 Share / Export
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={shareLoading}
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginLeft: '4px',
            }}
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Share / Export Format Selection Modal */}
      <InvoiceShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareLoading={shareLoading}
        selectedFormat={selectedFormat}
        setSelectedFormat={setSelectedFormat}
        handleExecuteShare={handleExecuteShare}
        docNumber={docNumber}
        customerName={customerName}
        customerPhone={customerPhone}
        customerEmail={customerEmail}
        shareStep={shareStep}
      />

      {/* Printable Sheet (Structured Grid-Border Accounting Layout) */}
      <div
        id="sale-print-area"
        style={{
          width: '100%',
          maxWidth: paperSize === 'thermal_80mm' ? '380px' : (paperSize === 'a5' ? '600px' : '820px'),
          minHeight: paperSize === 'thermal_80mm' ? 'auto' : (paperSize === 'a5' ? '195mm' : '275mm'),
          background: '#ffffff',
          padding: pageMargin === '1in' ? '24px 28px' : (pageMargin === '0.5in' ? '16px 20px' : '14px 18px'),
          boxSizing: 'border-box',
          borderRadius: '0 0 10px 10px',
          boxShadow: '0 12px 25px -5px rgba(0, 0, 0, 0.25)',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          color: '#0f172a',
          lineHeight: '1.25',
          fontSize: paperSize === 'thermal_80mm' ? '9.5px' : (paperSize === 'a5' ? '10px' : '11px'),
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Dynamic Centered Background Watermark */}
        {storeWatermarkLogo && (
          <div
            className="print-watermark"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              zIndex: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.05,
              userSelect: 'none',
            }}
          >
            <img
              src={storeWatermarkLogo}
              alt="Watermark"
              style={{
                width: '320px',
                height: '320px',
                objectFit: 'contain',
                filter: 'grayscale(100%)',
              }}
            />
          </div>
        )}

        {/* Top & Middle Section (Expands gracefully) */}
        <div style={{ position: 'relative', zIndex: 1, flex: '1 0 auto' }}>
          {/* 1. Dynamic Store Header (From Settings/Database) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '2px solid #0f172a',
              paddingBottom: '6px',
              marginBottom: '4px',
            }}
          >
            {/* Dynamic Top-Left: Primary Store Logo */}
            <div style={{ display: 'flex', alignItems: 'center', minWidth: '70px' }}>
              {showLogo && storeLogo && (
                <img
                  src={storeLogo}
                  alt={storeName || 'Store Logo'}
                  style={{ maxHeight: '50px', maxWidth: '90px', objectFit: 'contain' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
            </div>

            {/* Dynamic Center: Title, Subtitle, Physical Address, Phones, Email & Web */}
            <div style={{ textAlign: 'center', flex: 1, padding: '0 8px' }}>
              {storeName && (
                <h1 style={{ margin: 0, fontSize: '1.42rem', color: '#0f172a', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  {storeName}
                </h1>
              )}
              {storeSubtitle && (
                <p style={{ margin: '1px 0 0 0', fontSize: '0.72rem', color: '#0284c7', fontWeight: 700, letterSpacing: '0.01em' }}>
                  {storeSubtitle}
                </p>
              )}
              {storeAddress && (
                <p style={{ margin: '1.5px 0 0 0', fontSize: '0.66rem', color: '#334155', lineHeight: 1.25 }}>
                  {storeAddress}
                </p>
              )}
              {storePhones && (
                <p style={{ margin: '1px 0 0 0', fontSize: '0.66rem', color: '#475569' }}>
                  📞 <strong>Phone:</strong> {storePhones}
                </p>
              )}
              {(storeEmail || storeWebsite) && (
                <p style={{ margin: '1px 0 0 0', fontSize: '0.66rem', color: '#64748b' }}>
                  {storeEmail && `✉️ ${storeEmail}`}
                  {storeEmail && storeWebsite && ' | '}
                  {storeWebsite && `🌐 ${storeWebsite}`}
                </p>
              )}
            </div>

            {/* Dynamic Top-Right: Secondary / Partner Logo (Optional/Conditional) */}
            <div style={{ textAlign: 'right', minWidth: '70px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
              {storeSecondaryLogo && (
                <img
                  src={storeSecondaryLogo}
                  alt="Partner / Secondary Logo"
                  style={{ maxHeight: '46px', maxWidth: '95px', objectFit: 'contain' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
            </div>
          </div>

          {/* Center Document Tag */}
          <div style={{ textAlign: 'center', margin: '4px 0 6px 0' }}>
            <span
              style={{
                display: 'inline-block',
                border: '1.5px solid #0f172a',
                background: isQuotation ? '#4f46e5' : (isChalan ? '#16a34a' : '#f8fafc'),
                color: isQuotation || isChalan ? '#ffffff' : '#0f172a',
                padding: '2px 20px',
                borderRadius: '4px',
                fontWeight: 800,
                fontSize: '0.82rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {isQuotation ? 'Sales Quotation' : (isChalan ? 'Delivery Challan' : 'Sales Invoice')}
            </span>
          </div>

          {/* 2. Dynamic Customer & Metadata Grid (Reference Wireframe) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              border: '1px solid #475569',
              borderRadius: '3px',
              marginBottom: '6px',
              background: '#ffffff',
            }}
          >
            {/* Left Box: Dynamic Customer Info (Hides empty fields cleanly) */}
            <div
              style={{
                padding: '4px 8px',
                borderRight: '1px solid #475569',
                fontSize: '0.72rem',
              }}
            >
              <div
                style={{
                  borderBottom: '1px solid #cbd5e1',
                  paddingBottom: '2px',
                  marginBottom: '3px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: '#0284c7',
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                }}
              >
                Customer Details
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '1.5px 4px', fontSize: '0.72rem', lineHeight: 1.25 }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>Customer:</span>
                <span style={{ color: '#0f172a', fontWeight: 700 }}>{customerName}</span>

                {customerAddress && (
                  <>
                    <span style={{ color: '#475569', fontWeight: 600 }}>Address:</span>
                    <span style={{ color: '#0f172a' }}>{customerAddress}</span>
                  </>
                )}

                {customerPhone && (
                  <>
                    <span style={{ color: '#475569', fontWeight: 600 }}>Mobile:</span>
                    <span style={{ color: '#0f172a', fontWeight: 600 }}>{customerPhone}</span>
                  </>
                )}

                {customerEmail && (
                  <>
                    <span style={{ color: '#475569', fontWeight: 600 }}>Email:</span>
                    <span style={{ color: '#0f172a' }}>{customerEmail}</span>
                  </>
                )}

                {customerAttention && customerAttention.trim() !== '' && (
                  <>
                    <span style={{ color: '#475569', fontWeight: 600 }}>Attention:</span>
                    <span style={{ color: '#0f172a' }}>{customerAttention}</span>
                  </>
                )}

                {customerDestination && customerDestination.trim() !== '' && (
                  <>
                    <span style={{ color: '#475569', fontWeight: 600 }}>Destination:</span>
                    <span style={{ color: '#0f172a' }}>{customerDestination}</span>
                  </>
                )}
              </div>
            </div>

            {/* Right Nested Table: Dynamic Invoice Meta */}
            <div
              style={{
                padding: '4px 8px',
                fontSize: '0.72rem',
              }}
            >
              <div
                style={{
                  borderBottom: '1px solid #cbd5e1',
                  paddingBottom: '2px',
                  marginBottom: '3px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: '#0284c7',
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                }}
              >
                Invoice Metadata
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '75px 1fr', gap: '1.5px 4px', fontSize: '0.72rem', lineHeight: 1.25 }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>Invoice No:</span>
                <span style={{ color: '#0f172a', fontWeight: 800 }}>{docNumber}</span>

                <span style={{ color: '#475569', fontWeight: 600 }}>Date:</span>
                <span style={{ color: '#0f172a' }}>{dateFormatted}</span>

                {timeFormatted && (
                  <>
                    <span style={{ color: '#475569', fontWeight: 600 }}>Entry Time:</span>
                    <span style={{ color: '#0f172a' }}>{timeFormatted}</span>
                  </>
                )}

                {preparedBy && (
                  <>
                    <span style={{ color: '#475569', fontWeight: 600 }}>Prepared By:</span>
                    <span style={{ color: '#0f172a' }}>{preparedBy}</span>
                  </>
                )}

                {salesPerson && salesPerson !== preparedBy && (
                  <>
                    <span style={{ color: '#475569', fontWeight: 600 }}>Sales Person:</span>
                    <span style={{ color: '#0f172a' }}>{salesPerson}</span>
                  </>
                )}

                <span style={{ color: '#475569', fontWeight: 600 }}>Bill Status:</span>
                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '1px 6px',
                      borderRadius: '3px',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      letterSpacing: '0.02em',
                      background: isFullyPaid ? '#dcfce7' : (isPartialPaid ? '#fef3c7' : '#fee2e2'),
                      color: isFullyPaid ? '#15803d' : (isPartialPaid ? '#b45309' : '#b91c1c'),
                      border: `1px solid ${isFullyPaid ? '#86efac' : (isPartialPaid ? '#fde68a' : '#fca5a5')}`,
                      textTransform: 'uppercase',
                    }}
                  >
                    {paymentStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Dynamic Itemized Accounting Table (Strict Bordered Grid) */}
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '1px solid #475569',
              marginBottom: '6px',
              fontSize: '0.72rem',
            }}
          >
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #475569' }}>
                <th style={{ border: '1px solid #475569', padding: '3px 4px', textAlign: 'center', width: '28px', color: '#0f172a', fontSize: '0.68rem', fontWeight: 800 }}>SL</th>
                <th style={{ border: '1px solid #475569', padding: '3px 6px', textAlign: 'left', color: '#0f172a', fontSize: '0.68rem', fontWeight: 800 }}>Product Description & Serials</th>
                <th style={{ border: '1px solid #475569', padding: '3px 4px', textAlign: 'center', width: '65px', color: '#0f172a', fontSize: '0.68rem', fontWeight: 800 }}>Warranty</th>
                <th style={{ border: '1px solid #475569', padding: '3px 4px', textAlign: 'right', width: '40px', color: '#0f172a', fontSize: '0.68rem', fontWeight: 800 }}>Qty</th>
                <th style={{ border: '1px solid #475569', padding: '3px 4px', textAlign: 'center', width: '36px', color: '#0f172a', fontSize: '0.68rem', fontWeight: 800 }}>UoM</th>
                {!isChalan && (
                  <>
                    <th style={{ border: '1px solid #475569', padding: '3px 6px', textAlign: 'right', width: '75px', color: '#0f172a', fontSize: '0.68rem', fontWeight: 800 }}>Unit Price</th>
                    <th style={{ border: '1px solid #475569', padding: '3px 6px', textAlign: 'right', width: '85px', color: '#0f172a', fontSize: '0.68rem', fontWeight: 800 }}>Amount</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #64748b', pageBreakInside: 'avoid' }}>
                  <td style={{ border: '1px solid #64748b', padding: '2px 4px', textAlign: 'center', color: '#475569', fontSize: '0.7rem' }}>{idx + 1}</td>
                  <td style={{ border: '1px solid #64748b', padding: '2px 6px' }}>
                    <div style={{ color: '#0f172a', fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.25 }}>
                      {it.name}
                    </div>
                    {it.serials && it.serials.length > 0 && (
                      <div style={{ marginTop: '1px', fontSize: '0.64rem', color: '#0284c7', fontFamily: 'monospace', fontWeight: 600, wordBreak: 'break-all' }}>
                        <strong>S/N:</strong> {it.serials.join(', ')}
                      </div>
                    )}
                  </td>
                  <td style={{ border: '1px solid #64748b', padding: '2px 4px', textAlign: 'center', color: '#334155', fontSize: '0.68rem', fontWeight: 600 }}>
                    {it.warranty || '—'}
                  </td>
                  <td style={{ border: '1px solid #64748b', padding: '2px 4px', textAlign: 'right', fontWeight: 700, fontSize: '0.72rem' }}>
                    {formatDecimal(it.qty)}
                  </td>
                  <td style={{ border: '1px solid #64748b', padding: '2px 4px', textAlign: 'center', color: '#475569', fontSize: '0.68rem' }}>
                    {it.uom}
                  </td>
                  {!isChalan && (
                    <>
                      <td style={{ border: '1px solid #64748b', padding: '2px 6px', textAlign: 'right', color: '#334155', fontSize: '0.72rem' }}>
                        {taka(it.unitPrice)}
                      </td>
                      <td style={{ border: '1px solid #64748b', padding: '2px 6px', textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: '0.72rem' }}>
                        {taka(it.amount)}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* 4. Dynamic Settlement & Terms Block */}
          {!isChalan && (
            <div
              className="avoid-break"
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'stretch',
                marginBottom: '6px',
                fontSize: '0.72rem',
              }}
            >
              {/* Left Side: Total Qty badge, Dynamic Taka In Words, Narration & Dynamic Return Policy */}
              <div style={{ flex: '1 1 54%', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      border: '1px solid #0f172a',
                      background: '#f8fafc',
                      padding: '1.5px 8px',
                      borderRadius: '3px',
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      color: '#0f172a',
                    }}
                  >
                    Total Qty: {formatDecimal(totalQuantity)}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '6px', padding: '1px 0' }}>
                  <span style={{ color: '#475569', fontWeight: 700, minWidth: '78px', fontSize: '0.7rem' }}>Taka In Word:</span>
                  <span style={{ color: '#0f172a', fontWeight: 700, fontSize: '0.7rem' }}>{takaInWords(netPayable + previousDue)}</span>
                </div>

                {narration && (
                  <div style={{ display: 'flex', gap: '6px', padding: '1px 0' }}>
                    <span style={{ color: '#475569', fontWeight: 700, minWidth: '78px', fontSize: '0.7rem' }}>Narration:</span>
                    <span style={{ color: '#0f172a', whiteSpace: 'pre-line', fontSize: '0.7rem' }}>{narration}</span>
                  </div>
                )}

                {/* Dynamic Return Policy (Loaded from Settings, hides if empty) */}
                {returnPolicyText && (
                  <div
                    style={{
                      marginTop: '2px',
                      padding: '4px 6px',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '3px',
                      fontSize: '0.64rem',
                      color: '#334155',
                      lineHeight: 1.3,
                      whiteSpace: 'pre-line',
                    }}
                  >
                    <strong style={{ color: '#0f172a', display: 'block', marginBottom: '1.5px' }}>Terms & Return Policy:</strong>
                    {returnPolicyText}
                  </div>
                )}
              </div>

              {/* Right Side: Dynamic Financial Ledger */}
              <div
                style={{
                  flex: '0 0 255px',
                  border: '1px solid #475569',
                  borderRadius: '3px',
                  padding: '3px 6px',
                  alignSelf: 'flex-start',
                  fontSize: '0.72rem',
                  background: '#ffffff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>
                  <span>Total Amount:</span>
                  <strong style={{ color: '#0f172a' }}>{taka(subtotal)}</strong>
                </div>

                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>
                    <span>Less Discount:</span>
                    <strong style={{ color: '#dc2626' }}>-{taka(discount)}</strong>
                  </div>
                )}

                {vat > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>
                    <span>Add VAT / Tax:</span>
                    <strong style={{ color: '#0f172a' }}>+{taka(vat)}</strong>
                  </div>
                )}

                {(setupCharge > 0 || extraCost > 0) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>
                    <span>{extraCostCategory || 'Extra / Logistics Charges'}:</span>
                    <strong style={{ color: '#15803d' }}>+{taka(setupCharge + extraCost)}</strong>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid #94a3b8', fontWeight: 800, fontSize: '0.76rem', color: '#0f172a', background: '#f8fafc' }}>
                  <span>Net Payable Amount:</span>
                  <span style={{ color: '#0284c7' }}>{taka(netPayable)}</span>
                </div>

                {!isQuotation && (
                  <>
                    {previousDue !== 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>
                        <span>Previous Due:</span>
                        <strong style={{ color: '#0f172a' }}>{taka(previousDue)}</strong>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', borderBottom: '1px solid #f1f5f9', fontWeight: 700, color: '#0f172a' }}>
                      <span>Total Due Amount:</span>
                      <span>{taka(totalDueAmount)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', borderBottom: '1px solid #f1f5f9', color: '#15803d' }}>
                      <span>Received Amount:</span>
                      <strong>{taka(paidAmount)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5px 0', color: dueAmount > 0 ? '#b91c1c' : '#15803d', fontWeight: 800, background: dueAmount > 0 ? '#fef2f2' : '#f0fdf4' }}>
                      <span>Balance Due:</span>
                      <span>{taka(dueAmount)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Payment Breakdown & Notes (if any) */}
          {!isChalan && (paymentTenders.length > 0 || extraCostNotes) && (
            <div className="avoid-break" style={{ marginTop: '2px', fontSize: '0.66rem', color: '#475569', borderTop: '1px dashed #cbd5e1', paddingTop: '2px' }}>
              {paymentTenders.length > 0 && (
                <div style={{ marginBottom: extraCostNotes ? '1px' : 0 }}>
                  <strong>Payment Tenders:</strong>{' '}
                  {paymentTenders.map((t, idx) =>
                    `${idx + 1}. ${t.method || 'Cash'}${t.sub_option ? ` (${t.sub_option})` : ''}${t.transaction_id ? ` · Txn:${t.transaction_id}` : ''} = ${taka(t.amount || 0)}`
                  ).join(' , ')}
                </div>
              )}
              {extraCostNotes && (
                <div style={{ color: '#c2410c' }}>
                  <strong>Extra Charge Note:</strong> {extraCostNotes}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Section: Dynamic Warranty Disclaimer, Signatures, Dynamic Partner Strip & Print Timestamp */}
        {showFooterDetails ? (
          <div className="avoid-break" style={{ position: 'relative', zIndex: 1, marginTop: 'auto', paddingTop: '6px' }}>
            {/* Dynamic Warranty Disclaimer (Loaded from Settings, hides if empty) */}
            {warrantyDisclaimerText && (
              <div
                style={{
                  border: '1.5px solid #0f172a',
                  background: '#fffbeb',
                  padding: '3px 8px',
                  borderRadius: '3px',
                  marginTop: '3px',
                  fontSize: '0.64rem',
                  color: '#0f172a',
                  lineHeight: 1.25,
                  textAlign: 'center',
                }}
              >
                <strong>{warrantyDisclaimerText}</strong>
              </div>
            )}

            {invoiceFooterNote && (
              <div style={{ marginTop: '3px', textAlign: 'center', fontSize: '0.66rem', color: '#64748b', fontWeight: 600 }}>
                🎁 {invoiceFooterNote}
              </div>
            )}

            {/* Signatures Footer with Static Declaration String */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginTop: '12px',
                paddingTop: '4px',
              }}
            >
              <div style={{ textAlign: 'center', width: '150px' }}>
                <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '3px', fontSize: '0.68rem', color: '#475569', fontWeight: 600 }}>
                  {isChalan ? 'Delivered By' : 'Customer Signature'}
                </div>
              </div>

              <div style={{ textAlign: 'center', flex: 1, padding: '0 10px', fontSize: '0.64rem', color: '#475569' }}>
                <div style={{ fontWeight: 800, letterSpacing: '0.02em', color: '#0f172a' }}>
                  Computer Generated Bill, No Sign Required
                </div>
              </div>

              <div style={{ textAlign: 'center', width: '150px' }}>
                <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '3px', fontSize: '0.68rem', color: '#475569', fontWeight: 600 }}>
                  {isChalan ? 'Received By' : 'Authorized Signature'}
                </div>
              </div>
            </div>

            {/* Dynamic Partner Strip (Mapped from storeSettings.footer_partner_logos, only if items exist) */}
            {partnerLogos.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  gap: '6px 14px',
                  marginTop: '6px',
                  padding: '4px 8px',
                  borderTop: '1px solid #cbd5e1',
                  borderBottom: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  borderRadius: '3px',
                }}
              >
                {partnerLogos.map((brand, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title={brand.name || ''}
                  >
                    {brand.url ? (
                      <img
                        src={brand.url}
                        alt={brand.name || 'Partner'}
                        style={{ height: '18px', maxWidth: '70px', objectFit: 'contain' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#0f172a' }}>{brand.name}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {storeName && (
              <div style={{ textAlign: 'center', fontSize: '0.62rem', color: '#94a3b8', marginTop: '3px' }}>
                Thank you for choosing {storeName}!
              </div>
            )}

            {/* Dynamic Print Date & Time Block */}
            <div
              style={{
                textAlign: 'center',
                fontSize: '9px',
                color: '#64748b',
                marginTop: '4px',
                letterSpacing: '0.01em',
              }}
            >
              Printed on: {formatPrintDateTime(printTime)}
            </div>
          </div>
        ) : (
          <div className="avoid-break" style={{ position: 'relative', zIndex: 1, marginTop: 'auto', paddingTop: '4px' }}>
            <div
              style={{
                textAlign: 'center',
                fontSize: '9px',
                color: '#64748b',
                marginTop: '4px',
                letterSpacing: '0.01em',
              }}
            >
              Printed on: {formatPrintDateTime(printTime)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
