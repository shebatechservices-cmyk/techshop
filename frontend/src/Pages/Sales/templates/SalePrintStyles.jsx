import React from 'react';

export default function SalePrintStyles({
  isThermal = false,
  paperSize = 'a4',
  pageMargin = 'default',
  pageSizeRule = 'A4 portrait',
}) {
  return (
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
          padding: ${isThermal ? '0' : (pageMargin === '1in' ? '12mm 14mm' : (pageMargin === '0.5in' ? '8mm 10mm' : '6mm 7mm'))} !important;
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
        .invoice-page-border {
          border: ${isThermal ? 'none' : '1.5px solid #0f172a'} !important;
          border-radius: ${isThermal ? '0' : '4px'} !important;
          padding: ${isThermal ? '0' : (pageMargin === '1in' ? '12px 16px' : (pageMargin === '0.5in' ? '10px 14px' : '8px 12px'))} !important;
          height: 100% !important;
          min-height: 100% !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          box-sizing: border-box !important;
          position: relative !important;
          -webkit-box-decoration-break: clone !important;
          box-decoration-break: clone !important;
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
  );
}
