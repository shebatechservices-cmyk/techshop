import React, { useEffect, useState } from 'react';
import API from '../../../services/api';
import { fullCatalogName } from '../../../utils/productUtils';
import { shareInvoiceDocument } from '../../../utils/invoiceShareHelper';
import PurchaseShareModal from '../templates/PurchaseShareModal';
import PurchasePrintActionBar from '../components/PurchasePrintActionBar';
import PurchasePrintDocument from '../components/PurchasePrintDocument';
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
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('pdf'); // 'pdf' | 'jpg'
  const [shareLoading, setShareLoading] = useState(false);
  const [shareStep, setShareStep] = useState('');
  const [activeAction, setActiveAction] = useState(null);

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
      <PurchasePrintActionBar
        paperSize={paperSize}
        poNumber={poNumber}
        pageMargin={pageMargin}
        mode={mode}
        setMode={setMode}
        handlePrint={handlePrint}
        shareLoading={shareLoading}
        setShowShareModal={setShowShareModal}
        onClose={onClose}
      />

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
      <PurchasePrintDocument
        paperSize={paperSize}
        pageMargin={pageMargin}
        company={company}
        showLogo={showLogo}
        showSignature={showSignature}
        isChalan={isChalan}
        poNumber={poNumber}
        dateStr={dateStr}
        order={order}
        supplierName={supplierName}
        supplierPhone={supplierPhone}
        supplierContact={supplierContact}
        supplierAddress={supplierAddress}
        items={items}
        payments={payments}
        itemsCost={itemsCost}
        extraCost={extraCost}
        currentTotal={currentTotal}
        previousDue={previousDue}
        totalPayable={totalPayable}
        totalPaid={totalPaid}
        remainingDue={remainingDue}
        showFooterDetails={showFooterDetails}
        taka={taka}
        fullCatalogName={fullCatalogName}
      />
    </div>
  );
}
