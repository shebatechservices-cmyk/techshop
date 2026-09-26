import React, { useEffect, useState } from 'react';
import API from '../../../services/api';
import { fullCatalogName } from '../../../utils/productUtils';
import { shareInvoiceDocument } from '../../../utils/invoiceShareHelper';
import InvoiceShareModal from '../templates/InvoiceShareModal';
import InvoiceToolbar from '../templates/InvoiceToolbar';
import A4InvoiceView from '../templates/A4InvoiceView';
import ThermalReceiptView from '../templates/ThermalReceiptView';
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

  // Advanced Print Layout Settings from Store
  const paperSize = store.paper_size || (store.default_invoice_format === 'thermal_80mm' ? 'thermal_80mm' : (store.default_invoice_format === 'a5_invoice' ? 'a5' : 'a4'));
  const pageMargin = store.page_margin || 'default';
  const showFooterDetails = store.show_footer_details !== false;

  const pageSizeRule = paperSize === 'a5' ? 'A5 portrait' : (paperSize === 'thermal_80mm' ? '80mm auto' : 'A4 portrait');

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
    const authData = localStorage.getItem('sheba_auth_user') || sessionStorage.getItem('sheba_auth_user');
    if (authData) {
      const parsed = JSON.parse(authData);
      operatorName = parsed.name || parsed.username || '';
    }
  } catch {}

  const preparedBy = invoice.prepared_by || invoice.created_by_name || invoice.created_by || operatorName || 'Sheba Tech Admin';
  const salesPerson = invoice.sales_person || invoice.sales_person_name || preparedBy;

  // 4. Dynamic Items Array Mapping
  const rawItems = invoice.items || invoice.sales_items || [];
  const items = rawItems.map((it) => {
    const unitPrice = parseFloat(it.unit_price ?? it.price ?? it.rate ?? it.selling_price ?? 0);
    const qty = parseFloat(it.quantity ?? it.qty ?? 1);
    const amount = parseFloat(it.total_price ?? it.total ?? (unitPrice * qty));
    const uom = it.uom || it.unit || 'Pcs';
    const warranty = it.warranty_months
      ? `${it.warranty_months} M`
      : (it.warranty || (it.warranty_text ? it.warranty_text : ''));

    let serials = [];
    if (Array.isArray(it.serials) && it.serials.length > 0) {
      serials = it.serials.map((s) => (typeof s === 'string' ? s : s.serial_code)).filter(Boolean);
    } else if (it.serial_numbers) {
      serials = Array.isArray(it.serial_numbers) ? it.serial_numbers : [it.serial_numbers];
    } else if (it.serial_no) {
      serials = [it.serial_no];
    }

    const fullName = fullCatalogName(it);
    return {
      name: fullName,
      uom,
      warranty,
      qty,
      unitPrice,
      amount,
      serials,
    };
  });

  const totalQuantity = items.reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
  const subtotal = parseFloat(invoice.subtotal ?? invoice.gross_amount ?? (items.reduce((s, it) => s + it.amount, 0)));
  const discount = parseFloat(invoice.discount ?? invoice.discount_amount ?? 0);
  const vat = parseFloat(invoice.vat ?? invoice.vat_amount ?? invoice.tax ?? 0);
  const setupCharge = parseFloat(invoice.setup_charge ?? 0);
  const extraCost = parseFloat(invoice.extra_cost ?? 0);
  const extraCostCategory = invoice.extra_cost_category || '';
  const extraCostNotes = invoice.extra_cost_notes || '';
  const netPayable = parseFloat(invoice.total_amount ?? invoice.net_total ?? (subtotal - discount + vat + setupCharge + extraCost));
  const previousDue = parseFloat(invoice.previous_due ?? 0);
  const totalDueAmount = netPayable + previousDue;
  const paidAmount = parseFloat(invoice.paid_amount ?? invoice.total_paid ?? 0);
  const dueAmount = parseFloat(invoice.due_amount ?? (totalDueAmount - paidAmount));
  const isFullyPaid = dueAmount <= 0.01;
  const isPartialPaid = paidAmount > 0 && !isFullyPaid;
  const paymentStatus = isQuotation ? 'QUOTATION' : (isFullyPaid ? 'PAID' : (isPartialPaid ? 'PARTIAL' : 'DUE'));
  const narration = invoice.note || invoice.narration || invoice.remarks || '';

  const paymentTenders = Array.isArray(invoice.payments) ? invoice.payments : (
    Array.isArray(invoice.payment_tenders) ? invoice.payment_tenders : []
  );

  // Sharing states
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [shareStep, setShareStep] = useState(null);

  const handlePrint = () => {
    window.print();
  };

  const handleExecuteShare = async (actionType) => {
    const printArea = document.getElementById('sale-print-area');
    if (!printArea) return;
    setShareLoading(true);
    try {
      await shareInvoiceDocument({
        element: printArea,
        format: selectedFormat,
        action: actionType,
        docNumber,
        customerPhone,
        customerEmail,
        customerName,
        onProgress: (step) => setShareStep(step),
      });
      setShowShareModal(false);
    } catch (err) {
      console.error('Document share failed:', err);
      alert(`Sharing failed: ${err.message || 'Unknown error'}`);
    } finally {
      setShareLoading(false);
      setShareStep(null);
    }
  };

  const isThermal = paperSize === 'thermal_80mm';

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
            height: ${isThermal ? 'auto' : '100%'} !important;
            max-height: ${isThermal ? 'none' : '100%'} !important;
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
            height: ${isThermal ? 'auto' : '100vh'} !important;
            max-height: ${isThermal ? 'none' : (paperSize === 'a5' ? '210mm' : '297mm')} !important;
            min-height: ${isThermal ? 'auto' : (paperSize === 'a5' ? '210mm' : '297mm')} !important;
            margin: 0 !important;
            padding: ${pageMargin === '1in' ? '20mm 24mm' : (pageMargin === '0.5in' ? '12mm 14mm' : '8mm 10mm')} !important;
            box-sizing: border-box !important;
            background: #ffffff !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            font-size: ${isThermal ? '9.5px' : (paperSize === 'a5' ? '10px' : '11px')} !important;
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

      {/* Floating Action Header */}
      <InvoiceToolbar
        isQuotation={isQuotation}
        isChalan={isChalan}
        docNumber={docNumber}
        paperSize={paperSize}
        pageMargin={pageMargin}
        mode={mode}
        setMode={setMode}
        handlePrint={handlePrint}
        shareLoading={shareLoading}
        setShowShareModal={setShowShareModal}
        onClose={onClose}
      />

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

      {/* Printable Sheet */}
      <div
        id="sale-print-area"
        style={{
          width: '100%',
          maxWidth: isThermal ? '380px' : (paperSize === 'a5' ? '600px' : '820px'),
          minHeight: isThermal ? 'auto' : (paperSize === 'a5' ? '195mm' : '275mm'),
          background: '#ffffff',
          padding: pageMargin === '1in' ? '24px 28px' : (pageMargin === '0.5in' ? '16px 20px' : '14px 18px'),
          boxSizing: 'border-box',
          borderRadius: '0 0 10px 10px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: isThermal ? 'monospace' : 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {isThermal ? (
          <ThermalReceiptView
            storeName={storeName}
            storeSubtitle={storeSubtitle}
            storeAddress={storeAddress}
            storePhones={storePhones}
            storeLogo={storeLogo}
            showLogo={showLogo}
            customerName={customerName}
            customerPhone={customerPhone}
            docNumber={docNumber}
            dateFormatted={dateFormatted}
            timeFormatted={timeFormatted}
            items={items}
            totalQuantity={totalQuantity}
            subtotal={subtotal}
            discount={discount}
            vat={vat}
            setupCharge={setupCharge}
            extraCost={extraCost}
            extraCostCategory={extraCostCategory}
            netPayable={netPayable}
            previousDue={previousDue}
            totalDueAmount={totalDueAmount}
            paidAmount={paidAmount}
            dueAmount={dueAmount}
            paymentTenders={paymentTenders}
            returnPolicyText={returnPolicyText}
            printTime={printTime}
          />
        ) : (
          <A4InvoiceView
            store={store}
            storeName={storeName}
            storeSubtitle={storeSubtitle}
            storeAddress={storeAddress}
            storePhones={storePhones}
            storeEmail={storeEmail}
            storeWebsite={storeWebsite}
            storeLogo={storeLogo}
            storeSecondaryLogo={storeSecondaryLogo}
            storeWatermarkLogo={storeWatermarkLogo}
            showLogo={showLogo}
            partnerLogos={partnerLogos}
            returnPolicyText={returnPolicyText}
            warrantyDisclaimerText={warrantyDisclaimerText}
            invoiceFooterNote={invoiceFooterNote}
            showFooterDetails={showFooterDetails}
            customerName={customerName}
            customerAddress={customerAddress}
            customerPhone={customerPhone}
            customerEmail={customerEmail}
            customerAttention={customerAttention}
            customerDestination={customerDestination}
            docNumber={docNumber}
            dateFormatted={dateFormatted}
            timeFormatted={timeFormatted}
            preparedBy={preparedBy}
            salesPerson={salesPerson}
            paymentStatus={paymentStatus}
            isFullyPaid={isFullyPaid}
            isPartialPaid={isPartialPaid}
            items={items}
            totalQuantity={totalQuantity}
            subtotal={subtotal}
            discount={discount}
            vat={vat}
            setupCharge={setupCharge}
            extraCost={extraCost}
            extraCostCategory={extraCostCategory}
            extraCostNotes={extraCostNotes}
            netPayable={netPayable}
            previousDue={previousDue}
            totalDueAmount={totalDueAmount}
            paidAmount={paidAmount}
            dueAmount={dueAmount}
            narration={narration}
            paymentTenders={paymentTenders}
            isQuotation={isQuotation}
            isChalan={isChalan}
            printTime={printTime}
          />
        )}
      </div>
    </div>
  );
}
