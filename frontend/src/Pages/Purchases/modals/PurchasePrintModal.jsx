import React, { useEffect, useState } from 'react';
import API from '../../../services/api';
import { fullCatalogName } from '../../../utils/productUtils';
import { shareInvoiceDocument } from '../../../utils/invoiceShareHelper';
import PurchaseShareModal from '../templates/PurchaseShareModal';
import { taka, formatDecimal, formatPrintDateTime } from '../templates/purchaseModalHelpers';

const DEFAULT_COMPANY = {
  name: 'Sheba Technology',
  tagline: 'Complete IT Solutions, Hardware, Networking & Surveillance',
  address: 'Multiplan Center, Level 9, New Elephant Road, Dhaka-1205',
  phone: '+880 1711-000000, +880 1811-000000',
  email: 'billing@shebatechnology.com',
  web: 'www.shebatechnology.com',
};

export default function PurchasePrintModal({
  isOpen,
  onClose,
  order,
  supplier,
  company: propCompany = DEFAULT_COMPANY,
}) {
  const [mode, setMode] = useState('po'); // 'po' | 'chalan'
  const [shop, setShop] = useState({});

  useEffect(() => {
    if (isOpen) {
      setMode('po');
      fetch(`${API}/settings`)
        .then((res) => res.json())
        .then((json) => {
          if (json && json.data) setShop(json.data);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const isChalan = mode === 'chalan';

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

  // Advanced Print Layout Settings from Store
  const paperSize = shop.paper_size || (shop.default_invoice_format === 'thermal_80mm' ? 'thermal_80mm' : (shop.default_invoice_format === 'a5_invoice' ? 'a5' : 'a4'));
  const pageMargin = shop.page_margin || 'default';
  const showFooterDetails = shop.show_footer_details !== false && showSignature;

  const pageSizeRule = paperSize === 'a5' ? 'A5 portrait' : (paperSize === 'thermal_80mm' ? '80mm auto' : 'A4 portrait');
  const pageMarginRule = pageMargin === '0.5in' ? '0.5in' : (pageMargin === '1in' ? '1.0in' : '8mm');

  const poNumber = order.po_number || `PO-${order.id || 'DRAFT'}`;
  const dateStr = order.created_at
    ? new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const supplierName = supplier?.name || order.supplier_name || 'Vendor / Supplier';
  const supplierPhone = supplier?.phone || order.supplier_phone || '';
  const supplierContact = supplier?.contact_code || order.supplier_contact || '';
  const supplierAddress = supplier?.address || '';

  const items = Array.isArray(order.items) ? order.items : [];
  const payments = Array.isArray(order.payments) ? order.payments : [];

  const itemsCost = items.reduce((sum, it) => sum + (Number(it.cost_price || 0) * Number(it.quantity || 0)), 0);
  const extraCost = Number(order.extra_cost || 0);
  const currentTotal = itemsCost + extraCost;
  const previousDue = Number(order.previous_due !== undefined ? order.previous_due : (supplier?.payable_balance || 0));
  const totalPayable = previousDue + currentTotal;
  const totalPaid = Number(order.total_paid || payments.reduce((sum, p) => sum + Number(p.amount || 0), 0));
  const remainingDue = Math.max(0, totalPayable - totalPaid);

  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('pdf'); // 'pdf' | 'jpg'
  const [shareLoading, setShareLoading] = useState(false);
  const [shareStep, setShareStep] = useState('');
  const [activeAction, setActiveAction] = useState(null);

  const handlePrint = () => {
    window.print();
  };

  const handleExecuteShare = async (target) => {
    const elem = document.getElementById('purchase-print-area');
    if (!elem) return;
    setActiveAction(target);
    setShareLoading(true);
    try {
      await shareInvoiceDocument({
        element: elem,
        target, // 'whatsapp' | 'email' | 'web_share' | 'download'
        format: selectedFormat,
        docType: isChalan ? 'Challan' : 'PurchaseOrder',
        docNumber: poNumber,
        customerName: supplierName,
        customerPhone: supplierPhone,
        customerEmail: supplier?.email || '',
        storeName: company.name,
        storePhone: company.phone,
        netPayable: totalPayable,
        paidAmount: totalPaid,
        dueAmount: remainingDue,
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
    <div className="print-modal-backdrop" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 100000,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      overflowY: 'auto',
      padding: '20px 10px',
    }}>
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .print-modal-backdrop, .print-modal-backdrop * {
            visibility: visible !important;
          }
          .print-modal-backdrop {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            display: block !important;
            overflow: visible !important;
          }
          .print-actions-bar {
            display: none !important;
          }
          .a4-page-sheet {
            width: 100% !important;
            max-width: ${paperSize === 'thermal_80mm' ? '80mm' : (paperSize === 'a5' ? '148mm' : 'none')} !important;
            min-height: ${paperSize === 'thermal_80mm' ? 'auto' : (paperSize === 'a5' ? '195mm' : '280mm')} !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            font-size: ${paperSize === 'thermal_80mm' ? '9.5px' : (paperSize === 'a5' ? '10px' : '11px')} !important;
          }
          @page {
            size: ${pageSizeRule};
            margin: ${pageMarginRule};
          }
        }
      `}</style>

      {/* Top Action Bar (hidden on print) */}
      <div className="print-actions-bar" style={{
        width: '100%',
        maxWidth: paperSize === 'thermal_80mm' ? '380px' : (paperSize === 'a5' ? '600px' : '840px'),
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#0f172a',
        padding: '12px 20px',
        borderRadius: '12px',
        marginBottom: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        color: '#ffffff',
        flexWrap: 'wrap',
        gap: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem' }}>🖨️</span>
          <div>
            <strong style={{ fontSize: '1rem', display: 'block' }}>Purchase Order Print Preview</strong>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Order #{poNumber} · {paperSize.toUpperCase()} · Margin: {pageMargin}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setMode('po')}
            style={{
              background: mode === 'po' ? '#0284c7' : 'rgba(255,255,255,0.12)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '7px 12px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            📋 PO Invoice
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

          {/* Print */}
          <button
            type="button"
            onClick={handlePrint}
            disabled={shareLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: shareLoading ? 'not-allowed' : 'pointer',
            }}
          >
            <span>🖨️</span> Print
          </button>

          {/* Consolidated Share / Export Button */}
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            disabled={shareLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              background: '#16a34a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: shareLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(22,163,74,0.3)',
            }}
            title="Share or Export Purchase Order as PDF or JPG"
          >
            <span>📤</span> Share / Export
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            disabled={shareLoading}
            style={{
              padding: '7px 14px',
              background: 'rgba(255,255,255,0.15)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Share / Export Format Selection Modal */}
      <PurchaseShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareLoading={shareLoading}
        selectedFormat={selectedFormat}
        setSelectedFormat={setSelectedFormat}
        handleExecuteShare={handleExecuteShare}
        poNumber={poNumber}
        supplierName={supplierName}
        supplierPhone={supplierPhone}
        supplierEmail={supplier?.email || ''}
        shareStep={shareStep}
        activeAction={activeAction}
      />

      {/* Printable Sheet */}
      <div id="purchase-print-area" className="a4-page-sheet" style={{
        width: '100%',
        maxWidth: paperSize === 'thermal_80mm' ? '380px' : (paperSize === 'a5' ? '600px' : '840px'),
        minHeight: paperSize === 'thermal_80mm' ? 'auto' : (paperSize === 'a5' ? '195mm' : '275mm'),
        background: '#ffffff',
        color: '#1e293b',
        borderRadius: '12px',
        padding: pageMargin === '1in' ? '36px 40px' : (pageMargin === '0.5in' ? '22px 26px' : '16px 20px'),
        boxShadow: '0 10px 40px rgba(0,0,0,0.18)',
        boxSizing: 'border-box',
        fontSize: paperSize === 'thermal_80mm' ? '9.5px' : (paperSize === 'a5' ? '10px' : '11px'),
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}>
        {/* Header Block */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '2.5px solid #0f172a',
          paddingBottom: '20px',
          marginBottom: '20px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7, #0f172a)',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 900,
                fontSize: '1.3rem',
              }}>
                ST
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                  {company.name}
                </h1>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                  {company.tagline}
                </p>
              </div>
            </div>
            {showLogo && company.logo && (
              <img
                src={company.logo}
                alt={company.name}
                style={{ width: '56px', height: '56px', objectFit: 'contain', borderRadius: '8px', marginTop: '8px' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
            <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#475569', lineHeight: 1.5 }}>
              <div>{company.address}</div>
              <div>Phone: {company.phone} · Email: {company.email}</div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{
              display: 'inline-block',
              padding: '6px 14px',
              borderRadius: '6px',
              background: '#f0f9ff',
              border: '1.5px solid #0284c7',
              color: '#0369a1',
              fontWeight: 800,
              fontSize: '1rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              Purchase {isChalan ? 'Delivery Challan' : 'Order'}
            </div>
            <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#0f172a', fontWeight: 700 }}>
              {isChalan ? 'Chalan No: ' : 'PO No: '}<span style={{ color: '#0284c7' }}>{poNumber}</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
              Date: {dateStr}
            </div>
            {order.transaction_reference && (
              <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '2px' }}>
                Ref: <strong>{order.transaction_reference}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Vendor & Order Details Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '20px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '22px',
          fontSize: '0.84rem',
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Vendor / Supplier Details
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
              {supplierName}
            </div>
            {supplierContact && (
              <div style={{ color: '#475569', marginTop: '2px' }}>Contact ID: {supplierContact}</div>
            )}
            {supplierPhone && (
              <div style={{ color: '#475569', marginTop: '2px' }}>Phone: <strong>{supplierPhone}</strong></div>
            )}
            {supplierAddress && (
              <div style={{ color: '#64748b', marginTop: '2px' }}>{supplierAddress}</div>
            )}
          </div>

          <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '20px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Payment & Delivery Summary
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '4px', color: '#334155' }}>
              <span>Total Units:</span>
              <strong>{order.unit_count || items.reduce((s, it) => s + Number(it.quantity || 0), 0)} Units ({items.length} Items)</strong>

              {!isChalan && (
                <>
                  <span>Payment Status:</span>
                  <strong style={{
                    color: remainingDue === 0 ? '#16a34a' : totalPaid > 0 ? '#d97706' : '#dc2626',
                    textTransform: 'uppercase',
                  }}>
                    {remainingDue === 0 ? 'Fully Paid' : totalPaid > 0 ? 'Partially Paid' : 'Due / Credit'}
                  </strong>

                  <span>Primary Method:</span>
                  <strong>{payments[0]?.payment_method || 'Cash / Multi-tender'}</strong>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div style={{ marginBottom: '22px' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.78rem',
            textAlign: 'left',
          }}>
            <thead>
              <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                <th style={{ padding: '5px 8px', width: '30px', textAlign: 'center' }}>#</th>
                <th style={{ padding: '5px 8px' }}>Product Description</th>
                <th style={{ padding: '5px 8px', width: '70px', textAlign: 'center' }}>Warranty</th>
                {!isChalan && <th style={{ padding: '5px 8px', width: '85px', textAlign: 'right' }}>Unit Cost</th>}
                <th style={{ padding: '5px 8px', width: '45px', textAlign: 'center' }}>Qty</th>
                {!isChalan && <th style={{ padding: '5px 8px', width: '95px', textAlign: 'right' }}>Total Cost</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const qty = Number(item.quantity || 0);
                const cost = Number(item.cost_price || 0);
                const total = Number(item.line_total || cost * qty);
                const serials = Array.isArray(item.serials) ? item.serials : [];
                return (
                  <React.Fragment key={idx}>
                    <tr style={{
                      borderBottom: serials.length > 0 ? 'none' : '1px solid #e2e8f0',
                      background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                    }}>
                      <td style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 600, color: '#64748b' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '4px 8px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                          {fullCatalogName(item) || item.full_name || item.name || item.product_name || 'Product'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', gap: '8px', lineHeight: 1.2 }}>
                          {!item.full_name && item.brand_name && <span>Brand: {item.brand_name}</span>}
                          {item.sku && <span>SKU: {item.sku}</span>}
                        </div>
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center', color: '#475569' }}>
                        {item.warranty_months ? `${item.warranty_months} Mos` : '—'}
                      </td>
                      {!isChalan && (
                      <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 600 }}>
                        {taka(cost)}
                      </td>
                      )}
                      <td style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 700, color: '#0284c7' }}>
                        {qty}
                      </td>
                      {!isChalan && (
                      <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                        {taka(total)}
                      </td>
                      )}
                    </tr>
                    {serials.length > 0 && (
                      <tr style={{
                        borderBottom: '1px solid #e2e8f0',
                        background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                      }}>
                        <td></td>
                        <td colSpan={isChalan ? 3 : 5} style={{ padding: '0 8px 5px' }}>
                          <div style={{
                            padding: '3px 8px',
                            background: '#f0f9ff',
                            border: '1px dashed #bae6fd',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            color: '#0369a1',
                            wordBreak: 'break-all',
                            lineHeight: 1.35,
                          }}>
                            <strong>Scanned S/N ({serials.length}):</strong> {serials.join(', ')}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Calculation Breakdown & Payments */}
        {!isChalan && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '20px',
          marginBottom: '26px',
        }}>
          {/* Payment Tenders Detail */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '14px',
            fontSize: '0.8rem',
          }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
              Payment Tenders Recorded ({payments.length})
            </div>
            {payments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {payments.map((p, pIdx) => (
                  <div key={pIdx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 8px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                  }}>
                    <div>
                      <strong style={{ color: '#0f172a' }}>{p.payment_method || 'Cash'}</strong>
                      {p.account_name && <span style={{ color: '#64748b' }}> · {p.account_name}</span>}
                      {p.transaction_id && <span style={{ color: '#0284c7' }}> · Trx: {p.transaction_id}</span>}
                    </div>
                    <strong style={{ color: '#16a34a' }}>{taka(p.amount)}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                No payment tenders recorded (Full Due / Credit).
              </div>
            )}
          </div>

          {/* Financial Calculation Box */}
          <div style={{
            background: '#ffffff',
            border: '1.5px solid #cbd5e1',
            borderRadius: '10px',
            padding: '14px 18px',
            fontSize: '0.85rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#475569' }}>
              <span>Items Subtotal:</span>
              <strong>{taka(itemsCost)}</strong>
            </div>

            {extraCost > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#475569' }}>
                <span>Freight / Extra Cost:</span>
                <strong>{taka(extraCost)}</strong>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderTop: '1px solid #f1f5f9', color: '#0f172a', fontWeight: 700 }}>
              <span>Current Order Total:</span>
              <strong style={{ color: '#0284c7' }}>{taka(currentTotal)}</strong>
            </div>

            {previousDue > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#b45309' }}>
                <span>Previous Due Balance:</span>
                <strong>{taka(previousDue)}</strong>
              </div>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0',
              borderTop: '2px solid #0f172a',
              marginTop: '4px',
              fontSize: '1rem',
              fontWeight: 900,
              color: '#0f172a',
            }}>
              <span>Total Payable:</span>
              <span>{taka(totalPayable)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#16a34a', fontWeight: 700 }}>
              <span>Total Paid:</span>
              <strong>{taka(totalPaid)}</strong>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '6px 0',
              borderTop: '1px dashed #cbd5e1',
              marginTop: '4px',
              fontWeight: 800,
              color: remainingDue > 0 ? '#dc2626' : '#16a34a',
            }}>
              <span>Remaining Due:</span>
              <span>{taka(remainingDue)}</span>
            </div>
          </div>
        </div>
        )}

        {/* Terms & Signature Section */}
        {showFooterDetails && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '24px',
              paddingTop: '40px',
              borderTop: '1px solid #cbd5e1',
              textAlign: 'center',
              fontSize: '0.8rem',
              color: '#475569',
            }}>
              <div>
                <div style={{ borderBottom: '1.5px dashed #94a3b8', width: '80%', margin: '0 auto 8px' }}></div>
                <strong>{isChalan ? 'Delivered By' : 'Prepared By'}</strong>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{isChalan ? "Supplier's Representative" : 'Procurement Officer'}</div>
              </div>

              <div>
                <div style={{ borderBottom: '1.5px dashed #94a3b8', width: '80%', margin: '0 auto 8px' }}></div>
                <strong>Received By (Store)</strong>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Inventory In-charge</div>
              </div>

              <div>
                <div style={{ borderBottom: '1.5px dashed #94a3b8', width: '80%', margin: '0 auto 8px' }}></div>
                <strong>Authorized Signature</strong>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Managing Director</div>
              </div>
            </div>

            {/* System Watermark Note */}
            <div style={{
              marginTop: '24px',
              textAlign: 'center',
              fontSize: '0.7rem',
              color: '#94a3b8',
              borderTop: '1px solid #f1f5f9',
              paddingTop: '10px',
            }}>
              Computer-generated purchase receipt powered by {company.name} ERP System · Printed: {new Date().toLocaleString('en-GB')}
            </div>
          </>
        )}
        {!showSignature && <div style={{ height: '8px' }} />}
      </div>
    </div>
  );
}
