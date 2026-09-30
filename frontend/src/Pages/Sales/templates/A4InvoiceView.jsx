import React from 'react';
import InvoiceHeader from './invoice/InvoiceHeader';
import InvoiceMetaGrid from './invoice/InvoiceMetaGrid';
import InvoiceItemsTable from './invoice/InvoiceItemsTable';
import InvoiceFinancials from './invoice/InvoiceFinancials';
import InvoiceFooter from './invoice/InvoiceFooter';

export default function A4InvoiceView({
  storeName,
  storeSubtitle,
  storeAddress,
  storePhones,
  storeEmail,
  storeWebsite,
  storeLogo,
  storeSecondaryLogo,
  storeWatermarkLogo,
  showLogo,
  partnerLogos,
  returnPolicyText,
  warrantyDisclaimerText,
  invoiceFooterNote,
  showFooterDetails,
  customerName,
  customerAddress,
  customerPhone,
  customerEmail,
  customerAttention,
  customerDestination,
  docNumber,
  dateFormatted,
  timeFormatted,
  preparedBy,
  salesPerson,
  paymentStatus,
  isFullyPaid,
  isPartialPaid,
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
  narration,
  paymentTenders,
  isQuotation,
  isChalan,
  printTime,
}) {
  return (
    <>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}>
        <InvoiceHeader
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
          isQuotation={isQuotation}
          isChalan={isChalan}
        />

        <InvoiceMetaGrid
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
        />

        <InvoiceItemsTable
          items={items}
          isChalan={isChalan}
        />

        <InvoiceFinancials
          isChalan={isChalan}
          isQuotation={isQuotation}
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
          returnPolicyText={returnPolicyText}
          paymentTenders={paymentTenders}
        />
      </div>

      <InvoiceFooter
        showFooterDetails={showFooterDetails}
        warrantyDisclaimerText={warrantyDisclaimerText}
        invoiceFooterNote={invoiceFooterNote}
        isChalan={isChalan}
        partnerLogos={partnerLogos}
        storeName={storeName}
        printTime={printTime}
      />
    </>
  );
}
