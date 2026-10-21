import React from 'react';
import InvoiceShareModal from '../templates/InvoiceShareModal';
import InvoiceToolbar from '../templates/InvoiceToolbar';
import SalePrintStyles from '../templates/SalePrintStyles';
import SalePrintSheet from '../templates/SalePrintSheet';
import useSaleInvoiceData from '../hooks/useSaleInvoiceData';
import useSalePrintModalState from '../templates/useSalePrintModalState';

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
  const rawInvoice = propInvoice || propSale;
  const initialDocNo = rawInvoice?.invoice_no || rawInvoice?.invoice_number || rawInvoice?.doc_number || '';
  const initialCustomerPhone = propCustomer?.phone || rawInvoice?.customer_phone || '';
  const initialCustomerEmail = propCustomer?.email || rawInvoice?.customer_email || '';
  const initialCustomerName = propCustomer?.name || rawInvoice?.customer_name || '';

  const {
    mode,
    setMode,
    fetchedSettings,
    printTime,
    showShareModal,
    setShowShareModal,
    shareLoading,
    selectedFormat,
    setSelectedFormat,
    shareStep,
    handleExecuteShare,
  } = useSalePrintModalState({
    isOpen,
    docNumber: initialDocNo,
    customerPhone: initialCustomerPhone,
    customerEmail: initialCustomerEmail,
    customerName: initialCustomerName,
  });

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
    paperSize,
    pageMargin,
    pageSizeRule,
    docNumber,
    customerName,
    customerPhone,
    customerEmail,
    isThermal,
    isChalan,
  } = invoiceData;

  const handlePrint = () => {
    window.print();
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
        overflowX: 'auto',
        padding: '12px 6px',
        WebkitOverflowScrolling: 'touch',
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
      <SalePrintSheet
        invoiceData={invoiceData}
        printTime={printTime}
        isQuotation={isQuotation}
      />
    </div>
  );
}
