import React, { useEffect, useState } from 'react';
import API from '../../../services/api';
import { shareInvoiceDocument } from '../../../utils/invoiceShareHelper';
import InvoiceShareModal from '../templates/InvoiceShareModal';
import InvoiceToolbar from '../templates/InvoiceToolbar';
import A4InvoiceView from '../templates/A4InvoiceView';
import ThermalReceiptView from '../templates/ThermalReceiptView';
import SalePrintStyles from '../templates/SalePrintStyles';
import useSaleInvoiceData from '../hooks/useSaleInvoiceData';

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
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [shareStep, setShareStep] = useState(null);

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

  const rawInvoice = propInvoice || propSale;
  const invoiceData = useSaleInvoiceData({
    invoice: rawInvoice,
    customer: propCustomer,
    storeSettings: propSettings,
    company: propCompany,
    fetchedSettings,
    isQuotation,
    mode,
  });

  if (!isOpen || !rawInvoice || !invoiceData) return null;

  const {
    store,
    storeName,
    storeSubtitle,
    storeAddress,
    storePhones,
    storeEmail,
    storeWebsite,
    storeLogo,
    storeSecondaryLogo,
    storeWatermarkLogo,
    returnPolicyText,
    warrantyDisclaimerText,
    invoiceFooterNote,
    showLogo,
    showFooterDetails,
    paperSize,
    pageMargin,
    pageSizeRule,
    partnerLogos,
    customerName,
    customerPhone,
    customerAddress,
    customerEmail,
    customerAttention,
    customerDestination,
    docNumber,
    dateFormatted,
    timeFormatted,
    preparedBy,
    salesPerson,
    items,
    totalQuantity,
    subtotal,
    discount,
    vat,
    setupCharge,
    extraCost,
    extraCostCategory,
    extraCostNotes,
    netPayable,
    previousDue,
    totalDueAmount,
    paidAmount,
    dueAmount,
    isFullyPaid,
    isPartialPaid,
    paymentStatus,
    narration,
    paymentTenders,
    isThermal,
    isChalan,
  } = invoiceData;

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
      <SalePrintStyles
        isThermal={isThermal}
        paperSize={paperSize}
        pageMargin={pageMargin}
        pageSizeRule={pageSizeRule}
      />

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
          padding: isThermal ? '10px' : (pageMargin === '1in' ? '16px 20px' : (pageMargin === '0.5in' ? '12px 14px' : '8px 10px')),
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
          <div
            className="invoice-page-border"
            style={{
              border: '1.5px solid #0f172a',
              borderRadius: '4px',
              padding: pageMargin === '1in' ? '14px 18px' : (pageMargin === '0.5in' ? '10px 14px' : '8px 12px'),
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '100%',
              height: '100%',
              boxSizing: 'border-box',
              position: 'relative',
              flex: 1,
            }}
          >
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
          </div>
        )}
      </div>
    </div>
  );
}
