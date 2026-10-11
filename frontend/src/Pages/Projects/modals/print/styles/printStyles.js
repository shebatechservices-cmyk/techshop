export function getPrintStyles(layout) {
  return `
    @media screen {
      .project-print-preview-container {
        max-height: 84vh;
        overflow-y: auto;
        background: #334155;
        padding: 24px;
        display: flex;
        justify-content: center;
        border-radius: 0 0 16px 16px;
      }
    }

    @media print {
      @page {
        size: ${layout === 'pos_thermal' ? '80mm auto' : 'A4 portrait'};
        margin: ${layout === 'pos_thermal' ? '3mm 4mm' : '6mm 8mm'};
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: ${layout === 'pos_thermal' ? 'auto' : '100%'} !important;
        max-height: ${layout === 'pos_thermal' ? 'none' : '100%'} !important;
        overflow: hidden !important;
        background: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body * {
        visibility: hidden !important;
      }
      #project-print-modal-container {
        position: static !important;
        display: block !important;
        padding: 0 !important;
        margin: 0 !important;
        background: transparent !important;
        overflow: visible !important;
      }
      #project-print-sheet, #project-print-sheet * {
        visibility: visible !important;
      }
      #project-print-sheet {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .no-print {
        display: none !important;
      }
    }
  `;
}
