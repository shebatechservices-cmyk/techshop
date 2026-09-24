import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import API from '../services/api';

/**
 * Capture printable DOM element to a high-resolution Canvas
 */
export async function captureInvoiceCanvas(element) {
  if (!element) throw new Error('Printable invoice container element not found');

  // Configure high-DPI rendering with clean background
  const canvas = await html2canvas(element, {
    scale: 2, // High resolution (crisp text & logos)
    useCORS: true,
    allowTaint: false,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
    onclone: (clonedDoc) => {
      const clonedElem = clonedDoc.getElementById(element.id) || clonedDoc.querySelector('.print-invoice-sheet');
      if (clonedElem) {
        clonedElem.style.boxShadow = 'none';
        clonedElem.style.border = 'none';
        clonedElem.style.margin = '0 auto';
      }
    }
  });

  return canvas;
}

/**
 * Render DOM to PDF Blob and File
 */
export async function generateInvoicePdf(element, fileName = 'Invoice.pdf') {
  const canvas = await captureInvoiceCanvas(element);
  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pdfWidth = 210; // A4 mm
  const pdfHeight = 297; // A4 mm
  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  if (imgHeight <= pdfHeight) {
    // Single page fit
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
  } else {
    // Multi-page slicing if invoice is longer than single page
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }
  }

  const pdfBlob = pdf.output('blob');
  const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
  return { pdf, blob: pdfBlob, file, dataUrl: imgData };
}

/**
 * Render DOM to JPG Blob and File
 */
export async function generateInvoiceJpg(element, fileName = 'Invoice.jpg') {
  const canvas = await captureInvoiceCanvas(element);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.95));
  const file = new File([blob], fileName, { type: 'image/jpeg' });
  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
  return { blob, file, dataUrl, canvas };
}

/**
 * Upload temporary invoice file for shareable public link
 */
export async function uploadTempInvoiceShare(file, customName = 'Invoice.pdf') {
  const token = localStorage.getItem('sheba_auth_token') || sessionStorage.getItem('sheba_auth_token');
  const formData = new FormData();
  formData.append('file', file, customName);

  let res = await fetch(`${API}/invoices/temp-share`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData
  }).catch(() => null);

  if (!res || !res.ok) {
    // Fallback to sales temp-share route
    res = await fetch(`${API}/sales/temp-share`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData
    }).catch(() => null);
  }

  if (res && res.ok) {
    const data = await res.json();
    return data;
  }

  throw new Error('Failed to upload invoice share file to server');
}

/**
 * Universal Unified Invoice Share Handler (WhatsApp / Email / Native / Direct Download)
 */
export async function shareInvoiceDocument({
  element,
  target = 'whatsapp', // 'whatsapp' | 'email' | 'download_pdf' | 'download_jpg'
  format = 'pdf',      // 'pdf' | 'jpg'
  docType = 'Invoice',
  docNumber = 'INV-001',
  customerName = 'Valued Customer',
  customerPhone = '',
  customerEmail = '',
  storeName = 'Sheba Technology',
  storePhone = '',
  netPayable = 0,
  paidAmount = 0,
  dueAmount = 0,
  onStatusChange = null // callback for UI loading feedback
}) {
  const safeDocNum = String(docNumber).replace(/[^a-zA-Z0-9_-]/g, '_');
  const baseFileName = `${docType}_${safeDocNum}`;
  const pdfFileName = `${baseFileName}.pdf`;
  const jpgFileName = `${baseFileName}.jpg`;

  if (onStatusChange) onStatusChange('rendering');

  try {
    // 1. Generate appropriate file format
    let renderedFile;
    if (format === 'jpg' || target === 'download_jpg') {
      const jpgRes = await generateInvoiceJpg(element, jpgFileName);
      renderedFile = jpgRes.file;
    } else {
      const pdfRes = await generateInvoicePdf(element, pdfFileName);
      renderedFile = pdfRes.file;
    }

    // Direct Client Downloads
    if (target === 'download' || target === 'download_pdf' || target === 'download_jpg') {
      const isPdf = format === 'pdf' && target !== 'download_jpg';
      const fileName = isPdf ? pdfFileName : jpgFileName;
      const url = URL.createObjectURL(renderedFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (onStatusChange) onStatusChange('done');
      return { success: true, method: isPdf ? 'download_pdf' : 'download_jpg' };
    }

    // 2. Primary Method: Web Share API (File attachment dialog on Mobile / Modern Desktop)
    if (navigator.canShare && navigator.canShare({ files: [renderedFile] })) {
      if (onStatusChange) onStatusChange('sharing');
      try {
        await navigator.share({
          title: `${storeName} - ${docType} #${docNumber}`,
          text: `Official ${docType} #${docNumber} from ${storeName} for ${customerName}`,
          files: [renderedFile]
        });
        if (onStatusChange) onStatusChange('done');
        return { success: true, method: 'web_share_api' };
      } catch (shareErr) {
        if (shareErr.name === 'AbortError') {
          if (onStatusChange) onStatusChange('done');
          return { success: false, cancelled: true };
        }
        console.warn('Web Share failed, falling back to public link:', shareErr);
      }
    }

    // 3. Fallback Method: Upload to Temporary Public URL and Share Intent Link
    if (onStatusChange) onStatusChange('uploading');
    const uploadResult = await uploadTempInvoiceShare(renderedFile, renderedFile.name);
    const publicDownloadUrl = uploadResult.full_url || `${window.location.origin}${uploadResult.file_url}`;

    if (onStatusChange) onStatusChange('opening_intent');

    if (target === 'whatsapp') {
      let cleanPhone = String(customerPhone || '').replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('01')) {
        cleanPhone = '88' + cleanPhone;
      }

      let waMessage = `*${(storeName || 'OFFICIAL INVOICE').toUpperCase()}*\n`;
      waMessage += `━━━━━━━━━━━━━━━━━━━━━\n`;
      waMessage += `📄 *Download Official ${docType} Copy (${format.toUpperCase()}):*\n`;
      waMessage += `${publicDownloadUrl}\n`;
      waMessage += `━━━━━━━━━━━━━━━━━━━━━\n`;
      waMessage += `*${docType} No:* ${docNumber}\n`;
      waMessage += `*Customer:* ${customerName}\n`;
      waMessage += `*Net Payable:* ৳${Number(netPayable).toLocaleString()}\n`;
      if (Number(paidAmount) > 0) waMessage += `*Paid Amount:* ৳${Number(paidAmount).toLocaleString()}\n`;
      if (Number(dueAmount) > 0) waMessage += `*Remaining Due:* ৳${Number(dueAmount).toLocaleString()}\n`;
      else waMessage += `*Payment Status:* ✅ Fully Paid\n`;
      waMessage += `━━━━━━━━━━━━━━━━━━━━━\n`;
      waMessage += `_Thank you for doing business with ${storeName}!_\n`;
      if (storePhone) waMessage += `Hotline: ${storePhone}`;

      const waUrl = cleanPhone
        ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(waMessage)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(waMessage)}`;

      window.open(waUrl, '_blank');
    } else if (target === 'email') {
      const emailSubject = `${docType} #${docNumber} - ${storeName}`;
      let emailBody = `Dear ${customerName},\n\n`;
      emailBody += `Please find the official link to download your ${docType} #${docNumber}:\n\n`;
      emailBody += `📥 Download Document (${format.toUpperCase()}):\n${publicDownloadUrl}\n\n`;
      emailBody += `Summary Details:\n`;
      emailBody += `- ${docType} No: ${docNumber}\n`;
      emailBody += `- Total Amount: ৳${Number(netPayable).toLocaleString()}\n`;
      emailBody += `- Amount Paid: ৳${Number(paidAmount).toLocaleString()}\n`;
      emailBody += `- Remaining Due: ৳${Number(dueAmount).toLocaleString()}\n\n`;
      emailBody += `Thank you for choosing ${storeName}!\n`;
      if (storePhone) emailBody += `Contact / Helpline: ${storePhone}\n`;

      const mailto = `mailto:${customerEmail || ''}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      window.open(mailto, '_blank');
    }

    if (onStatusChange) onStatusChange('done');
    return { success: true, method: 'link_fallback', url: publicDownloadUrl };
  } catch (err) {
    if (onStatusChange) onStatusChange('error');
    console.error('Invoice share failed:', err);
    throw err;
  }
}
