import React from 'react';
import A4InvoiceView from './A4InvoiceView';
import ThermalReceiptView from './ThermalReceiptView';

export default function SalePrintSheet({ invoiceData, printTime, isQuotation }) {
  const { isThermal, paperSize, pageMargin } = invoiceData;

  const maxWidth = isThermal ? '380px' : paperSize === 'a5' ? '600px' : '820px';
  const minHeight = isThermal ? 'auto' : paperSize === 'a5' ? '195mm' : '275mm';
  const padding = isThermal
    ? '10px'
    : pageMargin === '1in'
    ? '16px 20px'
    : pageMargin === '0.5in'
    ? '12px 14px'
    : '8px 10px';

  const innerPadding =
    pageMargin === '1in'
      ? '14px 18px'
      : pageMargin === '0.5in'
      ? '10px 14px'
      : '8px 12px';

  return (
    <div
      id="sale-print-area"
      style={{
        width: '100%',
        maxWidth,
        minHeight,
        background: '#ffffff',
        padding,
        boxSizing: 'border-box',
        borderRadius: '0 0 10px 10px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: isThermal
          ? 'monospace'
          : 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {isThermal ? (
        <ThermalReceiptView
          {...invoiceData}
          printTime={printTime}
        />
      ) : (
        <div
          className="invoice-page-border"
          style={{
            border: '1.5px solid #0f172a',
            borderRadius: '4px',
            padding: innerPadding,
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
            {...invoiceData}
            isQuotation={isQuotation}
            printTime={printTime}
          />
        </div>
      )}
    </div>
  );
}
